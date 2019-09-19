import React from 'react'
import { createStackNavigator } from 'react-navigation'

import WalletCreateStack from './WalletCreateStack'
import WalletBackupStack from './WalletBackupStack'
import WalletCryptoStack from './WalletCryptoStack'

import InitScreen from '../modules/Init/InitScreen'
import WalletCreateScreen from '../modules/WalletCreate/WalletCreateScreen'
import EnterMnemonicPhrase from '../modules/WalletCreate/EnterMnemonicPhrase'
import QRCodeScannerScreen from '../modules/QRCodeScanner'

import HomeScreenStack from './HomeStack'
import ExchangeScreenStack from './ExchangeScreenStack'
import SettingsScreenStack from './SettingsStack'

import AddCardScreen from '../modules/Card'
import SendScreen from '../modules/Send/SendScreen'

import LoadScreen from '../modules/Load'

import LockScreen from '../modules/LockScreen/LockScreen'

import AboutScreen from '../modules/About'
import AccountScreen from '../modules/Account/AccountScreen'
import ReceiveScreen from '../modules/Account/ReceiveScreen'
import AddAssetScreen from '../modules/AddAsset/AddAssetScreen'


export default (props) => {
    return createStackNavigator(
        {
            InitScreen: {
                screen: InitScreen,
                navigationOptions: {
                    header: null
                }
            },

            SendScreen: {
                screen: SendScreen,
                navigationOptions: {
                    header: null
                }
            },

            AccountScreen: {
                screen: AccountScreen,
                navigationOptions: {
                    header: null
                }
            },

            ReceiveScreen: {
                screen: ReceiveScreen,
                navigationOptions: {
                    header: null
                }
            },

            QRCodeScannerScreen: {
                screen: QRCodeScannerScreen,
                navigationOptions: {
                    header: null
                }
            },
            EnterMnemonicPhrase: {
                screen: EnterMnemonicPhrase,
                navigationOptions: {
                    header: null
                }
            },
            WalletCreateScreen: {
                screen: WalletCreateScreen,
                navigationOptions: {
                    header: null
                }
            },
            WalletCryptoStack: {
                screen: WalletCryptoStack,
                navigationOptions: {
                    header: null
                }
            },

            DashboardStack: {
                // HomeScreenStack
                screen: HomeScreenStack,
                navigationOptions: {
                    header: null
                }
            },

            HomeScreenStack: {
                screen: HomeScreenStack,
                navigationOptions: {
                    header: null
                }
            },
            
            ExchangeScreenStack: {
                screen: ExchangeScreenStack,
                navigationOptions: {
                    header: null
                }
            },

            SettingsScreenStack: {
                screen: SettingsScreenStack,
                navigationOptions: {
                    header: null
                }
            },

            AddAssetScreen: {
                screen: AddAssetScreen,
                navigationOptions: {
                    header: null
                }
            },

            WalletCreateStack: {
                screen: WalletCreateStack,
                navigationOptions: {
                    header: null
                }
            },

            WalletBackupStack: {
                screen: WalletBackupStack,
                navigationOptions: {
                    header: null
                }
            },

            LockScreen: {
                screen: LockScreen,
                navigationOptions: {
                    header: null
                }
            },
            AboutScreen: {
                screen: AboutScreen,
                navigationOptions: {
                    header: null
                }
            },
            AddCardScreen: {
                screen: AddCardScreen,
                navigationOptions: {
                    header: null
                }
            },
            LoadScreen: {
                screen: LoadScreen,
                navigationOptions: {
                    header: null
                }
            },
        },
        {
            initialRouteName: 'InitScreen',
        }
    )
}


