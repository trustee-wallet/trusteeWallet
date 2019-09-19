import { createStackNavigator } from 'react-navigation'

import SMSCodeScreen from '../modules/Exchange/SMSCodeScreen'
import MainDataScreen from '../modules/Exchange/MainDataScreen'
import InitialScreen from '../modules/Exchange/InitialScreen'

const ExchangeScreenStack = createStackNavigator(
    {
        SMSCodeScreen: {
            screen: SMSCodeScreen,
            navigationOptions: {
                header: null
            }
        },

        MainDataScreen: {
            screen: MainDataScreen,
            navigationOptions: {
                header: null
            }
        },

        // InitialScreen: {
        //     screen: InitialScreen,
        //     navigationOptions: {
        //         header: null
        //     }
        // }
    },
    {
        initialRouteName: 'MainDataScreen',
    }
)

export default ExchangeScreenStack
