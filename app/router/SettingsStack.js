import { createStackNavigator } from 'react-navigation'
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
                header: null
            }
        },
        AboutScreen: {
            screen: AboutScreen,
            navigationOptions: {
                header: null
            }
        },
        WalletList: {
            screen: WalletList,
            navigationOptions: {
                header: null
            }
        },

        LocalCurrencyScreen: {
            screen: LocalCurrencyScreen,
            navigationOptions: {
                header: null
            }
        },

        LanguageListScreen: {
            screen: LanguageListScreen,
            navigationOptions: {
                header: null
            }
        },
        CashbackScreen: {
            screen: CashbackScreen,
            navigationOptions: {
                header: null
            }
        },

        TermsOfUseScreen: {
            screen: TermsOfUseScreen,
            navigationOptions: {
                header: null
            }
        },

        PrivacyPolicyScreen: {
            screen: PrivacyPolicyScreen,
            navigationOptions: {
                header: null
            }
        },
    },
    {
        initialRouteName: 'SettingsMain',
    }
)

export default SettingsStack
