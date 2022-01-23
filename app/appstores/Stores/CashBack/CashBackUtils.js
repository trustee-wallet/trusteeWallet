/**
 * @version 0.42
 */
import dynamicLinks from '@react-native-firebase/dynamic-links'

import Log from '@app/services/Log/Log'
import cryptoWalletsDS from '@app/appstores/DataSource/CryptoWallets/CryptoWallets'

import BlocksoftKeysForRefStorage from '@crypto/actions/BlocksoftKeysForRef/BlocksoftKeysForRefStorage'
import BlocksoftKeysForRef from '@crypto/actions/BlocksoftKeysForRef/BlocksoftKeysForRef'

import cashBackActions from './CashBackActions'

import MarketingEvent from '@app/services/Marketing/MarketingEvent'
import ApiProxy from '@app/services/Api/ApiProxy'
import store from '@app/store'
import trusteeAsyncStorage from '@appV2/services/trusteeAsyncStorage/trusteeAsyncStorage'
import settingsActions from '@app/appstores/Stores/Settings/SettingsActions'

import branch from 'react-native-branch'

const NativeLinking = require('../../../../node_modules/react-native/Libraries/Linking/NativeLinking').default

const CACHE_DATA_FROM_API = {}


class CashBackUtils {
    constructor() {
        this.walletToken = ''
        this.walletHash = ''
        this.inited = false
    }

    init = async (params = {}, source) => {
        if (typeof params.force === 'undefined' || !params.force) {
            if (this.inited) {
                return false
            }
        }
        let firebaseUrl = false
        try {
            firebaseUrl = await dynamicLinks().getInitialLink()
            await Log.log('SRV/CashBack init dynamicLinks().getInitialLink() ' + JSON.stringify(firebaseUrl))

            const tmp2 = await NativeLinking.getInitialURL()
            await Log.log('SRV/CashBack init NativeLinking.getInitialURL() ' + JSON.stringify(tmp2))

            // Branch
            let branchData
            try {
                branchData = await branch.getFirstReferringParams()
                await Log.log('SRV/CashBack init branch.getFirstReferringParams() ' + JSON.stringify(branchData))
            } catch (e) {
                await Log.log('SRV/CashBack init branch.getFirstReferringParams() error ' + e.message)
            }

            if (firebaseUrl && typeof firebaseUrl !== 'undefined') {
                if (typeof firebaseUrl.url !== 'undefined' && firebaseUrl.url) {
                    firebaseUrl = firebaseUrl.url
                }
            } else if (tmp2 && typeof tmp2 !== 'undefined' && tmp2 !== '') {
                firebaseUrl = tmp2
            } else if (branchData && typeof branchData !== 'undefined') {
                if (branchData.$desktop_url && typeof branchData.$desktop_url !== 'undefined') {
                    firebaseUrl = branchData.$desktop_url
                }
            }

            if (firebaseUrl && typeof firebaseUrl !== 'undefined' && firebaseUrl !== '') {
                await Log.log('SRV/CashBack init firebaseUrl save ' + firebaseUrl)
                await trusteeAsyncStorage.setFirebaseDynamicUrl(firebaseUrl)
            } else {
                const tmp3 = await trusteeAsyncStorage.getFirebaseDynamicUrl()
                await Log.log('SRV/CashBack init firebaseUrl from saved ' + JSON.stringify(tmp3))
                if (tmp3 && typeof tmp3 !== 'undefined') {
                    firebaseUrl = tmp3
                }
            }
            await Log.log('SRV/CashBack init dynamicLinks().getInitialLink() final url ' + firebaseUrl)
        } catch (e) {
            await Log.log('SRV/CashBack init dynamicLinks().getInitialLink() error ' + e.message)
        }

        const selectedWallet = store.getState().mainStore.selectedWallet
        if (!selectedWallet || typeof selectedWallet === 'undefined') {
            await Log.log('SRV/CashBack init stopped as no selectedWallet ')
            return false
        }

        const updateObj = {}
        updateObj.cashbackLinkTitle = selectedWallet.walletCashback
        updateObj.cashbackToken = selectedWallet.walletCashback
        if (updateObj.cashbackToken !== this.walletToken) {
            updateObj.dataFromApi = CACHE_DATA_FROM_API[updateObj.cashbackToken] || {}
        }


        this.walletToken = selectedWallet.walletCashback
        this.parentToken = false

        const tmpParentToken = await trusteeAsyncStorage.getCashbackParent()
        await Log.log('SRV/CashBack init parent from AsyncStorage => ' + tmpParentToken)
        if (typeof tmpParentToken !== 'undefined' && tmpParentToken != null && tmpParentToken && tmpParentToken !== '') {
            this.parentToken = tmpParentToken
            updateObj.parentToken = this.parentToken
        } else {
            try {
                if (typeof firebaseUrl !== 'undefined' && firebaseUrl != null && firebaseUrl) {
                    MarketingEvent.logEvent('cashback_parent_link', { firebaseUrl })
                    const firebaseUrlArray = firebaseUrl.split('=')
                    await Log.log('SRV/CashBack init parent firebaseUrlArray ' + JSON.stringify(firebaseUrlArray))
                    if (firebaseUrlArray.length > 1) {
                        const tmpParent = firebaseUrlArray[firebaseUrlArray.length-1]
                        await Log.log('SRV/CashBack init parent tmpParent ' + JSON.stringify(tmpParent))
                        if (tmpParent) {
                            this.parentToken = tmpParent
                            await trusteeAsyncStorage.setCashbackParent(this.parentToken)
                            updateObj.parentToken = this.parentToken
                            MarketingEvent.logEvent('cashback_parent_fire', { parent: this.parentToken })
                        }
                    }
                }
            } catch (e) {
                await Log.log('SRV/CashBack init parent error ' + e.message)
            }
        }
        await Log.log('SRV/CashBack saved parent from AsyncStorage => ' + tmpParentToken, params)
        await cashBackActions.updateAll(updateObj, 'CashBackUtils.init')
        this.inited = true
    }

    setCashBackDataFromApi = async (data) => {
        const updateObj = {dataFromApi : data, error : {}}
        if (data.cashbackToken) {
            CACHE_DATA_FROM_API[data.cashbackToken] = data
            const selectedWallet = store.getState().mainStore.selectedWallet
            if (!selectedWallet || typeof selectedWallet === 'undefined') {
                await Log.log('SRV/CashBack setCashBackDataFromApi stopped as no selectedWallet ')
                return false
            }
            if (selectedWallet.walletCashback && selectedWallet.walletCashback !== data.cashbackToken) {
                await Log.log('SRV/CashBack setCashBackDataFromApi stopped selectedWallet != loadedWallet ' + selectedWallet.walletCashback + ' !== ' + data.cashbackToken)
                return false
            }
            updateObj.cashbackToken = data.cashbackToken
        }
        if (data.parentToken && this.parentToken !== data.parentToken) {
            this.parentToken = data.parentToken
            trusteeAsyncStorage.setCashbackParent(data.parentToken)
            updateObj.parentToken = this.parentToken
        }
        if (data.customToken) {
            updateObj.cashbackLinkTitle = data.customToken
        }
        await cashBackActions.updateAll(updateObj, 'CashBackUtils.fromApi')
    }

    setParentToken = async (parentToken) => {
        if (this.parentToken || !parentToken || parentToken === '') {
            return false
        }
        this.parentToken = parentToken
        await trusteeAsyncStorage.setCashbackParent(parentToken)
        await cashBackActions.updateAll({ parentToken }, 'CashBackUtils.setParentToken')
    }

    getByHash = async (tmpHash, source) => {
        let tmpPublicAndPrivateResult = await BlocksoftKeysForRefStorage.getPublicAndPrivateResultForHash(tmpHash)
        if (tmpPublicAndPrivateResult && typeof tmpPublicAndPrivateResult.cashbackToken !== 'undefined') {
            // Log.log('SRV/CashBack getByHash ' + tmpHash + ' => ' + tmpPublicAndPrivateResult.cashbackToken)
            return tmpPublicAndPrivateResult
        }
        // await Log.log('SRV/CashBack getByHash need to discoverPublic', tmpHash)
        const mnemonic = await cryptoWalletsDS.getWallet(tmpHash, source)
        if (!mnemonic) {
           return false
        }
        // await Log.log('SRV/CashBack getByHash got mnemonic to discoverPublic')
        tmpPublicAndPrivateResult = await BlocksoftKeysForRef.discoverPublicAndPrivate({ mnemonic })
        // await Log.log('SRV/CashBack getByHash done discoverPublic ' + tmpHash + ' => ' + tmpPublicAndPrivateResult.cashbackToken)
        try {
            await BlocksoftKeysForRefStorage.setPublicAndPrivateResultForHash(tmpHash, tmpPublicAndPrivateResult)
        } catch (e) {
            const logData = { ...tmpPublicAndPrivateResult }
            logData.privateKey = '***'
            await Log.log('SRV/CashBack getByHash save error ' + e.message + ' ' + tmpHash + ' => ' + JSON.stringify(logData))
        }
        return tmpPublicAndPrivateResult
    }

    createWalletSignature = async (actualSign = true, msg = false, _requestAuthHash = false) => {
        try {
            let tmpAuthHash = _requestAuthHash
            if (!tmpAuthHash) {
                tmpAuthHash = await settingsActions.getSelectedWallet('createWalletSignature')
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
                    msg = await ApiProxy.getServerTimestampIfNeeded()
                    if (!msg) {
                        msg = new Date().getTime()
                    }
                }
                tmp = await BlocksoftKeysForRef.signDataForApi(msg + '', privateKey)
                tmp.signedAddress = address
            }
            if (_requestAuthHash) {
                // not changing settings
                tmp.cashbackToken = cashbackToken
                return tmp
            }
            this.walletToken = cashbackToken
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

}

const singleCashBackUtils = new CashBackUtils()
export default singleCashBackUtils
