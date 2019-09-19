import AsyncStorage from '@react-native-community/async-storage'

import firebase from 'react-native-firebase'

import axios from 'axios'

import store from '../../store'

import cryptoWalletsDS from '../../appstores/DataSource/CryptoWallets/CryptoWallets'

import BlocksoftKeysForRef from '../../../crypto/actions/BlocksoftKeysForRef/BlocksoftKeysForRef'

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
    _packageName = 'com.trustee.demo'

    /**
     *
     * @type {string}
     * @private
     */
    _appStoreID = '1234567890'

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

    constructor() {

        const { mode, apiEndpoints } = cashbackConfig

        this._baseURL = mode === 'DEV' ? apiEndpoints.baseURLTest : apiEndpoints.baseURL
    }

    reInit = () => {
        const { mode, apiEndpoints } = cashbackConfig

        this._baseURL = mode === 'DEV' ? apiEndpoints.baseURLTest : apiEndpoints.baseURL
    }

    init = async () => {
        try {

            const authHash = await cryptoWalletsDS.getSelectedWallet()
            const mnemonic = await cryptoWalletsDS.getWallet(authHash)

            let discoverPublicAndPrivateResult = await BlocksoftKeysForRef.discoverPublicAndPrivate({ mnemonic })

            const parentToken = await this.getParentToken()
            const cashbackToken = await this.createCashbackToken(discoverPublicAndPrivateResult)

            const cashbackLink = await this.generateDynamicLink()
            const signature = await this.createSignature(discoverPublicAndPrivateResult)
            const fcmToken = await AsyncStorage.getItem('fcmToken')


            const getStatisticsReqData = {
                deviceToken: fcmToken,
                locale: i18n.locale.split('-')[0],
                cashbackToken: this._cashbackToken,
                dynamicLink: this._dynamicLink,
                signedData: signature,
                timestamp: +new Date()
            }

            parentToken != null ? getStatisticsReqData.parentToken = parentToken : null

            const res = await axios.post(`${this._baseURL}${this._getStatisticsRoute}`, getStatisticsReqData)

            if (res.data.status == 'failed') {
                Log.err('Cashback.api error', res)
                throw new Error('Cashback api error')
            }

        } catch (e) {
            Log.err('Cashback.init error', e)
        }
    }

    /**
     *
     * @returns {Promise<string>}
     */
    generateDynamicLink = async () => {

        const {
            _cashbackToken,
            _baseURL,
            _middleURL,
            _domainURIPrefix,
            _packageName,
            _appStoreID,
            _dynamicLinkType,
        } = this

        try {
            const dynamicLink = new firebase
                .links.DynamicLink(`${_baseURL}${_middleURL}${_cashbackToken}`, _domainURIPrefix)
                .android.setPackageName(_packageName)
                .ios.setBundleId(_packageName)
                .ios.setAppStoreId(_appStoreID)

            const tmpLink = await firebase.links().createShortDynamicLink(dynamicLink, _dynamicLinkType)

            this._dynamicLink = tmpLink

        } catch (e) {
            Log.err('Cashback.getCashbacklLink error', e)
        }

    }

    getParentToken = async () => {
        const tmpParentToken = await AsyncStorage.getItem('parentToken')
        if(typeof tmpParentToken != 'undefined' && tmpParentToken != null) return tmpParentToken


        let parentToken = null
        const firebaseUrl = await firebase.links().getInitialLink()
        if(typeof firebaseUrl != 'undefined' && firebaseUrl != null){
            const firebaseUrlArray = firebaseUrl.split('=')
            parentToken = firebaseUrlArray[firebaseUrlArray.length - 1]
            await AsyncStorage.setItem('parentToken', parentToken)
        }

        return parentToken
    }

    createSignature = async (discoverPublicAndPrivateResult) => {
        try {
            if(typeof discoverPublicAndPrivateResult == 'undefined'){
                const authHash = await cryptoWalletsDS.getSelectedWallet()
                const mnemonic = await cryptoWalletsDS.getWallet(authHash)
                const result = await BlocksoftKeysForRef.discoverPublicAndPrivate({ mnemonic })

                return BlocksoftKeysForRef.signDataForApi(new Date().toString(), result.privateKey)
            } else {
                const { privateKey } = discoverPublicAndPrivateResult
                return BlocksoftKeysForRef.signDataForApi(new Date().toString(), privateKey)
            }
        } catch (e) {
            Log.err('Cashback.createSignature error', e)
        }
    }

    createCashbackToken = async (discoverPublicAndPrivateResult) => {
        try {
            let { cashbackToken } = discoverPublicAndPrivateResult

            this._cashbackToken = cashbackToken
            await AsyncStorage.setItem('cashbackToken', cashbackToken)
        } catch (e) {
            Log.err('Cashback.createCashbackToken error', e)
        }
    }

    getCashbackData = async (walletHash) => {

        try {
            const parentToken = await this.getParentToken()

            const mnemonic = await cryptoWalletsDS.getWallet(walletHash)
            let { cashbackToken } = await BlocksoftKeysForRef.discoverPublicAndPrivate({ mnemonic })

            const {
                _baseURL,
                _middleURL,
                _domainURIPrefix,
                _packageName,
                _appStoreID,
                _dynamicLinkType,
            } = this

            const dynamicLink = new firebase
                .links.DynamicLink(`${_baseURL}${_middleURL}${cashbackToken}`, _domainURIPrefix)
                .android.setPackageName(_packageName)
                .ios.setBundleId(_packageName)
                .ios.setAppStoreId(_appStoreID)

            const tmpLink = await firebase.links().createShortDynamicLink(dynamicLink, _dynamicLinkType)


            const result = await BlocksoftKeysForRef.discoverPublicAndPrivate({ mnemonic })

            const signature = await BlocksoftKeysForRef.signDataForApi(new Date().toString(), result.privateKey)

            const getStatisticsReqData = {
                cashbackToken: cashbackToken,
                dynamicLink: tmpLink,
                signedData: signature,
                timestamp: +new Date()
            }

            parentToken != null ? getStatisticsReqData.parentToken = parentToken : null


            const res = await axios.post(`${this._baseURL}${this._getStatisticsRoute}`, getStatisticsReqData)

            dispatch({
                type: 'SET_CASHBACK_DATA',
                data: res.data.data
            })

            if (res.data.status == 'failed') {
                Log.err('Cashback.api error', res)
                throw new Error('Cashback api error')
            }
        } catch (e) {
            Log.err('Cashback.getCashbackData error', e)
        }

    }
}

