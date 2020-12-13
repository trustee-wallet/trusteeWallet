/**
 * @version 0.9
 */
import { combineReducers } from 'redux'

import mainStoreReducer from './Stores/Main/MainStore'
import createWalletStoreReducer from './Stores/CreateWallet/CreateWalletStore'
import walletStoreReducer from './Stores/Wallet/WalletStore'
import accountStoreReducer from './Stores/Account/AccountStore'
import currencyStoreReducer from './Stores/Currency/CurrencyStore'
import modalReducer from './Stores/Modal/ModalStore'
import qrCodeScannerReducer from './Stores/QRCodeScanner/QRCodeScannerStore'
import cardStoreReducer from './Stores/Card/CardStore'
import exchangeReducer from './Stores/Exchange/ExchangeStore'
import exchangeOrdersReducer from './Stores/ExchangeOrders/ExchangeOrdersStore'
import settingsReducer from './Stores/Settings/SettingsStore'
import lockScreenReducer from './Stores/LockScreen/LockScreenStore'
import navigationReducer from './Stores/Navigation/NavigationStore'
import cashBackStoreReducer from './Stores/CashBack/CashBackStore'
import toolTipsReducer from './Stores/ToolTips/ToolTipsStore'
import appNewsStoreReducer from './Stores/AppNews/AppNewsReducer'
import homeScreenStoreReducer from './Stores/HomeScreen/HomeScreenStore'

export default combineReducers({
    mainStore: mainStoreReducer,
    walletStore: walletStoreReducer,
    accountStore: accountStoreReducer,
    currencyStore: currencyStoreReducer,
    createWalletStore: createWalletStoreReducer,
    qrCodeScannerStore: qrCodeScannerReducer,
    cardStore: cardStoreReducer,
    modalStore: modalReducer,
    exchangeStore: exchangeReducer,
    exchangeOrdersStore : exchangeOrdersReducer,
    settingsStore: settingsReducer,
    lockScreenStore: lockScreenReducer,
    navigationStore: navigationReducer,
    cashBackStore: cashBackStoreReducer,
    toolTipsStore: toolTipsReducer,
    appNewsStore : appNewsStoreReducer,
    homeScreenStore: homeScreenStoreReducer
})
