/**
 * @version 0.11
 */
import AsyncStorage from '@react-native-community/async-storage'
import firebase from 'react-native-firebase'

import Log from '../../../services/Log/Log'
import cryptoWalletsDS from '../../DataSource/CryptoWallets/CryptoWallets'

import BlocksoftKeysForRefStorage from '../../../../crypto/actions/BlocksoftKeysForRef/BlocksoftKeysForRefStorage'
import BlocksoftKeysForRef from '../../../../crypto/actions/BlocksoftKeysForRef/BlocksoftKeysForRef'
import CashBackActions from './CashBackActions'
import MarketingEvent from '../../../services/Marketing/MarketingEvent'


export default new class CashBackUtils {
    constructor() {
        this.walletToken = ''
        this.walletPublicAddress = ''
        this.savedData = false
        this.inited = false
    }

    init = async (force = false) => {
        if (!force && this.inited) {
            return false
        }
        this.walletToken = await AsyncStorage.getItem('walletToken')
        if (!this.walletToken) {
            await this.createWalletSignature(false)
        }
        if (!this.walletToken) {
            return false
        }
        if (!this.savedData) {
            let tmp = await AsyncStorage.getItem('cashbackAllData_' + this.walletToken)
            if (tmp) {
                try {
                    tmp = JSON.parse(tmp)
                    if (tmp && typeof tmp !== 'undefined') {
                        this.savedData = tmp
                        await CashBackActions.setCashBackDataFromApi(this.savedData)
                    }
                } catch (e) {
                    // do nothing
                }
            }
        }

        this.parentToken = false
        const tmpParentToken = await AsyncStorage.getItem('parentTokenRechecked')

        if (typeof tmpParentToken !== 'undefined' && tmpParentToken != null && tmpParentToken) {
            this.parentToken = tmpParentToken
            await CashBackActions.setParentToken(this.parentToken)
        } else {
            try {
                const firebaseUrl = await firebase.links().getInitialLink()
                if (typeof firebaseUrl !== 'undefined' && firebaseUrl != null) {
                    MarketingEvent.logEvent('cashback_parent_link', firebaseUrl)
                    const firebaseUrlArray = firebaseUrl.split('=')
                    this.parentToken = firebaseUrlArray[firebaseUrlArray.length - 1]
                    await AsyncStorage.setItem('parentTokenRechecked',  this.parentToken)
                    await CashBackActions.setParentToken(this.parentToken)
                    MarketingEvent.logEvent('cashback_parent_fire', {parent : this.parentToken})
                }
            } catch (e) {
                Log.log('SRV/CashBack init parent error ' + e.message)
            }
        }
        this.inited = true
    }

    setCashBackDataFromApi = async (data) => {
        this.savedData = data
        await AsyncStorage.setItem('cashbackAllData_' + this.walletToken,  JSON.stringify(data))
        if (data.parentToken && this.parentToken !== data.parentToken) {
            this.parentToken = data.parentToken
            await AsyncStorage.setItem('parentTokenRechecked', data.parentToken)
        }
        await CashBackActions.setCashBackDataFromApi(data)
    }

    setParentToken = async (parentToken) => {
        if (this.parentToken) {
            return false
        }
        this.parentToken = parentToken
        await AsyncStorage.setItem('parentTokenRechecked', parentToken)
        await CashBackActions.setParentToken(this.parentToken)
    }

    getByHash = async (tmpHash, source) => {
        let tmpPublicAndPrivateResult = await BlocksoftKeysForRefStorage.getPublicAndPrivateResultForHash(tmpHash)
        if (tmpPublicAndPrivateResult && typeof tmpPublicAndPrivateResult.cashbackToken !== 'undefined') {
            // Log.log('SRV/CashBack getByHash ' + tmpHash + ' => ' + tmpPublicAndPrivateResult.cashbackToken)
            return tmpPublicAndPrivateResult
        }
        Log.log('SRV/CashBack getByHash need to discoverPublic', tmpHash)
        const mnemonic = await cryptoWalletsDS.getWallet(tmpHash, source)
        if (!mnemonic) {
           return false
        }
        Log.log('SRV/CashBack getByHash got mnemonic to discoverPublic')
        tmpPublicAndPrivateResult = await BlocksoftKeysForRef.discoverPublicAndPrivate({ mnemonic })
        Log.log('SRV/CashBack getByHash done discoverPublic ' + tmpHash + ' => ' + tmpPublicAndPrivateResult.cashbackToken)
        try {
            await BlocksoftKeysForRefStorage.setPublicAndPrivateResultForHash(tmpHash, tmpPublicAndPrivateResult)
        } catch (e) {
            const logData = { ...tmpPublicAndPrivateResult }
            logData.privateKey = '***'
            Log.log('SRV/CashBack getByHash save error ' + e.message + ' ' + tmpHash + ' => ' + JSON.stringify(logData))
        }
        return tmpPublicAndPrivateResult
    }

    createWalletSignature = async (actualSign = true, msg = false, _requestAuthHash = false) => {
        try {
            let tmpAuthHash = _requestAuthHash
            if (!tmpAuthHash) {
                tmpAuthHash = await cryptoWalletsDS.getSelectedWallet()
            }
            if (!tmpAuthHash) {
                return false
            }
            const { privateKey, address, cashbackToken } = await this.getByHash(tmpAuthHash, 'ACT/CashBackUtils createSignatureWallet')
            if (!privateKey) {
                return false
            }
            let tmp = true
            if (actualSign) {
                if (!msg) {
                    msg = new Date().getTime()
                }
                tmp = await BlocksoftKeysForRef.signDataForApi(msg + '', privateKey)
                tmp.signedAddress = address
            }
            if (_requestAuthHash) {
                // not changing settings
                tmp.cashbackToken = cashbackToken
                return tmp
            }

            await AsyncStorage.setItem('walletToken', cashbackToken)
            this.walletToken = cashbackToken
            this.walletPublicAddress = address
            tmp.cashbackToken = cashbackToken
            return tmp
        } catch (e) {
            Log.err('SRV/CashBack createWalletSignature error ' + e.message, e)
        }
    }

    getParentToken = () => {
        return this.parentToken
    }

    getWalletToken = () => {
        return this.walletToken
    }

    getWalletPublicAddress = () => {
        return this.walletPublicAddress
    }
}
