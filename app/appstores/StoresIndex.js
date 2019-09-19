import { combineReducers } from 'redux'

import mainStoreReducer from './Stores/Main/MainStore'
import createWalletStoreReducer from './Stores/CreateWallet/CreateWalletStore'
import modalReducer from "./Stores/Modal/ModalStore"
import qrCodeScannerReducer from "./Stores/QRCodeScanner/QRCodeScannerStore"
import exchangeReducer from "./Stores/Exchange/ExchangeStore"
import sendStoreReducer from "./Stores/Send/SendStore"
import settingsReducer from "./Stores/Settings/SettingsStore"
import lockScreenReducer from "./Stores/LockScreen/LockScreenStore"
import daemonReducer from './Stores/Daemon/DaemonStore'
import navigationReducer from './Stores/Navigation/NavigationStore'
import authReducer from './Stores/Auth/Auth'
import cashbackReducer from './Stores/Cashback/Cashback'
import fiatRatesReducer from './Stores/FiatRates/FiatRatesStore'
import toolTipsReducer from './Stores/ToolTips/ToolTipsStore'

export default combineReducers({
    mainStore: mainStoreReducer,
    createWalletStore: createWalletStoreReducer,
    qrCodeScannerStore: qrCodeScannerReducer,
    modalStore: modalReducer,
    exchangeStore: exchangeReducer,
    sendStore: sendStoreReducer,
    settingsStore: settingsReducer,
    lockScreenStore: lockScreenReducer,
    daemonStore: daemonReducer,
    navigationStore: navigationReducer,
    authStore: authReducer,
    cashbackStore: cashbackReducer,
    fiatRatesStore: fiatRatesReducer,
    toolTipsStore: toolTipsReducer
})