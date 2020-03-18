import { createStackNavigator } from 'react-navigation-stack'
import SettingsMain from '../modules/Settings/SettingsMainScreen'
import WalletList from '../modules/Settings/WalletListScreen'
import LanguageListScreen from '../modules/Settings/LanguageListScreen'
import CashbackScreen from '../modules/Settings/CashbackScreen'

import AboutScreen from '../modules/About/'
import TermsOfUseScreen from '../modules/About/screens/TermsOfUseScreen'
import PrivacyPolicyScreen from '../modules/About/screens/PrivacyPolicyScreen'
import LocalCurrencyScreen from '../modules/Settings/LocalCurrencyScreen'

const SettingsStack = createStackNavigator(
    {
        SettingsMain: {
            screen: SettingsMain,
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
        WalletList: {
            screen: WalletList,
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
        },
    },
    {
        initialRouteName: 'SettingsMain',
    }
)

export default SettingsStack
