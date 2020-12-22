/**
 * @version 0.9
 */
import { createStackNavigator } from 'react-navigation-stack'
import SettingsMainScreen from '../modules/Settings/SettingsMainScreen'
import WalletListScreen from '../modules/Settings/WalletListScreen'
import AddWalletScreen from '../modules/Settings/AddWalletScreen'
import AdvancedWalletScreen from '../modules/Settings/AdvancedWalletScreen'
import LanguageListScreen from '../modules/Settings/LanguageListScreen'
import ScannerSettingsScreen from '../modules/Settings/ScannerSettingsScreen'

import NotificationsScreen from '../modules/Settings/NotificationsScreen'
import AboutScreen from '../modules/About/AboutScreen'
import FioChooseRecipient from '../modules/FIO/FioChooseRecipient'
import FioSendRequest from '../modules/FIO/FioSendRequest'
import FioRequestsList from '../modules/FIO/FioRequestsList'
import FioChooseAddress from '../modules/FIO/FioChooseAddress'
import FioRequestDetails from '../modules/FIO/FioRequestDetails'
import FioMainSettings from '../modules/FIO/FioMainSettings'
import FioSettings from '../modules/FIO/FioSettings'
import FioAddresses from '../modules/FIO/FioAddresses'
import TermsOfUseScreen from '../modules/About/screens/TermsOfUseScreen'
import PrivacyPolicyScreen from '../modules/About/screens/PrivacyPolicyScreen'
import LocalCurrencyScreen from '../modules/Settings/LocalCurrencyScreen'

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

        FioAddresses: {
            screen: FioAddresses,
            navigationOptions: {
                headerShown: false
            }
        },

        FioMainSettings: {
            screen: FioMainSettings,
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



        WalletListScreen: {
            screen: WalletListScreen,
            navigationOptions: {
                headerShown: false
            }
        },

        AddWalletScreen: {
            screen: AddWalletScreen,
            navigationOptions: {
                headerShown: false
            }
        },

        AdvancedWalletScreen: {
            screen: AdvancedWalletScreen,
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

        NotificationsSettingsScreen: {
            screen: NotificationsScreen,
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
