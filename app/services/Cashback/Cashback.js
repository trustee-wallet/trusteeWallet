import AsyncStorage from '@react-native-community/async-storage'

import firebase from 'react-native-firebase'

import axios from 'axios'

import store from '../../store'

import cryptoWalletsDS from '../../appstores/DataSource/CryptoWallets/CryptoWallets'

import BlocksoftKeysForRef from '../../../crypto/actions/BlocksoftKeysForRef/BlocksoftKeysForRef'
import BlocksoftKeysForRefStorage from '../../../crypto/actions/BlocksoftKeysForRef/BlocksoftKeysForRefStorage'

import Log from '../Log/Log'

import config from '../../config/config'
import i18n from '../i18n'


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
    _middleURL = '/create-cb-user?parent_token='

    /**
     *
     * @type {string}
     * @private
     */
    _domainURIPrefix = 'https://trustee.page.link'

    /**
     *
     * @type {string}
     * @private
     */
    _getStatisticsRoute = '/get-cb-data'

    /**
     *
     * @type {string}
     * @private
     */
    _packageName = 'com.trusteewallet'

    /**
     *
     * @type {string}
     * @private
     */
    _appStoreID = '1462924276'

    /**
     *
     * @type {string}
     * @private
     */
    _dynamicLinkType = 'SHORT'


    /**
     *
     * @returns {Promise<string>}
     */


    /**
     * @type {string}
     */
    _dynamicLink = ''

    /**
     * @type {Object}
     */
    _currentPublicAndPrivateResult = false

    /**
     * @type {number}
     */
    tryCounter = 0

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
        if (tmpPublicAndPrivateResult && typeof (tmpPublicAndPrivateResult.cashbackToken) != 'undefined') {
            Log.log('Cashback._getByAuth ' + tmpAuthHash + ' => ' + tmpPublicAndPrivateResult.cashbackToken )
            return tmpPublicAndPrivateResult
        }
        Log.log('Cashback._getByAuth need to discoverPublic', tmpAuthHash)
        const mnemonic = await cryptoWalletsDS.getWallet(tmpAuthHash)
        Log.log('Cashback._getByAuth got mnemonic to discoverPublic')
        tmpPublicAndPrivateResult = await BlocksoftKeysForRef.discoverPublicAndPrivate({ mnemonic })
        Log.log('Cashback._getByAuth done discoverPublic ' + tmpAuthHash + ' => ' + tmpPublicAndPrivateResult.cashbackToken )
        try {
            await BlocksoftKeysForRefStorage.setPublicAndPrivateResultForHash(tmpAuthHash, tmpPublicAndPrivateResult)
        } catch (e) {
            let logData = {...tmpPublicAndPrivateResult}
            logData.privateKey = '***'
            Log.err('Cashback._getByAuth save error ' + e.message + ' ' + tmpAuthHash + ' => ' +  JSON.stringify(logData))
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

        try {
            Log.log('Cashback.init start')

            this._currentAuthHash = await cryptoWalletsDS.getSelectedWallet()

            this._currentPublicAndPrivateResult = await this._getByAuth(this._currentAuthHash)

            const parentToken = await this.getParentToken()
            const cashbackToken = await this.createCashbackToken()
            const cashbackLink = await this.generateDynamicLink()

            const signature = await this.createSignature()
            const fcmToken = await AsyncStorage.getItem('fcmToken')


            const getStatisticsReqData = {
                deviceToken: fcmToken,
                locale: i18n.locale.split('-')[0],
                cashbackToken: this._cashbackToken,
                dynamicLink: this._dynamicLink,
                signedData: signature,
                timestamp: +new Date()
            }

            if (parentToken != null) {
                getStatisticsReqData.parentToken = parentToken
            }

            const link = `${this._baseURL}${this._getStatisticsRoute}`
            Log.log('Cashback.init axios ' + link, getStatisticsReqData)
            const res = await axios.post(link, getStatisticsReqData)

            if (res.data.status === 'failed') {
                Log.err('Cashback.api error', res)
                throw new Error('Cashback api error')
            }

            Log.log('Cashback.init finished with data', res.data)

        } catch (e) {
            if (Log.isNetworkError(e.message) && this.tryCounter < 10) {
                this.tryCounter++
                Log.log('Cashback.init network try ' + this.tryCounter + ' ' + e.message)
            } else {
                let error = ' ' + e.message
                if (typeof (e._response) != 'undefined') {
                    error += ' ' + e._response
                }
                Log.err('Cashback.init error' + error)
            }
        }
    }

    generateDynamicLink = async () => {

        const {
            _cashbackToken,
            _baseURL,
            _middleURL,
            _domainURIPrefix,
            _packageName,
            _appStoreID,
            _dynamicLinkType
        } = this

        try {
            const dynamicLink = new firebase
                .links.DynamicLink(`${_baseURL}${_middleURL}${_cashbackToken}`, _domainURIPrefix)
                .android.setPackageName(_packageName)
                .ios.setBundleId(_packageName)
                .ios.setAppStoreId(_appStoreID)

            this._dynamicLink = await firebase.links().createShortDynamicLink(dynamicLink, _dynamicLinkType)
        } catch (e) {
            if (e.code === 'links/failure') {
                Log.log('Cashback.getCashbackLink error ' + e.code)
            } else {
                Log.err('Cashback.getCashbackLink error ' + e.code)
            }
        }

    }

    getParentToken = async () => {
        const tmpParentToken = await AsyncStorage.getItem('parentToken')
        if (typeof tmpParentToken != 'undefined' && tmpParentToken != null) return tmpParentToken

        let parentToken = null

        const firebaseUrl = await firebase.links().getInitialLink()

        if (typeof firebaseUrl != 'undefined' && firebaseUrl != null) {
            const firebaseUrlArray = firebaseUrl.split('=')
            parentToken = firebaseUrlArray[firebaseUrlArray.length - 1]
            await AsyncStorage.setItem('parentToken', parentToken)
        }

        return parentToken
    }

    createSignature = async () => {
        try {
            Log.log('Cashback.createSignature init')
            if (!this._currentPublicAndPrivateResult) {
                this._currentAuthHash = await cryptoWalletsDS.getSelectedWallet()
                this._currentPublicAndPrivateResult = await this._getByAuth(this._currentAuthHash)
            }
            const { privateKey, address } = this._currentPublicAndPrivateResult
            let tmp = await BlocksoftKeysForRef.signDataForApi(new Date().toString(), privateKey)
            tmp.signedAddress = address
            return tmp
        } catch (e) {
            Log.err('Cashback.createSignature error ' + e.message)
        }
    }

    createCashbackToken = async () => {
        try {
            Log.log('Cashback.createCashbackToken init')
            let { cashbackToken } = this._currentPublicAndPrivateResult
            this._cashbackToken = cashbackToken
            await AsyncStorage.setItem('cashbackToken', cashbackToken)
        } catch (e) {
            Log.err('Cashback.createCashbackToken error ' + e.message)
        }
    }

    /**
     * @todo unify with inot
     * @param walletHash
     * @return {Promise<void>}
     */
    getCashbackData = async (walletHash) => {

        try {
            Log.log('Cashback.getCashbackData init')
            const parentToken = await this.getParentToken()

            const tmpAuthHash = walletHash
            const tmpPublicAndPrivateResult = await this._getByAuth(tmpAuthHash)
            let { cashbackToken, privateKey } = tmpPublicAndPrivateResult

            const {
                _baseURL,
                _middleURL,
                _domainURIPrefix,
                _packageName,
                _appStoreID,
                _dynamicLinkType
            } = this

            const dynamicLink = new firebase
                .links.DynamicLink(`${_baseURL}${_middleURL}${cashbackToken}`, _domainURIPrefix)
                .android.setPackageName(_packageName)
                .ios.setBundleId(_packageName)
                .ios.setAppStoreId(_appStoreID)

            const tmpLink = await firebase.links().createShortDynamicLink(dynamicLink, _dynamicLinkType)

            const signature = await BlocksoftKeysForRef.signDataForApi(new Date().toString(), privateKey)

            const getStatisticsReqData = {
                cashbackToken: cashbackToken,
                dynamicLink: tmpLink,
                signedData: signature,
                timestamp: +new Date()
            }
            if (parentToken != null)  {
                getStatisticsReqData.parentToken = parentToken
            }

            const link = `${this._baseURL}${this._getStatisticsRoute}`
            Log.log('Cashback.getCashbackData axios ' + link)
            const res = await axios.post(link, getStatisticsReqData)
            Log.log('Cashback.getCashbackData result ', res.data)

            if (typeof (res.data.status) != 'undefined' && res.data.status === 'failed') {
                Log.err('Cashback.api error ' + JSON.stringify(res.data))
                throw new Error('Cashback api error')
            }

            dispatch({
                type: 'SET_CASHBACK_DATA',
                data: res.data.data
            })

            this._currentAuthHash = tmpAuthHash
            this._currentPublicAndPrivateResult = tmpPublicAndPrivateResult
        } catch (e) {
            Log.err('Cashback.getCashbackData error ' + e.message)
        }

    }

    getCashbackToken = () => this._cashbackToken

}

