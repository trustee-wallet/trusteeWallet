/**
 * @version 0.9
 */
import { createStackNavigator } from 'react-navigation-stack'

import MainDataScreen from '../modules/Exchange/MainDataScreen'
import MainV3DataScreen from '../modules/Exchange/MainV3DataScreen'
import ExchangeConfirmScreen from '../modules/Exchange/ExchangeConfirmScreen'
import FinishScreen from '../modules/Exchange/FinishScreen'

const ExchangeScreenStack = createStackNavigator(
    {
        MainDataScreen: {
            screen: MainDataScreen,
            navigationOptions: {
                headerShown: false
            }
        },

        MainV3DataScreen: {
            screen: MainV3DataScreen,
            navigationOptions: {
                headerShown: false
            }
        },

        ExchangeConfirmScreen: {
            screen: ExchangeConfirmScreen,
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
        initialRouteName: 'MainDataScreen'
    }
)

export default ExchangeScreenStack
