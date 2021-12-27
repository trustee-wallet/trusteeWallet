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
import currencyBasicReducer from './Stores/CurrencyBasic/CurrencyBasicStore'
import modalReducer from './Stores/Modal/ModalStore'
import qrCodeScannerReducer from './Stores/QRCodeScanner/QRCodeScannerStore'
import settingsReducer from './Stores/Settings/SettingsStore'
import lockScreenReducer from './Stores/LockScreen/LockScreenStore'
import cashBackStoreReducer from './Stores/CashBack/CashBackStore'
import appNewsStoreReducer from './Stores/AppNews/AppNewsReducer'
import sendScreenStoreReducer from './Stores/Send/SendScreenStore'
import walletConnectStoreReducer from '@app/appstores/Stores/WalletConnect/WalletConnectStore'
import walletDappStoreReducer from '@app/appstores/Stores/WalletDapp/WalletDappStore'
import streamSupportStoreReducer from '@app/appstores/Stores/StreamSupport/StreamSupportStore'
import nftsStoreReducer from '@app/appstores/Stores/Nfts/NftsStore'
import nftCustomAssetsStoreReducer from '@app/appstores/Stores/NftCustomAssets/NftCustomAssetsStore'

export default combineReducers({
    mainStore: mainStoreReducer,
    initStore : initStoreReducer,
    walletStore: walletStoreReducer,
    accountStore: accountStoreReducer,
    currencyStore: currencyStoreReducer,
    currencyBasicStore : currencyBasicReducer,
    createWalletStore: createWalletStoreReducer,
    qrCodeScannerStore: qrCodeScannerReducer,
    modalStore: modalReducer,
    settingsStore: settingsReducer,
    lockScreenStore: lockScreenReducer,
    cashBackStore: cashBackStoreReducer,
    appNewsStore : appNewsStoreReducer,
    sendScreenStore: sendScreenStoreReducer,
    walletConnectStore : walletConnectStoreReducer,
    walletDappStore : walletDappStoreReducer,
    streamSupportStore : streamSupportStoreReducer,
    nftsStore : nftsStoreReducer,
    nftCustomAssetsStore : nftCustomAssetsStoreReducer
})
