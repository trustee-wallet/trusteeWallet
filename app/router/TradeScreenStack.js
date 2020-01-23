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
                header: null
            }
        },

        ConfirmScreen: {
            screen: ConfirmScreen,
            navigationOptions: {
                header: null
            }
        },

        FinishScreen: {
            screen: FinishScreen,
            navigationOptions: {
                header: null
            }
        },

        SMSCodeScreen: {
            screen: SMSCodeScreen,
            navigationOptions: {
                header: null
            }
        },
    },
    {
        initialRouteName: 'MainDataScreen',
    }
)

export default TradeScreenStack
