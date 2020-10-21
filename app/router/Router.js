/**
 * @version 0.10
 */
import React from 'react'
import { createAppContainer } from 'react-navigation'
import { createStackNavigator } from 'react-navigation-stack'

import WalletCreateStack from './WalletCreateStack'
import WalletBackupStack from './WalletBackupStack'

import ErrorScreen from './ErrorScreen'

import InitScreen from '../modules/Init/InitScreen'
import WalletCreateScreen from '../modules/WalletCreate/WalletCreateScreen'
import EnterMnemonicPhrase from '../modules/WalletCreate/EnterMnemonicPhrase'
import EnterMnemonicPhraseGoogle from '../modules/WalletCreate/EnterMnemonicPhraseGoogle'
import QRCodeScannerScreen from '../modules/QRCodeScanner/QRCodeScannerScreen'

import HomeScreenStack from './HomeStack'
import ExchangeScreenStack from './ExchangeScreenStack'
import ExchangeV3ScreenStack from './ExchangeV3ScreenStack'
import TradeScreenStack from './TradeScreenStack'
import TradeV3ScreenStack from './TradeV3ScreenStack'
import SettingsScreenStack from './SettingsStack'

import AddCardScreen from '../modules/Card'
import SendScreen from '../modules/Send/SendScreen'
import ConfirmSendScreen from '../modules/Send/ConfirmSendScreen'

import LoadScreen from '../modules/Load/LoadScreen'

import LockScreen from '../modules/LockScreen/LockScreen'

import AboutScreen from '../modules/About/AboutScreen'
import FioChooseRecipient from '../modules/FIO/FioChooseRecipient'
import FioSendRequest from '../modules/FIO/FioSendRequest'
import FioRequestsList from '../modules/FIO/FioRequestsList'
import FioChooseAddress from '../modules/FIO/FioChooseAddress'
import FioRequestDetails from '../modules/FIO/FioRequestDetails'
import FioSettings from '../modules/FIO/FioSettings'
import AccountScreen from '../modules/Account/AccountScreen'
import ReceiveScreen from '../modules/Account/ReceiveScreen'
import AddAssetScreen from '../modules/AddAsset/AddAssetScreen'
import AddCustomTokenScreen from '../modules/AddCustomToken/AddCustomTokenScreen'
import SMSCodeScreen from '../modules/Trade/SMSCodeScreen'


const MainNavigator = createStackNavigator({
        InitScreen: {
            screen: InitScreen,
            navigationOptions: {
                headerShown: false
            }
        },

        ErrorScreen: {
            screen: ErrorScreen,
            navigationOptions: {
                headerShown: false
            }
        },

        ConfirmSendScreen: {
            screen: ConfirmSendScreen,
            navigationOptions: {
                headerShown: false
            }
        },

        SendScreen: {
            screen: SendScreen,
            navigationOptions: {
                headerShown: false
            }
        },

        FioChooseRecipient: {
            screen: FioChooseRecipient,
            navigationOptions: {
                headerShown: false
            }
        },

        FioChooseAddress: {
            screen: FioChooseAddress,
            navigationOptions: {
                headerShown: false
            }
        },

        FioSendRequest: {
            screen: FioSendRequest,
            navigationOptions: {
                headerShown: false
            }
        },

        FioRequestsList: {
            screen: FioRequestsList,
            navigationOptions: {
                headerShown: false
            }
        },

        FioRequestDetails: {
            screen: FioRequestDetails,
            navigationOptions: {
                headerShown: false
            }
        },

        FioSettings: {
            screen: FioSettings,
            navigationOptions: {
                headerShown: false
            }
        },


        AccountScreen: {
            screen: AccountScreen,
            navigationOptions: {
                headerShown: false
            }
        },

        ReceiveScreen: {
            screen: ReceiveScreen,
            navigationOptions: {
                headerShown: false
            }
        },

        QRCodeScannerScreen: {
            screen: QRCodeScannerScreen,
            navigationOptions: {
                headerShown: false
            }
        },
        EnterMnemonicPhrase: {
            screen: EnterMnemonicPhrase,
            navigationOptions: {
                headerShown: false
            }
        },
        EnterMnemonicPhraseGoogle: {
            screen: EnterMnemonicPhraseGoogle,
            navigationOptions: {
                headerShown: false
            }
        },
        WalletCreateScreen: {
            screen: WalletCreateScreen,
            navigationOptions: {
                headerShown: false
            }
        },

        DashboardStack: {
            screen: HomeScreenStack,
            navigationOptions: {
                headerShown: false
            }
        },

        HomeScreenStack: {
            screen: HomeScreenStack,
            navigationOptions: {
                headerShown: false
            }
        },

        TradeScreenStack: {
            screen: TradeScreenStack,
            navigationOptions: {
                headerShown: false
            }
        },

        ExchangeScreenStack: {
            screen: ExchangeScreenStack,
            navigationOptions: {
                headerShown: false
            }
        },

        ExchangeV3ScreenStack: {
            screen: ExchangeV3ScreenStack,
            navigationOptions: {
                headerShown: false
            }
        },

        TradeV3ScreenStack: {
            screen: TradeV3ScreenStack,
            navigationOptions: {
                headerShown: false
            }
        },

        SettingsScreenStack: {
            screen: SettingsScreenStack,
            navigationOptions: {
                headerShown: false
            }
        },

        AddAssetScreen: {
            screen: AddAssetScreen,
            navigationOptions: {
                headerShown: false
            }
        },

        AddCustomTokenScreen: {
            screen: AddCustomTokenScreen,
            navigationOptions: {
                headerShown: false
            }
        },

        WalletCreateStack: {
            screen: WalletCreateStack,
            navigationOptions: {
                headerShown: false
            }
        },

        WalletBackupStack: {
            screen: WalletBackupStack,
            navigationOptions: {
                headerShown: false
            }
        },

        LockScreen: {
            screen: LockScreen,
            navigationOptions: {
                headerShown: false
            }
        },
        AboutScreen: {
            screen: AboutScreen,
            navigationOptions: {
                headerShown: false
            }
        },
        AddCardScreen: {
            screen: AddCardScreen,
            navigationOptions: {
                headerShown: false
            }
        },
        LoadScreen: {
            screen: LoadScreen,
            navigationOptions: {
                headerShown: false
            }
        },
        SMSCodeScreen: {
            screen: SMSCodeScreen,
            navigationOptions: {
                headerShown: false
            }
        }
    },
    {
        initialRouteName: 'LoadScreen'
    }
)

export default createAppContainer(MainNavigator)


