import { createStackNavigator } from 'react-navigation-stack'

import MainDataScreen from '../modules/Trade/MainDataScreen'
import ConfirmScreen from '../modules/Trade/ConfirmScreen'
import FinishScreen from '../modules/Trade/FinishScreen'
import SMSCodeScreen from '../modules/Trade/SMSCodeScreen'

const TradeScreenStack = createStackNavigator(
    {
        MainDataScreen: {
            screen: MainDataScreen,
            navigationOptions: {
                headerShown: false
            }
        },

        ConfirmScreen: {
            screen: ConfirmScreen,
            navigationOptions: {
                headerShown: false
            }
        },

        FinishScreen: {
            screen: FinishScreen,
            navigationOptions: {
                headerShown: false
            }
        },

        SMSCodeScreen: {
            screen: SMSCodeScreen,
            navigationOptions: {
                headerShown: false
            }
        },
    },
    {
        initialRouteName: 'MainDataScreen',
    }
)

export default TradeScreenStack
