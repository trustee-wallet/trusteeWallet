import { createStackNavigator } from 'react-navigation-stack'

import MainDataScreen from '../modules/Exchange/MainDataScreen'
import ConfirmScreen from '../modules/Exchange/ConfirmScreen'
import FinishScreen from '../modules/Exchange/FinishScreen'

const exchangeScreenStack = createStackNavigator(
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
        }
    },
    {
        initialRouteName: 'MainDataScreen',
    }
)

export default exchangeScreenStack
