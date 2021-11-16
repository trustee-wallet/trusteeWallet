import { Dimensions, PixelRatio } from 'react-native'

import NavStore from '@app/components/navigation/NavStore'

import currencyActions from '@app/appstores/Stores/Currency/CurrencyActions'
import { SendActionsStart } from '@app/appstores/Stores/Send/SendActionsStart'
import { showModal } from '@app/appstores/Stores/Modal/ModalActions'
import { setSelectedAccount, setSelectedAccountTransactions, setSelectedCryptoCurrency } from '@app/appstores/Stores/Main/MainStoreActions'

import { strings } from '@app/services/i18n'
import Log from '@app/services/Log/Log'
import MarketingEvent from '@app/services/Marketing/MarketingEvent'
import checkTransferHasError from '@app/services/UI/CheckTransferHasError/CheckTransferHasError'

import UpdateAccountBalanceAndTransactions from '@app/daemons/back/UpdateAccountBalanceAndTransactions'
import UpdateAccountBalanceAndTransactionsHD from '@app/daemons/back/UpdateAccountBalanceAndTransactionsHD'
import UpdateAccountListDaemon from '@app/daemons/view/UpdateAccountListDaemon'
import DaemonCache from '@app/daemons/DaemonCache'

import BlocksoftPrettyNumbers from '@crypto/common/BlocksoftPrettyNumbers'

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

  const tmp = totalBalance.toString().split('.')
  const beforeDecimal = BlocksoftPrettyNumbers.makeCut(tmp[0]).separated
  let afterDecimal = ''
  if (typeof tmp[1] !== 'undefined') {
    afterDecimal = '.' + tmp[1].substr(0, 2)
  }

  return { currencySymbol, beforeDecimal, afterDecimal }
}

const handleCurrencySelect = async (props, screen) => {
  if (CACHE_CLICK) return

  const { cryptoCurrency } = props

  let status = ''
  CACHE_CLICK = true

  if (typeof cryptoCurrency.currencyCode !== 'undefined' && cryptoCurrency.currencyCode === 'NFT') {
    try {
      setSelectedCryptoCurrency(cryptoCurrency)
      NavStore.goNext(screen || 'NftMainScreen')
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

export {
  SIZE,
  handleHide,
  handleSend,
  handleReceive,
  handleLateRefresh,
  getBalanceData,
  handleCurrencySelect
}
