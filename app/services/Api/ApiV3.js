/**
 * @version 0.41
 * @author yura
 */
import Log from '../Log/Log'
import { strings, sublocale } from '../i18n'
import walletDS from '@app/appstores/DataSource/Wallet/Wallet'
import CashBackUtils from '@app/appstores/Stores/CashBack/CashBackUtils'

import database from '@react-native-firebase/database'

import config from '@app/config/config'
import BlocksoftAxios from '@crypto/common/BlocksoftAxios'
import cardDS from '@app/appstores/DataSource/Card/Card'
import MarketingEvent from '../Marketing/MarketingEvent'
import axios from 'axios'
import BlocksoftDict from '@crypto/common/BlocksoftDict'
import BlocksoftUtils from '@crypto/common/BlocksoftUtils'
import BlocksoftBalances from '@crypto/actions/BlocksoftBalances/BlocksoftBalances'
import BlocksoftPrettyNumbers from '@crypto/common/BlocksoftPrettyNumbers'
import ApiProxy from './ApiProxy'

import store from '@app/store'

import trusteeAsyncStorage from '@appV2/services/trusteeAsyncStorage/trusteeAsyncStorage'
import BlocksoftKeysScam from '@crypto/actions/BlocksoftKeys/BlocksoftKeysScam'
import { showModal } from '@app/appstores/Stores/Modal/ModalActions'
import { handleBackup } from '@app/modules/Settings/helpers'
import walletActions from '@app/appstores/Stores/Wallet/WalletActions'


const V3_ENTRY_POINT_EXCHANGE = '/mobile-exchanger'
const V3_ENTRY_POINT_SELL = '/mobile-sell'
const V3_ENTRY_POINT_BUY = '/mobile-buy'
const V3_ENTRY_POINT_CHECK = '/mobile-check'
const V3_ENTRY_POINT_SET_STATUS = '/order/update-payment-status'
const V3_ENTRY_POINT_MARKET = '/mobile-market'
const V3_ENTRY_POINT_GET_TBK_STATUS = '/order/check-tbk-for-tx'
const V3_ENTRY_POINT_APPROVE_TX_HASH = '/blockchain/set-approve-tx-hash'

const V3_KEY_PREFIX = 'TrusteeExchange'


export default {

    validateCard: async (data, forceMode = false) => {
        let { mode: exchangeMode, apiEndpoints } = config.exchange
        if (typeof forceMode !== 'undefined' && forceMode) {
            exchangeMode = forceMode
        }
        const baseUrl = exchangeMode === 'DEV' ? apiEndpoints.baseV3URLTest : apiEndpoints.baseV3URL

        try {
            let res = await axios.post(`${baseUrl}/payment-details/validate-card`, data, {
                headers: {
                    'Accept': 'multipart/form-data',
                    'Content-Type': 'multipart/form-data'
                }
            })
            return res
        } catch (e) {
            Log.err('ApiV3 validateCard e.response.data ' + JSON.stringify(e.response.data))
            Log.err('ApiV3 validateCard e.response.data.message ' + JSON.stringify(e.response.data.message))
        }
    },

    async initWallet(wallet, source) {
        const btcLegacyOrSegWit = store.getState().settingsStore.data.btc_legacy_or_segwit
        const accountList = store.getState().accountStore.accountList

        if (typeof accountList[wallet.walletHash] === 'undefined') {
            if (source === 'ApiProxy') {
                return []
            }
            if (config.debug.appErrors) {
                console.log('ApiV3 initWallet ' + wallet.walletHash + ' accountList[wallet.walletHash] is not set')
            }
            Log.log('ApiV3 initWallet ' + wallet.walletHash + ' accountList[wallet.walletHash] is not set')
            return []
        }

        const tmps = store.getState().currencyStore.cryptoCurrencies
        const currencies = {}
        for (const tmp of tmps) {
            currencies[tmp.currencyCode] = tmp
        }

        const accounts = []
        for (const currencyCode in accountList[wallet.walletHash]) {
            const account = accountList[wallet.walletHash][currencyCode]
            const resultAccount = {
                currencyCode,
                address: account.address,
                isHidden: currencies[currencyCode].isHidden,
                balance: account.balancePretty,
                unconfirmed: account.unconfirmedPretty,
                raw: account.balanceRaw,
                prettyBalanceRaw: BlocksoftPrettyNumbers.setCurrencyCode(currencyCode).makePretty(account.balanceRaw),
                currencyRateUsd: currencies[currencyCode].currencyRateUsd,
                basicCurrencyCode: account.basicCurrencyCode,
                basicCurrencyRate: account.basicCurrencyRate,
                basicCurrencyBalance: account.basicCurrencyBalance,
                basicCurrencyUnconfirmed: account.basicCurrencyUnconfirmed
            }
            if (currencyCode.indexOf('CUSTOM_') !== -1) {
                const currencySettings = BlocksoftDict.getCurrencyAllSettings(currencyCode)
                if (typeof currencySettings.tokenName !== 'undefined') {
                    resultAccount.tokenName = currencySettings.tokenName
                    resultAccount.tokenAddress = currencySettings.tokenName
                }
                if (typeof currencySettings.tokenAddress !== 'undefined' && currencySettings.tokenAddress) {
                    resultAccount.tokenAddress = currencySettings.tokenAddress
                }
                if (typeof currencySettings.tokenBlockchain !== 'undefined') {
                    resultAccount.tokenBlockchain = currencySettings.tokenBlockchain
                }
            }

            if (typeof account.legacy !== 'undefined' && typeof account.segwit !== 'undefined') {
                let legacy = account.legacy
                if (account.legacy.substr(0, 1) === '3') {
                    legacy = false // hmmm
                }
                resultAccount.legacyOrSegWit = btcLegacyOrSegWit
                resultAccount.address = [
                    {
                        address: account.segwit,
                        type: 'SEGWIT'
                    },
                    {
                        address: legacy,
                        type: 'LEGACY'
                    }
                ]
            }
            const hodl = BlocksoftBalances.setCurrencyCode(currencyCode).getBalanceHodl(account)
            resultAccount.balanceHodl = hodl
            if (hodl > 0) {
                resultAccount.balance = account.balancePretty * 1 - hodl
                resultAccount.basicCurrencyBalance = BlocksoftUtils.mul(resultAccount.balance, resultAccount.basicCurrencyRate)
            }
            accounts.push(resultAccount)
        }
        return accounts
    },

    async initData(type, inCurrencyCode = false, outCurrencyCode = false, orderHash = false) {

        Log.log('ApiV3.initData start')
        const { mode: exchangeMode, apiEndpoints } = config.exchange
        let entryURL = exchangeMode === 'DEV' ? apiEndpoints.entryURLTest : apiEndpoints.entryURL
        entryURL = type === 'MARKET' ? exchangeMode === 'DEV' ? apiEndpoints.entryMarketURLTest : apiEndpoints.entryMarketURL : entryURL


        let entryPoint
        if (type === 'EXCHANGE') {
            entryPoint = V3_ENTRY_POINT_EXCHANGE
        } else if (type === 'SELL') {
            entryPoint = V3_ENTRY_POINT_SELL
        } else if (type === 'BUY') {
            entryPoint = V3_ENTRY_POINT_BUY
        } else if (type === 'MARKET') {
            entryPoint = V3_ENTRY_POINT_MARKET
        } else {
            throw new Error('ApiV3 invalid settings type ' + type)
        }

        const data = await this.getWalletData()

        const currentToken = CashBackUtils.getWalletToken()
        const date = new Date().toISOString().split('T')
        const keyTitle = V3_KEY_PREFIX + '/' + date[0] + '/' + data.sign.signedAddress

        const useFirebase = JSON.stringify(trusteeAsyncStorage.getUseFirebaseForBSE())

        try {
            const link = entryURL + entryPoint
                + '?date=' + date[0]
                + '&message=' + data.sign.message
                + '&messageHash=' + data.sign.messageHash
                + '&signature=' + data.sign.signature
                + '&cashbackToken=' + currentToken
                + '&locale=' + sublocale()
                + '&version=' + (MarketingEvent.DATA.LOG_VERSION? MarketingEvent.DATA.LOG_VERSION.replace(/ /gi, '_') : '')
                + '&isLight=' + MarketingEvent.UI_DATA.IS_LIGHT
                + '&inCurrency=' + inCurrencyCode
                + '&outCurrency=' + outCurrencyCode
                + '&orderHash=' + orderHash
                + '&useFirebase=' + (useFirebase || 'true')

            await Log.log('ApiV3.initData start json link ' + link + ' and save to firebase ' + (data ? JSON.stringify(data).substr(0, 100) : ' no data'))
            await database().ref(keyTitle).set(data)
            await Log.log('ApiV3.initData end save to firebase link ' + link)
            Log.log('ApiV3.initData finish')
            return link
        } catch (e) {
            await Log.err('ApiV3.initData error ' + e.message)
            throw new Error('SERVER_RESPONSE_NOT_CONNECTED')
        }
    },

    async getWalletData() {
        // yurchik update anyway so do load faster
        /*
        try {
            await UpdateCardsDaemon.updateCardsDaemon({ force: true })
        } catch (e) {
            Log.log('ApiV3.initData cards recheck error ' + e.message)
            // do nothing if nothing
        }
        */

        Log.log('ApiV3.initData cardDS.getCards() start')
        const tmp = await cardDS.getCards()
        const cards = []
        if (tmp) {
            for (const card of tmp) {
                if (card.number === 'REMOVED') { // just in case
                    continue
                }
                if (card.cardCheckStatus === 'null') {
                    card.cardCheckStatus = null
                }
                cards.push(card)
            }
        }

        Log.log('ApiV3.initData cardDS.getCards() finish')

        const data = {
            locale: sublocale(),
            deviceToken: MarketingEvent.DATA.LOG_TOKEN,
            uniqueDeviceId: MarketingEvent.DATA.LOG_DEVICE_ID,
            wallets: [],
            cards
        }

        let showScam = false
        let scamWalletsTitle = ''
        const scamWallets = []
        try {
            Log.log('ApiV3.initData get wallets from state start')
            const wallets = store.getState().walletStore.wallets
            for (let wallet of wallets) {
                wallet = await walletDS._redoCashback(wallet)

                let isScam = false
                try {
                    if (await BlocksoftKeysScam.isScamCashback(wallet.walletCashback)) {
                        showScam = true
                        isScam = true
                        scamWalletsTitle += ' ' + wallet.walletCashback
                        scamWallets.push(wallet.walletHash)
                    }
                } catch (e1) {
                    if (config.debug.appErrors) {
                        console.log('ApiV3.initData build isScam error ' + e1.message, e1)
                    }
                    Log.err('ApiV3.initData build isScam error ' + e1.message)
                }

                let accounts = []
                if (!isScam) {
                    accounts = await this.initWallet(wallet, 'ApiV3')
                }
                data.wallets.push({
                    walletHash: wallet.walletHash,
                    walletName: wallet.walletName,
                    cashbackToken: wallet.walletCashback,
                    accounts
                })
            }
            Log.log('ApiV3.initData get wallets from state finish')
        } catch (e) {
            if (config.debug.appErrors) {
                console.log('ApiV3.initData build error ' + e.message, e)
            }
            Log.err('ApiV3.initData build error ' + e.message)
        }
        if (showScam) {
            showModal({
                type: 'YES_NO_MODAL',
                icon: 'WARNING',
                title: strings('settings.walletList.scamModal.title'),
                description: strings('settings.walletList.scamModal.description') + '\n\n' + scamWalletsTitle,
                oneButton: strings('settings.walletList.scamModal.remove'),
                twoButton: strings('settings.walletList.backupModal.late'),
                noCallback: async () => {
                    for (const wallet of scamWallets) {
                        try {
                            await walletActions.removeWallet(wallet)
                        } catch (e) {
                            // do nothing
                        }
                    }
                }
            }, async () => {})
        }

        let msg = await ApiProxy.getServerTimestampIfNeeded()
        if (!msg) {
            msg = new Date().getTime() + ''
        }

        Log.log('ApiV3.initData CashBackUtils.createWalletSignature start with easy')
        const hash = 'easy'
        const sign = await CashBackUtils.createWalletSignature(true, msg + '_' + hash)
        Log.log('ApiV3.initData CashBackUtils.createWalletSignature finish')
        data.sign = sign
        return data
    },

    getMobileCheck: async (orderHash) => {

        const { mode: exchangeMode, apiEndpoints } = config.exchange
        const entryUrl = exchangeMode === 'DEV' ? apiEndpoints.entryMarketURLTest : apiEndpoints.entryMarketURL
        const entryPoint = V3_ENTRY_POINT_CHECK


        const sign = await CashBackUtils.createWalletSignature(true)

        const currentToken = CashBackUtils.getWalletToken()

        try {

            const link = entryUrl + entryPoint
                + '?signature=' + sign.signature
                + '&signMessage=' + sign.message
                + '&signMessageHash=' + sign.messageHash
                + '&cashbackToken=' + currentToken
                + '&locale=' + sublocale()
                + '&orderHash=' + orderHash
                + '&version=' + (MarketingEvent.DATA.LOG_VERSION? MarketingEvent.DATA.LOG_VERSION.replace(/ /gi, '_') : '')
                + '&isLight=' + MarketingEvent.UI_DATA.IS_LIGHT
            Log.log('ApiV3 getMobileCheck link ' + link)
            return link
        } catch (e) {
            Log.err('ApiV3 getMobileCheck error ' + e.message)
            throw new Error('SERVER_RESPONSE_NOT_CONNECTED')
        }
    },

    getTBKDisable: async (transactionHash = '') => {

        const { mode: exchangeMode, apiEndpoints } = config.exchange
        const baseUrl = exchangeMode === 'DEV' ? apiEndpoints.baseV3URLTest : apiEndpoints.baseV3URL

        const sign = await CashBackUtils.createWalletSignature(true)

        const cashbackToken = CashBackUtils.getWalletToken()

        const data = {}

        data.signData = sign
        data.cashbackToken = cashbackToken
        data.txsArray = [transactionHash]


        let found = false
        try {
            const link = baseUrl + V3_ENTRY_POINT_GET_TBK_STATUS
            Log.log('ApiV3 getTBKStatus axios ' + link + ' ' + transactionHash)
            if (config.debug.appErrors) {
                console.log(new Date().toISOString() + ' ApiV3 setTBKStatus start axios ' + link + ' ' + transactionHash)
            }
            const res = await BlocksoftAxios.post(link, data, false)
            if (res && typeof res.data !== 'undefined' && typeof res.data.txs !== 'undefined') {
                for (const tmp of  res.data.txs ) {
                    if (typeof tmp.txHash !== 'undefined' && tmp.txHash === transactionHash) {
                        found = tmp.isDisableTBK
                    }
                }
            }
            if (config.debug.appErrors) {
                console.log(new Date().toISOString() + ' ApiV3 setTBKStatus end', JSON.stringify(res.data))
            }
        } catch (e) {
            if (config.debug.appErrors) {
                console.log(new Date().toISOString() + ' ApiV3 getTBKStatus e.response.data', e)
            }
            let msg =  e.message
            if (typeof e.response !== 'undefined' && typeof e.response.data !== 'undefined') {
                msg += ' ' + e.response.data
            }
            Log.err('ApiV3 getTBKStatus e.response.data ' + msg)
        }
        return found
    },

    setExchangeStatus: async (params) => {

        const { mode: exchangeMode, apiEndpoints } = config.exchange
        const baseUrl = exchangeMode === 'DEV' ? apiEndpoints.baseV3URLTest : apiEndpoints.baseV3URL

        const sign = await CashBackUtils.createWalletSignature(true)

        const cashbackToken = CashBackUtils.getWalletToken()

        const data = {}

        data.sign = sign

        data.cashbackToken = cashbackToken

        data.orderHash = params?.orderHash
        data.transactionHash = params?.transactionHash || ''
        data.paymentStatus = params?.status

        data.nonce = params?.nonce || ''
        data.providerName = params?.extraData?.providerName || ''
        data.currencyCode = params?.extraData?.currencyCode || ''

        try {
            const link = baseUrl + (data?.providerName ? V3_ENTRY_POINT_APPROVE_TX_HASH : V3_ENTRY_POINT_SET_STATUS)
            Log.log('ApiV3 setExchangeStatus axios ' + link + ' ' + JSON.stringify(params))
            if (config.debug.appErrors) {
                console.log(new Date().toISOString() + ' ApiV3 setExchangeStatus start axios ' + link + ' ' + JSON.stringify(params))
            }
            const res = await BlocksoftAxios.post(link, data, false)
            if (config.debug.appErrors) {
                console.log(new Date().toISOString() + ' ApiV3 setExchangeStatus end', JSON.stringify(res.data))
            }
            return res
        } catch (e) {
            Log.err('ApiV3 setExchangeStatus e.response.data ' + JSON.stringify(e.response.data))
        }
    },

    getExchangeOrders: async (_requestAuthHash = false) => {

        const { mode: exchangeMode, apiEndpoints } = config.exchange
        const baseUrl = exchangeMode === 'DEV' ? apiEndpoints.baseV3URLTest : apiEndpoints.baseV3URL

        let signedData = await CashBackUtils.createWalletSignature(true, false, _requestAuthHash)
        if (!signedData) {
            throw new Error('No signed for getExchangeOrders')
        }
        const cashbackToken = signedData.cashbackToken
        if (!cashbackToken) {
            throw new Error('No cashbackToken for getExchangeOrders')
        }

        let res = false
        let link = ''
        let now = 0
        try {
            let index = 0
            let serverTime = 0
            const MAX_TRY_SERVER_TIME = 4
            do {
                index++
                await Log.daemon('ApiV3 getExchangeOrders axios ' + index + ' ' + link)
                try {
                    link = `${baseUrl}/order/history-for-wallet?`
                        + `cashbackToken=${signedData.cashbackToken}&message=${signedData.message}&messageHash=${signedData.messageHash}`
                        + `&signature=${signedData.signature}&timestamp=${+new Date()}`
                    await Log.daemon('ApiV3 getExchangeOrders finished ' + index + ' ' + link)

                    now = +new Date()
                    res = await BlocksoftAxios.get(link, false)
                    if (!res) {
                        throw new Error('UI_ERROR_NETWORK_ERROR')
                    }
                } catch (e) {
                    await Log.daemon('ApiV3 getExchangeOrders error ' + e.message)
                    if (typeof e.subdata === 'undefined') {
                        throw new Error('UI_ERROR_NETWORK_ERROR')
                    }
                    res = e.subdata
                }

                if (typeof res.errorMsg !== 'undefined') {
                    await Log.daemon('ApiV3 getExchangeOrders error ', res)
                    if (typeof res.serverTimestamp !== 'undefined' && res.serverTimestamp) {
                        serverTime = res.serverTimestamp
                        res = false
                        if (!serverTime || index === MAX_TRY_SERVER_TIME) {
                            throw new Error('UI_ERROR_IME_ERROR')
                        } else {
                            await Log.daemon('ApiV3 getExchangeOrders will retry with time ' + serverTime)
                            signedData = await CashBackUtils.createWalletSignature(true, serverTime, _requestAuthHash)
                        }
                    } else {
                        throw new Error('UI_ERROR_NETWORK_ERROR')
                    }
                } else {
                    // finish ok
                    break
                }
            } while (index < MAX_TRY_SERVER_TIME)
        } catch (e) {
            // do nothing
        }

        if (res && typeof res.data !== 'undefined' && typeof res.data.orders !== 'undefined') {
            return res.data.orders
        }
        return res
    }
}
