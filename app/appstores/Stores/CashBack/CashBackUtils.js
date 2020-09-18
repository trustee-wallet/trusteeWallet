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

export default new class CashBackUtils {
    constructor() {
        this.walletToken = ''
        this.walletPublicAddress = ''
        this.savedData = false
    }

    init = async () => {
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
        const tmpParentToken = await AsyncStorage.getItem('parentToken')
        if (typeof tmpParentToken !== 'undefined' && tmpParentToken != null) {
            this.parentToken = tmpParentToken
            await CashBackActions.setParentToken(this.parentToken)
        } else {
            try {
                const firebaseUrl = await firebase.links().getInitialLink()
                if (typeof firebaseUrl !== 'undefined' && firebaseUrl != null) {
                    const firebaseUrlArray = firebaseUrl.split('=')
                    this.parentToken = firebaseUrlArray[firebaseUrlArray.length - 1]
                    await AsyncStorage.setItem('parentToken',  this.parentToken)
                    await CashBackActions.setParentToken(this.parentToken)
                }
            } catch (e) {
                Log.log('SRV/CashBack init parent error ' + e.message)
            }
        }
    }

    setCashBackDataFromApi = async (data) => {
        this.savedData = data
        await AsyncStorage.setItem('cashbackAllData_' + this.walletToken,  JSON.stringify(data))
        await CashBackActions.setCashBackDataFromApi(data)
    }

    setParentToken = async (parentToken) => {
        if (this.parentToken) {
            return false
        }
        this.parentToken = parentToken
        await AsyncStorage.setItem('parentToken', parentToken)
        await CashBackActions.setParentToken(this.parentToken)
    }

    getByHash = async (tmpHash, source) => {
        let tmpPublicAndPrivateResult = await BlocksoftKeysForRefStorage.getPublicAndPrivateResultForHash(tmpHash)
        if (tmpPublicAndPrivateResult && typeof tmpPublicAndPrivateResult.cashbackToken !== 'undefined') {
            Log.log('SRV/CashBack getByHash ' + tmpHash + ' => ' + tmpPublicAndPrivateResult.cashbackToken)
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

    createWalletSignature = async (actualSign = true, msg = false) => {
        try {
            const tmpAuthHash = await cryptoWalletsDS.getSelectedWallet()
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
            await AsyncStorage.setItem('walletToken', cashbackToken)
            this.walletToken = cashbackToken
            this.walletPublicAddress = address

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
