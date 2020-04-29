/**
 * @version 0.9
 */
import AsyncStorage from '@react-native-community/async-storage'

import firebase from 'react-native-firebase'

import store from '../../store'

import cryptoWalletsDS from '../../appstores/DataSource/CryptoWallets/CryptoWallets'

import BlocksoftKeysForRef from '../../../crypto/actions/BlocksoftKeysForRef/BlocksoftKeysForRef'
import BlocksoftKeysForRefStorage from '../../../crypto/actions/BlocksoftKeysForRef/BlocksoftKeysForRefStorage'

import MarketingEvent from '../../services/Marketing/MarketingEvent'
import Log from '../Log/Log'

import config from '../../config/config'
import i18n from '../i18n'
import BlocksoftAxios from '../../../crypto/common/BlocksoftAxios'
import {
    setCashBackApiData,
    setCashBackParentToken,
    setCashBackToken
} from '../../appstores/Stores/CashBack/CashBackActions'


const { dispatch } = store

const { cashback: cashbackConfig } = config

export default new class Cashback {

    /**
     *
     * @type {string}
     * @private
     */
    _cashbackToken = ''

    /**
     *
     * @type {string}
     * @private
     */
    _baseURL = ''

    /**
     *
     * @type {string}
     * @private
     */
    _getStatisticsRoute = '/get-cb-data'

    /**
     * @type {Object}
     */
    _currentPublicAndPrivateResult = false

    /**
     * @type {boolean}
     * @private
     */
    _initing = false


    constructor() {
        const { mode, apiEndpoints } = cashbackConfig
        this._baseURL = mode === 'DEV' ? apiEndpoints.baseURLTest : apiEndpoints.baseURL
    }

    reInit = () => {
        const { mode, apiEndpoints } = cashbackConfig
        this._baseURL = mode === 'DEV' ? apiEndpoints.baseURLTest : apiEndpoints.baseURL
    }

    _getByAuth = async (tmpAuthHash) => {
        let tmpPublicAndPrivateResult = await BlocksoftKeysForRefStorage.getPublicAndPrivateResultForHash(tmpAuthHash)
        if (tmpPublicAndPrivateResult && typeof tmpPublicAndPrivateResult.cashbackToken !== 'undefined') {
            Log.log('SRV/CashBack _getByAuth ' + tmpAuthHash + ' => ' + tmpPublicAndPrivateResult.cashbackToken)
            return tmpPublicAndPrivateResult
        }
        Log.log('SRV/CashBack _getByAuth need to discoverPublic', tmpAuthHash)
        const mnemonic = await cryptoWalletsDS.getWallet(tmpAuthHash)
        Log.log('SRV/CashBack _getByAuth got mnemonic to discoverPublic')
        tmpPublicAndPrivateResult = await BlocksoftKeysForRef.discoverPublicAndPrivate({ mnemonic })
        Log.log('SRV/CashBack _getByAuth done discoverPublic ' + tmpAuthHash + ' => ' + tmpPublicAndPrivateResult.cashbackToken)
        try {
            await BlocksoftKeysForRefStorage.setPublicAndPrivateResultForHash(tmpAuthHash, tmpPublicAndPrivateResult)
        } catch (e) {
            const logData = { ...tmpPublicAndPrivateResult }
            logData.privateKey = '***'
            Log.err('SRV/CashBack _getByAuth save error ' + e.message + ' ' + tmpAuthHash + ' => ' + JSON.stringify(logData))
            // fixing: The specified item already exists in the keychain.
        }
        return tmpPublicAndPrivateResult
    }

    getCashbackToken() {
        if (!this._currentPublicAndPrivateResult) return false
        return this._currentPublicAndPrivateResult.cashbackToken
    }

    getPublicAddress() {
        if (!this._currentPublicAndPrivateResult) return false
        return this._currentPublicAndPrivateResult.address
    }

    init = async () => {
        if (this._initing) {
            return
        }

        try {
            this._initing = true

            Log.log('SRV/CashBack init start')

            this._currentAuthHash = await cryptoWalletsDS.getSelectedWallet()

            this._currentPublicAndPrivateResult = await this._getByAuth(this._currentAuthHash)

            const parentToken = await this.getParentToken()

            const cashbackToken = await this.createCashbackToken()
            dispatch(setCashBackToken(cashbackToken))

            const signature = await this.createSignature()
            const fcmToken = await AsyncStorage.getItem('fcmToken')


            const getStatisticsReqData = {
                deviceToken: fcmToken,
                locale: i18n.locale.split('-')[0],
                signedData: signature,
                timestamp: +new Date()
            }

            if (typeof cashbackToken !== 'undefined' && cashbackToken !== null) {
                getStatisticsReqData.cashbackToken = cashbackToken
            }

            if (typeof parentToken !== 'undefined' && parentToken !== null) {
                getStatisticsReqData.parentToken = parentToken
            }

            const link = `${this._baseURL}${this._getStatisticsRoute}`
            Log.log('SRV/CashBack init axios ' + link, getStatisticsReqData)

            const res = await BlocksoftAxios.postWithoutBraking(link, getStatisticsReqData)

            if (!res || typeof res.data === 'undefined' || !res.data) {
                Log.log('SRV/CashBack init network error')
                throw new Error('UI_ERROR_CASHBACK_NETWORK_ERROR')
            }
            Log.log('SRV/CashBack init result ', res.data)

            if (typeof res.data.status !== 'undefined' && res.data.status === 'failed') {
                Log.err('SRV/CashBack init api status error ' + JSON.stringify(res.data))
                throw new Error('UI_ERROR_CASHBACK_NETWORK_ERROR')
            } else if (typeof res.data.message !== 'undefined' && res.data.message.indexOf('time') !== -1) {
                Log.log('SRV/CashBack init api message error ' + JSON.stringify(res.data))
                throw new Error('UI_ERROR_CASHBACK_NETWORK_ERROR')
            } else if (typeof res.data.data.cashbackLink !== 'undefined') {
                MarketingEvent.logEvent('get_cashback_token_result', {
                    cashbackToken,
                    cashbackLink: res.data.data.cashbackLink || '',
                    cashbackBalance: (res.data.data.cashbackBalance + '') || '',
                    invitedUsers: (res.data.data.invitedUsers + '') || '',
                    overalVolume: (res.data.data.overalVolume + '') || '',
                    weeklyVolume: (res.data.data.weeklyVolume + '') || ''
                })
            }
            Log.log('SRV/CashBack init finished with data', res.data)

            this._initing = false

            try {
                const cashBackApiData = this.prepareDataFromApi(res.data.data)
                dispatch(setCashBackApiData(cashBackApiData))
            } catch (e) {
                Log.err('SRV/CashBack init error prepareDataFromApi ' + e.message + ' ' + JSON.stringify(res.data))
            }

        } catch (e) {
            this._initing = false

            if (e.message.indexOf('UI_') === 0) {
               // do nothing
            } else {
                Log.err('SRV/CashBack init error ' + e.message, e)
            }

        }
    }

    prepareDataFromApi = (param) => {
        return {
            cashBackBalance: +param.cashbackBalance,
            level2: param.level2,
            level2Users: +param.level2Users,
            weeklyVolume: +param.weeklyVolume,
            overallVolume: +param.overalVolume,
            invitedUsers: +param.invitedUsers,
            cashBackLink: param.cashbackLink.toString()
        }
    }

    getParentToken = async () => {
        try {
            const tmpParentToken = await AsyncStorage.getItem('parentToken')
            if (typeof tmpParentToken !== 'undefined' && tmpParentToken != null) {
                dispatch(setCashBackParentToken(tmpParentToken))
                return tmpParentToken
            }

            let parentToken = null

            const firebaseUrl = await firebase.links().getInitialLink()

            if (typeof firebaseUrl !== 'undefined' && firebaseUrl != null) {
                const firebaseUrlArray = firebaseUrl.split('=')
                parentToken = firebaseUrlArray[firebaseUrlArray.length - 1]
                await AsyncStorage.setItem('parentToken', parentToken)
            }

            dispatch(setCashBackParentToken(tmpParentToken))
            return parentToken
        } catch (e) {
            Log.log('SRV/CashBack getParentToken error ' + e.message, e)
        }
    }

    createSignature = async () => {
        try {
            Log.log('SRV/CashBack createSignature init')
            if (!this._currentPublicAndPrivateResult) {
                this._currentAuthHash = await cryptoWalletsDS.getSelectedWallet()
                this._currentPublicAndPrivateResult = await this._getByAuth(this._currentAuthHash)
            }
            const { privateKey, address } = this._currentPublicAndPrivateResult
            const tmp = await BlocksoftKeysForRef.signDataForApi(new Date().toString(), privateKey)
            tmp.signedAddress = address
            return tmp
        } catch (e) {
            Log.err('SRV/CashBack createSignature error ' + e.message, e)
        }
    }

    createCashbackToken = async () => {
        try {
            Log.log('SRV/CashBack createCashbackToken init')
            const { cashbackToken } = this._currentPublicAndPrivateResult
            this._cashbackToken = cashbackToken
            await AsyncStorage.setItem('cashbackToken', cashbackToken)
            return this._cashbackToken
        } catch (e) {
            Log.err('SRV/CashBack createCashbackToken error ' + e.message, e)
        }
    }

    /**
     * @todo unify with inot
     * @param walletHash
     * @return {Promise<void>}
     */
    getCashbackData = async (walletHash) => {

        try {
            Log.log('SRV/CashBack getCashbackData init')
            const parentToken = await this.getParentToken()

            const tmpAuthHash = walletHash
            const tmpPublicAndPrivateResult = await this._getByAuth(tmpAuthHash)
            const { cashbackToken, privateKey } = tmpPublicAndPrivateResult

            dispatch(setCashBackToken(cashbackToken))

            MarketingEvent.logEvent('get_cashback_token', { cashbackToken })

            const signature = await BlocksoftKeysForRef.signDataForApi(new Date().toString(), privateKey)

            const getStatisticsReqData = {
                cashbackToken: cashbackToken,
                signedData: signature,
                timestamp: +new Date()
            }

            if (typeof parentToken !== 'undefined' && parentToken != null) {
                getStatisticsReqData.parentToken = parentToken
            }

            const link = `${this._baseURL}${this._getStatisticsRoute}`
            Log.log('SRV/CashBack getCashbackData axios ' + link)

            const res = await BlocksoftAxios.postWithoutBraking(link, getStatisticsReqData)

            if (!res || typeof res.data === 'undefined' || !res.data) {
                Log.log('SRV/CashBack getCashbackData network error')
                throw new Error('UI_ERROR_CASHBACK_NETWORK_ERROR')
            }

            Log.log('SRV CashBack.getCashbackData result ', res.data)
            if (typeof res.data.status !== 'undefined' && res.data.status === 'failed') {
                Log.err('SRV/CashBack getCashbackData api status error ' + JSON.stringify(res.data))
                throw new Error('UI_ERROR_CASHBACK_NETWORK_ERROR')
            } else if (typeof res.data.message !== 'undefined' && res.data.message.indexOf('time') !== -1) {
                Log.log('SRV/CashBack getCashbackData api message error ' + JSON.stringify(res.data))
                throw new Error('UI_ERROR_CASHBACK_NETWORK_ERROR')
            } else if (typeof res.data.data.cashbackLink !== 'undefined') {
                MarketingEvent.logEvent('get_cashback_token_result', {
                    cashbackToken,
                    cashbackLink: res.data.data.cashbackLink || '',
                    cashbackBalance: (res.data.data.cashbackBalance + '') || '',
                    invitedUsers: (res.data.data.invitedUsers + '') || '',
                    overalVolume: (res.data.data.overalVolume + '') || '',
                    weeklyVolume: (res.data.data.weeklyVolume + '') || ''
                })
            }

            try {
                const cashBackApiData = this.prepareDataFromApi(res.data.data)
                dispatch(setCashBackApiData(cashBackApiData))
            } catch (e) {
                Log.err('SRV/CashBack getCashbackData prepareDataFromApi ' + e.message + ' ' + JSON.stringify(res.data))
            }

            this._currentAuthHash = tmpAuthHash
            this._currentPublicAndPrivateResult = tmpPublicAndPrivateResult
        } catch (e) {
            if (e.message.indexOf('UI_') === 0) {
                throw e
            } else {
                Log.err('SRV/CashBack getCashbackData error ' + e.message, e)
            }
        }

    }
}
