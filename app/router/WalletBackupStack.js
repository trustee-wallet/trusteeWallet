/**
 * @version 0.41
 */
import { createStackNavigator } from 'react-navigation-stack'
import BackupStep0Screen from '@app/modules/WalletBackup/BackupStep0Screen'
import BackupStep1Screen from '@app/modules/WalletBackup/BackupStep1Screen'
import BackupStepGoogle from '@app/modules/WalletBackup/BackupStepGoogle'

const WalletBackupStack = createStackNavigator(
    {
        BackupStep0Screen: {
            screen: BackupStep0Screen,
            navigationOptions: {
                headerShown: false
            }
        },
        BackupStep1Screen: {
            screen: BackupStep1Screen,
            navigationOptions: {
                headerShown: false
            }
        },
        BackupStepGoogle : {
            screen: BackupStepGoogle,
            navigationOptions: {
                headerShown: false
            }
        }
    },
    {
        initialRouteName: 'BackupStep0Screen',
    }
);

export default WalletBackupStack
