/**
 * @version 0.9
 */
import { createStackNavigator } from 'react-navigation-stack'

import WalletCreateScreen from '../modules/WalletCreate/WalletCreateScreen'
import EnterNameScreen from '../modules/WalletCreate/EnterNameScreen'
import EnterMnemonicPhrase from '../modules/WalletCreate/EnterMnemonicPhrase'

const WalletCreateStack = createStackNavigator(
    {
        WalletCreateScreen: {
            screen: WalletCreateScreen,
            navigationOptions: {
                headerShown: false
            }
        },
        EnterNameScreen: {
            screen: EnterNameScreen,
            navigationOptions: {
                headerShown: false
            }
        },
        EnterMnemonicPhrase: {
            screen: EnterMnemonicPhrase,
            navigationOptions: {
                headerShown: false
            }
        }
    },
    {
        // initialRouteName: 'EnterNameScreen',
        // mode: 'modal'
        //cardStyle: { backgroundColor: AppStyle.backgroundColor }
    }
)

export default WalletCreateStack
