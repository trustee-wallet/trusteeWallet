import React from 'react'
import { createAppContainer } from 'react-navigation'
import { createStackNavigator } from 'react-navigation-stack'

import WalletCreateStack from './WalletCreateStack'
import WalletBackupStack from './WalletBackupStack'
import WalletCryptoStack from './WalletCryptoStack'

import InitScreen from '../modules/Init/InitScreen'
import PreloaderScreen from '../modules/Onboarding/PreloaderScreen'
import WalletCreateScreen from '../modules/WalletCreate/WalletCreateScreen'
import EnterMnemonicPhrase from '../modules/WalletCreate/EnterMnemonicPhrase'
import QRCodeScannerScreen from '../modules/QRCodeScanner'

import HomeScreenStack from './HomeStack'
import ExchangeScreenStack from './ExchangeScreenStack'
import TradeScreenStack from './TradeScreenStack'
import SettingsScreenStack from './SettingsStack'

import AddCardScreen from '../modules/Card'
import SendScreen from '../modules/Send/SendScreen'
import ConfirmSendScreen from '../modules/Send/ConfirmSendScreen'

import LoadScreen from '../modules/Load'

import LockScreen from '../modules/LockScreen/LockScreen'

import AboutScreen from '../modules/About'
import AccountScreen from '../modules/Account/AccountScreen'
import ReceiveScreen from '../modules/Account/ReceiveScreen'
import AddAssetScreen from '../modules/AddAsset/AddAssetScreen'


const MainNavigator = createStackNavigator({
        InitScreen: {
            screen: InitScreen,
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

        PreloaderScreen: {
            screen: PreloaderScreen,
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
        WalletCreateScreen: {
            screen: WalletCreateScreen,
            navigationOptions: {
                headerShown: false
            }
        },
        WalletCryptoStack: {
            screen: WalletCryptoStack,
            navigationOptions: {
                headerShown: false
            }
        },

        DashboardStack: {
            // HomeScreenStack
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
    },
    {
        initialRouteName: 'LoadScreen',
    }
)

export default createAppContainer(MainNavigator)


