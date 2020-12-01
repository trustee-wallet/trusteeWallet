/**
 * @version 0.9
 */
import { createStackNavigator } from 'react-navigation-stack'

import MainDataScreen from '../modules/Trade/MainDataScreen'
import ConfirmScreen from '../modules/Trade/ConfirmScreen'
import FinishScreen from '../modules/Trade/FinishScreen'
import FinishErrorScreen from '../modules/Trade/FinishErrorScreen'

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

        FinishErrorScreen: {
            screen: FinishErrorScreen,
            navigationOptions: {
                headerShown: false
            }
        }
    },
    {
        initialRouteName: 'MainDataScreen'
    }
)

export default TradeScreenStack
