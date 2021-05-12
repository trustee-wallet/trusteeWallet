/**
 * @version 0.9
 */
import { combineReducers } from 'redux'

import mainStoreReducer from './Stores/Main/MainStore'
import initStoreReducer from '@app/appstores/Stores/Init/InitStore'
import createWalletStoreReducer from './Stores/CreateWallet/CreateWalletStore'
import walletStoreReducer from './Stores/Wallet/WalletStore'
import accountStoreReducer from './Stores/Account/AccountStore'
import currencyStoreReducer from './Stores/Currency/CurrencyStore'
import modalReducer from './Stores/Modal/ModalStore'
import qrCodeScannerReducer from './Stores/QRCodeScanner/QRCodeScannerStore'
import settingsReducer from './Stores/Settings/SettingsStore'
import lockScreenReducer from './Stores/LockScreen/LockScreenStore'
import cashBackStoreReducer from './Stores/CashBack/CashBackStore'
import toolTipsReducer from './Stores/ToolTips/ToolTipsStore'
import appNewsStoreReducer from './Stores/AppNews/AppNewsReducer'
import sendScreenStoreReducer from './Stores/Send/SendScreenStore'

export default combineReducers({
    mainStore: mainStoreReducer,
    initStore : initStoreReducer,
    walletStore: walletStoreReducer,
    accountStore: accountStoreReducer,
    currencyStore: currencyStoreReducer,
    createWalletStore: createWalletStoreReducer,
    qrCodeScannerStore: qrCodeScannerReducer,
    modalStore: modalReducer,
    settingsStore: settingsReducer,
    lockScreenStore: lockScreenReducer,
    cashBackStore: cashBackStoreReducer,
    toolTipsStore: toolTipsReducer,
    appNewsStore : appNewsStoreReducer,
    sendScreenStore: sendScreenStoreReducer
})
