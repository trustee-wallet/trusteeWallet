/**
    * @version 0.2
    * @author yura
 */
import { createStackNavigator } from 'react-navigation-stack'

import MainV3DataScreen from '../modules/Trade/MainV3DataScreen'
import SMSV3CodeScreen from '../modules/Trade/SMSV3CodeScreen'

const TradeV3ScreenStack = createStackNavigator(
    {
        MainV3DataScreen: {
            screen: MainV3DataScreen,
            navigationOptions: {
                headerShown: false
            }
        },
        SMSV3CodeScreen: {
            screen: SMSV3CodeScreen,
            navigationOptions: {
                headerShown: false
            }
        }
    },
    {
        initialRouteName: 'MainV3DataScreen'
    }
)

export default TradeV3ScreenStack
