import { Dimensions, PixelRatio } from 'react-native'

import _sortBy from 'lodash/sortBy'
import _orderBy from 'lodash/orderBy'
import _isEqual from 'lodash/isEqual'
import _groupBy from 'lodash/groupBy'

import NavStore from '@app/components/navigation/NavStore'

import currencyActions from '@app/appstores/Stores/Currency/CurrencyActions'
import { SendActionsStart } from '@app/appstores/Stores/Send/SendActionsStart'
import { showModal } from '@app/appstores/Stores/Modal/ModalActions'
import { setSelectedAccount, setSelectedAccountTransactions, setSelectedCryptoCurrency } from '@app/appstores/Stores/Main/MainStoreActions'

import { strings } from '@app/services/i18n'
import Log from '@app/services/Log/Log'
import MarketingEvent from '@app/services/Marketing/MarketingEvent'
import checkTransferHasError from '@app/services/UI/CheckTransferHasError/CheckTransferHasError'
import RateEquivalent from '@app/services/UI/RateEquivalent/RateEquivalent'

import UpdateAccountBalanceAndTransactions from '@app/daemons/back/UpdateAccountBalanceAndTransactions'
import UpdateAccountBalanceAndTransactionsHD from '@app/daemons/back/UpdateAccountBalanceAndTransactionsHD'
import UpdateAccountListDaemon from '@app/daemons/view/UpdateAccountListDaemon'
import DaemonCache from '@app/daemons/DaemonCache'

import BlocksoftPrettyNumbers from '@crypto/common/BlocksoftPrettyNumbers'
import trusteeAsyncStorage from '@appV2/services/trusteeAsyncStorage/trusteeAsyncStorage'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const PIXEL_RATIO = PixelRatio.get()

let SIZE = 16
if (PIXEL_RATIO === 2 && SCREEN_WIDTH < 330) {
    SIZE = 8 // iphone 5s
}

let CACHE_IS_SCANNING = false
let CACHE_CLICK = false

// linked to stores
const handleHide = async (cryptoCurrency) => {
    try {
        MarketingEvent.logEvent('gx_currency_hide', { currencyCode: cryptoCurrency.currencyCode, source: 'HomeScreen' }, 'GX')
        await currencyActions.toggleCurrencyVisibility({
            currencyCode: cryptoCurrency.currencyCode,
            newIsHidden: 1,
            currentIsHidden: cryptoCurrency.isHidden
        })
    } catch (e) {
        Log.err('HomeScreen.handleHide error ' + e.message, cryptoCurrency)
        showModal({
            type: 'INFO_MODAL',
            icon: null,
            title: strings('modal.exchange.sorry'),
            description: e.message
        })
    }
}

// separated from stores not to be updated from outside
const handleSend = async (cryptoCurrency, account) => {
    try {
        await SendActionsStart.startFromHomeScreen(cryptoCurrency, account)
    } catch (e) {
        Log.err('HomeScreen.handleSend error ' + e.message, cryptoCurrency)
        showModal({
            type: 'INFO_MODAL',
            icon: null,
            title: strings('modal.exchange.sorry'),
            description: e.message
        })
    }
}

// linked to stores as rates / addresses could be changed outside
const handleReceive = async (cryptoCurrency, account) => {
    let status = ''
    try {
        status = 'setSelectedCryptoCurrency started'

        await setSelectedCryptoCurrency(cryptoCurrency)

        status = 'setSelectedAccount started'

        await setSelectedAccount('HomeScreen.handleReceive')

        NavStore.goNext('AccountReceiveScreen')

        if (typeof account !== 'undefined' && account) {
            status = 'checkTransferHasError started'
            await checkTransferHasError({
                walletHash: account.walletHash,
                currencyCode: cryptoCurrency.currencyCode,
                currencySymbol: cryptoCurrency.currencySymbol,
                addressFrom: account.address,
                addressTo: account.address
            })
        }
    } catch (e) {
        Log.err('HomeScreen.handleReceive error ' + status + ' ' + e.message, cryptoCurrency)
        showModal({
            type: 'INFO_MODAL',
            icon: null,
            title: strings('modal.exchange.sorry'),
            description: e.message
        })
    }
}

const handleLateRefresh = async () => {
    if (CACHE_IS_SCANNING) return false
    CACHE_IS_SCANNING = true
    try {

        try {
            await UpdateAccountBalanceAndTransactions.updateAccountBalanceAndTransactions({ force: true })
        } catch (e) {
            Log.errDaemon('WalletList.HomeScreen handleLateRefresh error updateAccountBalanceAndTransactionsDaemon ' + e.message)
        }

        try {
            await UpdateAccountBalanceAndTransactionsHD.updateAccountBalanceAndTransactionsHD({ force: true })
        } catch (e) {
            Log.errDaemon('WalletList.HomeScreen handleLateRefresh error updateAccountBalanceAndTransactionsHDDaemon ' + e.message)
        }

        try {
            await UpdateAccountListDaemon.forceDaemonUpdate()
        } catch (e) {
            Log.errDaemon('WalletList.HomeScreen handleLateRefresh error updateAccountListDaemon ' + e.message)
        }
    } catch (e) {
        Log.err('WalletList.HomeScreen handleLateRefresh error ' + e.message)
    }
    CACHE_IS_SCANNING = false
}

const getBalanceData = (props) => {
    const { walletHash } = props.selectedWalletData
    const { localCurrencySymbol } = props.walletsGeneralData
    let currencySymbol = localCurrencySymbol

    const CACHE_SUM = DaemonCache.getCache(walletHash)



    let totalBalance = 0
    if (CACHE_SUM && typeof CACHE_SUM.balance !== 'undefined' && CACHE_SUM.balance) {
        totalBalance = CACHE_SUM.balance
        if (currencySymbol !== CACHE_SUM.basicCurrencySymbol) {
            currencySymbol = CACHE_SUM.basicCurrencySymbol
        }
    }

    const cashbackStore = props.cashbackStore
    const findCashback = props.currencies.find(item => item.currencyCode === 'CASHBACK')
    if (typeof findCashback !== 'undefined' && typeof cashbackStore !== 'undefined') {
        if (typeof cashbackStore.dataFromApi !== 'undefined' && typeof cashbackStore.dataFromApi.cashbackBalance !== 'undefined' && cashbackStore.dataFromApi.cashbackBalance) {
            const accountRates = DaemonCache.getCacheRates('USDT')
            const value = (cashbackStore.dataFromApi.cashbackBalance * 1 + cashbackStore.dataFromApi.cpaBalance * 1) || 0
            const basicCurrencyBalanceNorm = RateEquivalent.mul({
                value,
                currencyCode: 'USDT',
                basicCurrencyRate: accountRates.basicCurrencyRate
            })
            totalBalance = totalBalance * 1 + basicCurrencyBalanceNorm * 1
        }
    }

    const tmp = totalBalance.toString().split('.')
    const beforeDecimal = BlocksoftPrettyNumbers.makeCut(tmp[0]).separated
    let afterDecimal = ''
    if (typeof tmp[1] !== 'undefined') {
        afterDecimal = '.' + tmp[1].substr(0, 2)
    }

    return { currencySymbol, beforeDecimal, afterDecimal }
}

const handleCurrencySelect = async (props, screen, ref) => {

    const { cryptoCurrency } = props
    const { currencyCode } = cryptoCurrency

    if (CACHE_CLICK) {
        Log.log('HomeScreen.Currency ' + currencyCode + ' already started as ' + CACHE_CLICK)
        return
    }
    Log.log('HomeScreen.Currency ' + currencyCode + ' started')

    let status = ''

    if (props.constructorMode) {
        ref?.open()
        CACHE_CLICK = false
        return
    }

    CACHE_CLICK = currencyCode
    if (typeof cryptoCurrency.currencyCode !== 'undefined' && (cryptoCurrency.currencyCode === 'NFT' || cryptoCurrency.currencyCode === 'CASHBACK')) {

        const defaultScreen = cryptoCurrency.currencyCode === 'CASHBACK' ? 'CashbackScreen' : 'NftMainScreen'

        try {
            setSelectedCryptoCurrency(cryptoCurrency)
            NavStore.goNext(screen || defaultScreen)
        } catch (e) {
            Log.err('HomeScreen.Currency handleCurrencySelect NFT error ' + e.message, cryptoCurrency)
        }

        CACHE_CLICK = false
        return false
    }

    try {

        // Log.log('HomeScreen.Currency handleCurrencySelect inited ', cryptoCurrency)

        status = 'setSelectedCryptoCurrency started'

        setSelectedCryptoCurrency(cryptoCurrency)

        status = 'setSelectedAccount started'

        await setSelectedAccount('CryptoCurrency.handleCurrencySelect')

        await setSelectedAccountTransactions('CryptoCurrency.handleCurrencySelect')

        // Log.log('HomeScreen.Currency handleCurrencySelect finished ', cryptoCurrency)

        NavStore.goNext('AccountScreen')

    } catch (e) {
        Log.err('HomeScreen.Currency handleCurrencySelect error ' + status + ' ' + e.message, cryptoCurrency)

        showModal({
            type: 'INFO_MODAL',
            icon: null,
            title: strings('modal.exchange.sorry'),
            description: e.message
        })
    }
    CACHE_CLICK = false
}

const getSortedData = (array, currentArray, accountList, sortValue, filter = false) => {

    // Log.log('HomeScreen.helper.getSortedData selectedFilter ' + filter)

    let results = []

    try {

        switch (sortValue) {
            case 'byTrustee':
                results = array
                break
            case 'byName': 
                results = _sortBy(array, 'currencySymbol')
                break
            case 'custom': {
                const currenciesOrder = trusteeAsyncStorage.getCurrenciesList()
                const currenciesLength = currentArray.length

                results = _orderBy(currentArray, c => currenciesOrder.indexOf(c.currencyCode) !== -1 ? currenciesOrder.indexOf(c.currencyCode) : currenciesLength)
                break
            }
            case 'byValue': {
                let sortedAccount = _orderBy(accountList, function (obj) {
                    return obj?.balancePretty ? parseFloat(obj.balancePretty.toString().replace(/\s+/g, ''), 10) : 0
                }, 'desc')

                sortedAccount = _orderBy(sortedAccount, function (obj) {
                    return obj?.basicCurrencyBalance ? parseFloat(obj.basicCurrencyBalance.toString().replace(/\s+/g, ''), 10) : 0
                }, 'desc').map(item => item.currencyCode)

                sortedAccount = _orderBy(array, x => {
                    return sortedAccount.indexOf(x.currencyCode) !== -1 ? sortedAccount.indexOf(x.currencyCode) : currentArray.length
                })
                results = sortedAccount
                break
            }
            case 'coinFirst':
                results = [...array.filter(item => item.currencyType === 'special'), ..._sortBy(array.filter(item => item.currencyType !== 'special'), 'currencyType')]
                break
            case 'tokenFirst':
                results = [...array.filter(item => item.currencyType === 'special'), ..._sortBy(array.filter(item => item.currencyType !== 'special'), 'currencyType').reverse()]
                break
            default: {
                results = filter ? currentArray : array
                break
            }
        }

        if (filter) {
            const filterAccount = accountList.filter(item => parseFloat(item.basicCurrencyBalance.toString().replace(/\s+/g, ''), 10) > 0).map(item => item.currencyCode)
            return results.filter(item => filterAccount.includes(item.currencyCode))
        }

    } catch (e) {
        Log.log('HomeScreen.getSortedData error ' + JSON.stringify(e))
    }

    return results
}

const getSectionsData = (array) => {
    const sections = _groupBy(array, 'currencyType')
    if (sections?.custom) {
        sections.token = [...sections.token, ...sections.custom]
        delete sections.custom
    }

    const _tmp = Object.keys(sections).map((key) => ({ title: key, data: sections[key] }))
    return _tmp
}

const getDerivedState = (nextProps, prevState) => {
    let newState = null

    if (!_isEqual(nextProps.currencies, prevState.originalData)) {
        newState = {}
        const currenciesOrder = prevState.currenciesOrder
        const currenciesLength = nextProps.currencies.length
        const data = _orderBy(nextProps.currencies, c => currenciesOrder.indexOf(c.currencyCode) !== -1 ? currenciesOrder.indexOf(c.currencyCode) : currenciesLength)

        newState.originalData = nextProps.currencies
        newState.data = getSortedData(nextProps.currencies, data, nextProps.accountList, nextProps.sortValue, nextProps.homeFilterWithBalance)
        newState.sortValue = nextProps.sortValue || prevState.sortValue
        newState.homeFilterWithBalance = nextProps.homeFilterWithBalance || prevState.homeFilterWithBalance

        const newOrder = data.map(c => c.currencyCode)
        if (currenciesOrder.length && !_isEqual(currenciesOrder, newOrder)) {
            newState.currenciesOrder = newOrder
            trusteeAsyncStorage.setCurrenciesList(newOrder)
        }
    }

    return newState
}

export {
    SIZE,
    handleHide,
    handleSend,
    handleReceive,
    handleLateRefresh,
    getBalanceData,
    handleCurrencySelect,
    getSortedData,
    getSectionsData,
    getDerivedState
}
