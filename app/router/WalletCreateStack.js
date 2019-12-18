import { createStackNavigator } from 'react-navigation-stack'

import WalletCreateScreen from '../modules/WalletCreate/WalletCreateScreen'
import EnterNameScreen from '../modules/WalletCreate/EnterNameScreen'
import EnterMnemonicPhrase from '../modules/WalletCreate/EnterMnemonicPhrase'

const WalletCreateStack = createStackNavigator(
    {
        WalletCreateScreen: {
            screen: WalletCreateScreen,
            navigationOptions: {
                header: null
            }
        },
        EnterNameScreen: {
            screen: EnterNameScreen,
            navigationOptions: {
                header: null
            }
        },
        EnterMnemonicPhrase: {
            screen: EnterMnemonicPhrase,
            navigationOptions: {
                header: null
            }
        }
    },
    {
        initialRouteName: 'EnterNameScreen',
        mode: 'modal'
        //cardStyle: { backgroundColor: AppStyle.backgroundColor }
    }
)

export default WalletCreateStack
