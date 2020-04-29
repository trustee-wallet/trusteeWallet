/**
 * @version 0.9
 */
import { createStackNavigator } from 'react-navigation-stack'

import StartScreen from '../modules/Exchange/StartScreen'
import MainDataScreen from '../modules/Exchange/MainDataScreen'
import FinishScreen from '../modules/Exchange/FinishScreen'

const exchangeScreenStack = createStackNavigator(
    {
        StartScreen: {
            screen: StartScreen,
            navigationOptions: {
                headerShown: false
            }
        },

        MainDataScreen: {
            screen: MainDataScreen,
            navigationOptions: {
                headerShown: false
            }
        },

        FinishScreen: {
            screen: FinishScreen,
            navigationOptions: {
                headerShown: false
            }
        }
    },
    {
        initialRouteName: 'StartScreen'
    }
)

export default exchangeScreenStack
