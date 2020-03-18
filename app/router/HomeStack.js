import { createStackNavigator } from 'react-navigation-stack'
import HomeScreen from '../modules/WalletList/HomeScreen'

import AccountScreen from '../modules/Account/AccountScreen'

// import CryptoListScreen from '../modules/WalletCrypto/CryptoListScreen'

import ReceiveScreen from '../modules/Account/ReceiveScreen'

const HomeStack = createStackNavigator(
    {
        HomeScreen: {
            screen: HomeScreen,
            navigationOptions: {
                headerShown: false
            }
        },

        /* CryptoListScreen: {
            screen: CryptoListScreen,
            navigationOptions: {
                headerShown: false
            }
        },*/

        /*AccountListScreen: {
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
