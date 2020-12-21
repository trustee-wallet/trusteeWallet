
/**
 * @version 0.9
 */
import { createStackNavigator } from 'react-navigation-stack'
import HomeScreen from '../modules/WalletList/HomeScreen'
import CashbackScreen from '../modules/Cashback/CashbackScreen'

const HomeStack = createStackNavigator(
    {
        HomeScreen: {
            screen: HomeScreen,
            navigationOptions: {
                headerShown: false
            }
        },

        CashbackScreen: {
            screen: CashbackScreen,
            navigationOptions: {
                headerShown: false
            }
        }

        /* CryptoListScreen: {
            screen: CryptoListScreen,
            navigationOptions: {
                headerShown: false
            }
        }, */

        /* AccountListScreen: {
            screen: AccountListScreen,
            navigationOptions: {
                headerShown: false
            }
        } */
    },
    {
        initialRouteName: 'HomeScreen'
    }
)

export default HomeStack
