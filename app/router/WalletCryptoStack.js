import { createStackNavigator } from 'react-navigation-stack';
import SelectCrypto from '../modules/WalletCrypto/screen/SelectCrypto';

const WalletCryptoStack = createStackNavigator(
    {
        SelectCrypto: {
            screen: SelectCrypto,
            navigationOptions: {
                header: null
            }
        }
    },
    {
        initialRouteName: 'SelectCrypto'
    }
);

export default WalletCryptoStack
