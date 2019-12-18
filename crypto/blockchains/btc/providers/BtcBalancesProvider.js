import BlocksoftCryptoLog from '../../../common/BlocksoftCryptoLog'
import BlocksoftAxios from '../../../common/BlocksoftAxios'

const CACHE_ERRORS_VALID_TIME = 1200000 // 20 minutes

const CACHE_ERRORS = {
    mainTime: 0,
    mainSecondTime: 0,
    mainThirdTime: 0,
    alternativeTime: 0
}

let CACHE_HISTORY = []

class BtcBalancesProvider {
    constructor(settings) {
        if (typeof settings === 'undefined' || !settings) {
            throw new Error('BtcBalancesProvider requires settings')
        }
        if (typeof settings.network === 'undefined') {
            throw new Error('BtcBalancesProvider requires settings.network')
        }
        this._network = settings.network
        switch (settings.network) {
            case 'dogecoin':
                this._blockcypherApiPath = `https://api.blockcypher.com/v1/doge/main`
                this._smartbitApiPath = false
                this._bitapsApiPath = `https://api.bitaps.com/doge/v1`
                break
            case 'litecoin':
                this._blockcypherApiPath = `https://api.blockcypher.com/v1/ltc/main`
                this._smartbitApiPath = false
                this._bitapsApiPath = `https://api.bitaps.com/ltc/v1`
                break
            case 'mainnet':
                this._blockcypherApiPath = `https://api.blockcypher.com/v1/btc/main`
                this._smartbitApiPath = `https://api.smartbit.com.au/v1`
                this._bitapsApiPath = `https://api.bitaps.com/btc/v1`
                break
            case 'testnet':
                this._blockcypherApiPath = `https://api.blockcypher.com/v1/btc/test3`
                this._smartbitApiPath = `https://testnet-api.smartbit.com.au/v1`
                this._bitapsApiPath = `https://api.bitaps.com/btc/testnet/v1`
                break
            default:
                throw new Error('while retrieving Bitcoin Fee Processor - unknown Bitcoin network specified. Got : ' + settings.network)
        }
    }

    /**
     * https://www.blockcypher.com/dev/bitcoin/#address-balance-endpoint
     * @param {string} address
     * @return {Promise<number|string>}
     * @private
     */
    async _getMain(address) {
        let link = `${this._blockcypherApiPath}/addrs/${address}/balance`
        CACHE_HISTORY.push(link)
        let tmp = await BlocksoftAxios.get(link)
        if (typeof tmp.data.balance === 'undefined') {
            // noinspection ExceptionCaughtLocallyJS
            throw new Error('Undefined balance ' + link + ' ' + JSON.stringify(tmp.data))
        }
        return {balance : tmp.data.balance, unconfirmed : tmp.data.unconfirmed_balance}
    }

    /**
     * https://developer.bitaps.com/blockchain
     * @param {string} address
     * @return {Promise<number|string>}
     * @private
     */
    async _getMainSecond(address) {
        let link = this._bitapsApiPath + `/blockchain/address/state/${address}`
        CACHE_HISTORY.push(link)
        let tmp = await BlocksoftAxios.get(link)
        if (typeof tmp.data.data.balance === 'undefined') {
            // noinspection ExceptionCaughtLocallyJS
            throw new Error('Undefined balance ' + link + ' ' + JSON.stringify(tmp.data))
        }
        return {balance : tmp.data.data.balance, unconfirmed : tmp.data.data.pendingReceivedAmount}
    }

    /**
     * https://www.blockchain.com/ru/api/q
     * @param {string} address
     * @return {Promise<number|string>}
     * @private
     */
    async _getMainThird(address) {
        if (!(this._network === 'mainnet')) return -1
        let link = `https://blockchain.info/q/addressbalance/${address}`
        CACHE_HISTORY.push(link)
        let tmp = await BlocksoftAxios.get(link)
        return {balance: tmp.data, unconfirmed: 0}
    }


    /**
     * @param {string} address
     * @return {Promise<number|string>}
     * @private
     */
    async _getAlternative(address) {
        if (!this._smartbitApiPath) {
            return -1
        }
        let link = `${this._smartbitApiPath}/blockchain/address/${address}`
        CACHE_HISTORY.push(link)
        /**
         * @param {number} tmp.data.address.total.balance_int
         */
        let tmp = await BlocksoftAxios.get(link)
        if (typeof tmp.data.address.total.balance_int === 'undefined') {
            // noinspection ExceptionCaughtLocallyJS
            throw new Error('Undefined balance ' + link + ' ' + JSON.stringify(tmp.data))
        }
        return {balance : tmp.data.address.confirmed.balance_int, unconfirmed : tmp.data.address.unconfirmed.balance_int}

    }

    async get(address) {
        CACHE_HISTORY = []
        let balance = -1
        let now = new Date().getTime()
        BlocksoftCryptoLog.log('BtcBalancesProvider.get started ' + this._network, address)

        let provider = ''
        if (now - CACHE_ERRORS.mainTime > CACHE_ERRORS_VALID_TIME) {
            try {
                balance = await this._getMain(address)
                provider = 'blockcypher'
            } catch (e) {
                balance = -1
                CACHE_ERRORS.mainTime = now
            }
        }

        if (now - CACHE_ERRORS.mainSecondTime > CACHE_ERRORS_VALID_TIME && balance === -1) {
            try {
                balance = await this._getMainSecond(address)
                provider = 'bitaps'
            } catch (e) {
                balance = -1
                CACHE_ERRORS.mainSecondTime = now
            }
        }

        if (now - CACHE_ERRORS.mainThirdTime > CACHE_ERRORS_VALID_TIME && balance === -1) {
            try {
                balance = await this._getMainThird(address)
                provider = 'blockchaininfo'
            } catch (e) {
                balance = -1
                CACHE_ERRORS.mainThirdTime = now
            }
        }

        if (balance === -1) {
            try {
                balance = await this._getAlternative(address)
                provider = 'smartbit'
            } catch (e) {
                CACHE_ERRORS.alternativeTime = now
            }
        }

        if (balance === -1) {
            throw new Error('BtcBalancesProvider.get nothing responding ' + JSON.stringify(CACHE_HISTORY))
        }

        balance.provider = provider

        BlocksoftCryptoLog.log('BtcBalancesProvider.get finished', address + ' => (balance: ' + balance.balance + ' provider: ' + provider + ')')
        return balance
    }
}

module.exports.init = function(settings) {
    return new BtcBalancesProvider(settings)
}
