import DBInterface from '../../../../app/appstores/DataSource/DB/DBInterface'
import BlocksoftKeysStorage from '../../../actions/BlocksoftKeysStorage/BlocksoftKeysStorage'
import AsyncStorage from '@react-native-community/async-storage'
import BlocksoftCryptoLog from '../../../common/BlocksoftCryptoLog'

const axios = require('axios')

const NODE_URL = 'https://lndhub.herokuapp.com'

const CACHED_ADDRESS_TO_PUBKEY = {}
const CACHED_PUBKEY_TO_LOGINS = {}

const PER_PAGE = 500
const PER_PAGE_TXS = 50

class BtcLightProvider {

    async create() {
        const url = NODE_URL + '/create'
        const res = await axios.post(url, { partnerid: 'bluewallet', accounttype: 'common' }, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            }
        })
        this._login = res.data.login
        this._pass = res.data.password
        this._accessToken = false
        this._refreshToken = false

        return { login: this._login, pass: this._pass }
    }

    async setLoginByAddressORJsonData(address, jsonData) {

        let pubKey = false
        if (typeof CACHED_ADDRESS_TO_PUBKEY[address] !== 'undefined') {
            pubKey = CACHED_ADDRESS_TO_PUBKEY[address]
        } else if (typeof jsonData !== 'undefined' && typeof jsonData.pubKey !== 'undefined' && jsonData.pubKey) {
            pubKey = jsonData.pubKey
            CACHED_ADDRESS_TO_PUBKEY[address] = jsonData.pubKey
        } else {
            const dbInterface = new DBInterface()
            const res = await dbInterface.setQueryString(`
                SELECT account_json AS accountJson
                FROM account
                WHERE currency_code='BTC_LIGHT' 
                AND address='${address}'
                LIMIT 1
                `).query()
            if (res && typeof res.array !== 'undefined' && res.array && res.array.length > 0) {
                jsonData = JSON.parse(dbInterface.unEscapeString(res.array[0].accountJson))
                pubKey = jsonData.pubKey
                CACHED_ADDRESS_TO_PUBKEY[address] = jsonData.pubKey
            }
        }

        if (!pubKey) {
            throw new Error('BtcLightProvider.setLoginByAddressORJsonData noPubKey for ' + address + ' ' + JSON.stringify(jsonData))
        }

        let loginData
        if (typeof CACHED_PUBKEY_TO_LOGINS[pubKey] !== 'undefined') {
            loginData = CACHED_PUBKEY_TO_LOGINS[pubKey]
        } else {
            loginData = await BlocksoftKeysStorage.getLoginCache(pubKey)
            CACHED_PUBKEY_TO_LOGINS[pubKey] = loginData
        }

        if (!loginData) {
            throw new Error('BtcLightProvider.setLoginByAddressORJsonData noLoginData for ' + address + ' ' + pubKey)
        }

        await this.setLogin(loginData.login, loginData.pass)
    }

    async setLogin(login, pass) {
        if (this._login === login && this._pass === pass) {
            return false
        }
        this._login = login
        this._pass = pass
        this._accessToken = false
        this._refreshToken = await AsyncStorage.getItem('refreshToken_' + login)
        return false
    }

    async login() {
        const now = +new Date()
        if (this._accessToken && this._accessTs) {
            if (now - this._accessTs < 7200000) { // 2 hours
                return true
            }
        }
        if (this._refreshToken) {
            const url1 = NODE_URL + '/auth?type=refresh_token'
            let res1 = false
            try {
                res1 = await axios.post(url1, { refresh_token: this._refreshToken }, {
                    headers: {
                        'Access-Control-Allow-Origin': '*',
                        'Content-Type': 'application/json'
                    }
                })
                if (res1) {
                    this._accessTs = now
                    this._accessToken = res1.data.access_token
                    this._refreshToken = res1.data.refresh_token
                    await AsyncStorage.setItem('refreshToken_' + this._login, this._refreshToken)
                    return true
                }
            } catch (e) {
                // do nothing - go to login
            }
        }

        const url2 = NODE_URL + '/auth?type=auth'
        const res2 = await axios.post(url2, { login: this._login, password: this._pass }, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            }
        })
        this._accessTs = now
        this._accessToken = res2.data.access_token
        this._refreshToken = res2.data.refresh_token
        await AsyncStorage.setItem('refreshToken_' + this._login, this._refreshToken)
        return true
    }


    async getBtcAddress() {
        await this.login()
        const url = NODE_URL + '/getbtc'
        const res = await axios.get(url, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json',
                Authorization: 'Bearer ' + this._accessToken
            }
        })
        return res.data[0].address
    }

    async getBalanceBlockchain() {
        const url = NODE_URL + '/balance'
        let res = { data: false }
        try {
            await this.login()
            res = await axios.get(url, {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json',
                    Authorization: 'Bearer ' + this._accessToken
                }
            })
        } catch (e) {

        }
        return res.data
    }

    async createInvoice(amt, memo) {
        const url = NODE_URL + '/addinvoice'
        let res = { data: false }
        try {
            await this.login()
            res = await axios.post(url, { amt, memo }, {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json',
                    Authorization: 'Bearer ' + this._accessToken
                }
            })
        } catch (e) {
            if (typeof res.response.data !== 'undefined') {
                const e2 = new Error(res.response.data)
                e2.code = 'ERROR_USER'
                throw e2
            }
            if (typeof e.response.data !== 'undefined') {
                const e2 = new Error(e.response.data)
                e2.code = 'ERROR_USER'
                throw e2
            }
            e.code = 'ERROR_USER'
            throw e
        }
        return res.data
    }

    async checkInvoice(hash) {
        const url = NODE_URL + '/checkrouteinvoice?invoice=' + hash
        let res = { data: false }
        try {
            await this.login()
            res = await axios.get(url, {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json',
                    Authorization: 'Bearer ' + this._accessToken
                }
            })
        } catch (e) {
            if (typeof res.response.data !== 'undefined') {
                const e2 = new Error(res.response.data)
                e2.code = 'ERROR_USER'
                throw e2
            }
            if (typeof e.response.data !== 'undefined') {
                const e2 = new Error(e.response.data)
                e2.code = 'ERROR_USER'
                throw e2
            }
            e.code = 'ERROR_USER'
            throw e
        }

        return res.data
    }

    async payInvoice(hash, amount) {
        const url = NODE_URL + '/payinvoice'
        const data = {
            invoice: hash, amount: amount
        }
        let res = { data: false }
        try {
            await this.login()
            res = await axios.post(url, data, {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json',
                    Authorization: 'Bearer ' + this._accessToken
                }
            })
        } catch (e) {
            if (typeof res.response.data !== 'undefined') {
                e.message = res.response.data
            }
            e.code = 'ERROR_USER'
            throw e
        }
        return res.data
    }

    async getTransactionsBlockchain(offset) {
        let url = NODE_URL + '/gettxs?limit=' + PER_PAGE_TXS
        if (offset > 1) {
            url += '&offset=' + PER_PAGE_TXS * offset
        }
        BlocksoftCryptoLog.log('BtcLightProcessor.getTransactions started ')
        let res = { data: false }
        try {
            await this.login()
            res = await axios.get(url, {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json',
                    Authorization: 'Bearer ' + this._accessToken
                }
            })
            BlocksoftCryptoLog.log('BtcLightProcessor.getTransactions finished txs:' + res.data.length)
        } catch (e) {
            BlocksoftCryptoLog.log('BtcLightProcessor.getTransactions error ' + e.message)
        }
        return { txs: res.data, PER_PAGE: PER_PAGE_TXS }
    }

    async getPending(offset) {
        if (offset > 1) {
            return { txs: false } // when i will fork
        }
        const url = NODE_URL + '/getpending'
        BlocksoftCryptoLog.log('BtcLightProcessor.getPendings started ')
        let res = { data: false }
        try {
            await this.login()
            res = await axios.get(url, {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json',
                    Authorization: 'Bearer ' + this._accessToken
                }
            })
            BlocksoftCryptoLog.log('BtcLightProcessor.getPending finished txs:' + res.data.length)
        } catch (e) {
            BlocksoftCryptoLog.log('BtcLightProcessor.getPending error ' + e.message)
        }
        return { txs: res.data}
    }

    async getUserInvoices(offset) {
        if (offset > 1) {
            return { invoices: false } // when i will fork
        }
        BlocksoftCryptoLog.log('BtcLightProcessor.getUserInvoices started ')
        const url = NODE_URL + '/getuserinvoices?limit=' + PER_PAGE
        let res = { data: false }
        try {
            await this.login()
            res = await axios.get(url, {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json',
                    Authorization: 'Bearer ' + this._accessToken
                }
            })
            BlocksoftCryptoLog.log('BtcLightProcessor.getUserInvoices finished txs:' + res.data.length)
        } catch (e) {
            BlocksoftCryptoLog.log('BtcLightProcessor.getUserInvoices error ' + e.message)
        }
        return { invoices: res.data, PER_PAGE: PER_PAGE }
    }
}

const singleBtcLightProvider = new BtcLightProvider()
export default singleBtcLightProvider
