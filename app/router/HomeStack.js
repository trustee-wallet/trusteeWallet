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
                header: null
            }
        },

        /* CryptoListScreen: {
            screen: CryptoListScreen,
            navigationOptions: {
                header: null
            }
        },*/

        /*AccountListScreen: {
            screen: AccountListScreen,
            navigationOptions: {
                header: null
            }
        } */
    },
    {
        initialRouteName: 'HomeScreen'
    }
)

export default HomeStack
