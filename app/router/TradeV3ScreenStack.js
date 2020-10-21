/**
    * @version 0.1
    * @author yura
 */
import { createStackNavigator } from 'react-navigation-stack'

import MainV3DataScreen from '../modules/Trade/MainV3DataScreen'

const TradeV3ScreenStack = createStackNavigator(
    {
        MainV3DataScreen: {
            screen: MainV3DataScreen,
            navigationOptions: {
                headerShown: false
            }
        },
    },
    {
        initialRouteName: 'MainV3DataScreen'
    }
)

export default TradeV3ScreenStack
