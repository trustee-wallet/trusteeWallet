/**
 * @version 0.9
 */
import { createStackNavigator } from 'react-navigation-stack'
import BackupStep0Screen from '../modules/WalletBackup/BackupStep0Screen'
// import BackupInfoScreen from '../modules/WalletBackup/BackupInfoScreen'
import BackupStep1Screen from '../modules/WalletBackup/BackupStep1Screen'
import BackupStepGoogle from '../modules/WalletBackup/BackupStepGoogle'

const WalletBackupStack = createStackNavigator(
    {
        BackupStep0Screen: {
            screen: BackupStep0Screen,
            navigationOptions: {
                headerShown: false
            }
        },
        // BackupInfoScreen: {
        //     screen: BackupInfoScreen,
        //     navigationOptions: {
        //         headerShown: false
        //     }
        // },
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
        //mode: 'modal',
        //cardStyle: { backgroundColor: AppStyle.backgroundColor }
    }
);

export default WalletBackupStack
