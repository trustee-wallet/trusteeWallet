import { createStackNavigator } from 'react-navigation-stack'
import BackupStep0Screen from '../modules/WalletBackup/BackupStep0Screen'
import BackupStep1Screen from '../modules/WalletBackup/BackupStep1Screen'

const WalletBackupStack = createStackNavigator(
    {
        BackupStep0Screen: {
            screen: BackupStep0Screen,
            navigationOptions: {
                header: null
            }
        },
        BackupStep1Screen: {
            screen: BackupStep1Screen,
            navigationOptions: {
                header: null
            }
        }
    },
    {
        initialRouteName: 'BackupStep0Screen',
        //mode: 'modal',
        //cardStyle: { backgroundColor: AppStyle.backgroundColor }
    }
);

export default WalletBackupStack
