/**
 * @version 0.9
 */
import { createStackNavigator } from 'react-navigation-stack'
import SettingsMainScreen from '../modules/Settings/SettingsMainScreen'
import WalletListScreen from '../modules/Settings/WalletListScreen'
import LanguageListScreen from '../modules/Settings/LanguageListScreen'
import ScannerSettingsScreen from '../modules/Settings/ScannerSettingsScreen'
import CashbackScreen from '../modules/Settings/CashbackScreen'

import AboutScreen from '../modules/About/AboutScreen'
import ChooseFioRecipient from '../modules/FIO/ChooseFioRecipient'
import TermsOfUseScreen from '../modules/About/screens/TermsOfUseScreen'
import PrivacyPolicyScreen from '../modules/About/screens/PrivacyPolicyScreen'
import LocalCurrencyScreen from '../modules/Settings/LocalCurrencyScreen'
import AppNewsScreen from '../modules/Settings/AppNewsScreen'

const SettingsStack = createStackNavigator(
    {
        SettingsMainScreen: {
            screen: SettingsMainScreen,
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
        ChooseFioRecipient: {
            screen: ChooseFioRecipient,
            navigationOptions: {
                headerShown: false
            }
        },
        WalletListScreen: {
            screen: WalletListScreen,
            navigationOptions: {
                headerShown: false
            }
        },

        LocalCurrencyScreen: {
            screen: LocalCurrencyScreen,
            navigationOptions: {
                headerShown: false
            }
        },

        LanguageListScreen: {
            screen: LanguageListScreen,
            navigationOptions: {
                headerShown: false
            }
        },

        ScannerSettingsScreen: {
            screen: ScannerSettingsScreen,
            navigationOptions: {
                headerShown: false
            }
        },

        AppNewsScreen: {
            screen: AppNewsScreen,
            navigationOptions: {
                headerShown: false
            }
        },


        CashbackScreen: {
            screen: CashbackScreen,
            navigationOptions: {
                headerShown: false
            }
        },

        TermsOfUseScreen: {
            screen: TermsOfUseScreen,
            navigationOptions: {
                headerShown: false
            }
        },

        PrivacyPolicyScreen: {
            screen: PrivacyPolicyScreen,
            navigationOptions: {
                headerShown: false
            }
        }
    },
    {
        initialRouteName: 'SettingsMainScreen'
    }
)

export default SettingsStack
