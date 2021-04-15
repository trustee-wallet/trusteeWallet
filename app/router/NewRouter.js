/**
 * @version 0.43
 */
import React from 'react'

import { createStackNavigator } from '@react-navigation/stack'
import LoadScreen from '@app/modules/Load/LoadScreen'
import WalletCreateScreen from '@app/modules/WalletCreate/WalletCreateScreen'
import BackupStep0Screen from '@app/modules/WalletBackup/BackupStep0Screen'
import BackupStep1Screen from '@app/modules/WalletBackup/BackupStep1Screen'
import BackupSettingsScreen from '@app/modules/WalletBackup/Settings'
import EnterMnemonicPhrase from '@app/modules/WalletCreate/EnterMnemonicPhrase'
import InitScreen from '@app/modules/Init/InitScreen'
import ErrorScreen from '@app/modules/Error/ErrorScreen'
import HomeScreen from '@app/modules/WalletList/HomeScreen'
import AboutScreen from '@app/modules/About/AboutScreen'
import LockScreen from '@app/modules/LockScreen/LockScreen'
import AddAssetScreen from '@app/modules/AddAsset/AddAssetScreen'
import WebViewScreen from '@app/modules/WebView'
import NotificationsScreen from '@app/modules/Notifications'
import QRCodeScannerScreen from '@app/modules/QRCodeScanner/QRCodeScannerScreen'
import WalletConnectScreen from '@app/modules/WalletConnect/WalletConnectScreen'
import MainV3DataScreen from '@app/modules/Trade/MainV3DataScreen'
import SMSV3CodeScreen from '@app/modules/Trade/SMSV3CodeScreen'
import MarketScreen from '@app/modules/Market/MainScreen'
import SendScreen from '@app/modules/Send/SendScreen'
import SendAdvancedSettingsScreen from '@app/modules/Send/SendAdvancedSettings'
import ReceiptScreen from '@app/modules/Send/ReceiptScreen'

import AccountScreen from '@app/modules/Account/AccountScreen'
import AccountSettingsScreen from '@app/modules/Account/AccountSettings/AccountSettingsScreen'
import ReceiveScreen from '@app/modules/Account/ReceiveScreen'
import TransactionScreen from '@app/modules/Account/TransactionScreen'
import CheckV3DataScreen from '@app/modules/Account/CheckV3'


import FioChooseRecipient from '@app/modules/FIO/FioChooseRecipient'
import FioSendRequest from '@app/modules/FIO/FioSendRequest'
import FioRequestsList from '@app/modules/FIO/FioRequestsList'
import FioChooseAddress from '@app/modules/FIO/FioChooseAddress'
import FioRequestDetails from '@app/modules/FIO/FioRequestDetails'
import FioAddresses from '@app/modules/FIO/FioAddresses'
import FioMainSettings from '@app/modules/FIO/FioMainSettings'
import FioSettings from '@app/modules/FIO/FioSettings'

import SettingsMainScreen from '@app/modules/Settings/SettingsMainScreen'
import WalletListScreen from '@app/modules/Settings/WalletListScreen'
import AddWalletScreen from '@app/modules/Settings/AddWalletScreen'
import AdvancedWalletScreen from '@app/modules/Settings/AdvancedWalletScreen'
import LocalCurrencyScreen from '@app/modules/Settings/LocalCurrencyScreen'
import LanguageListScreen from '@app/modules/Settings/LanguageListScreen'
import ScannerSettingsScreen from '@app/modules/Settings/ScannerSettingsScreen'
import TermsOfUseScreen from '@app/modules/About/screens/TermsOfUseScreen'
import PrivacyPolicyScreen from '@app/modules/About/screens/PrivacyPolicyScreen'
import CashbackScreen from '@app/modules/Cashback/CashbackScreen'
import NotificationsSettingScreen from '@app/modules/Settings/NotificationsScreen'

const Stack = createStackNavigator()

// eslint-disable-next-line react/display-name
export default () => {
    return <Stack.Navigator initialRouteName="LoadScreen">
        <Stack.Screen name='LoadScreen' component={LoadScreen} options={{headerShown : false}} />
        <Stack.Screen name='WalletCreateScreen' component={WalletCreateScreen} options={{headerShown : false}} />
        <Stack.Screen name='BackupStep0Screen' component={BackupStep0Screen} options={{headerShown : false}} />
        <Stack.Screen name='BackupStep1Screen' component={BackupStep1Screen} options={{headerShown : false}} />
        <Stack.Screen name='BackupSettingsScreen' component={BackupSettingsScreen} options={{headerShown : false}}/>
        <Stack.Screen name='EnterMnemonicPhrase' component={EnterMnemonicPhrase} options={{headerShown : false}}/>
        <Stack.Screen name='InitScreen' component={InitScreen} options={{headerShown : false}}/>
        <Stack.Screen name='ErrorScreen' component={ErrorScreen} options={{headerShown : false}}/>
        <Stack.Screen name='HomeScreen' component={HomeScreen} options={{headerShown : false}}/>
        <Stack.Screen name='AboutScreen' component={AboutScreen} options={{headerShown : false}}/>
        <Stack.Screen name='LockScreen' component={LockScreen} options={{headerShown : false}}/>
        <Stack.Screen name='AddAssetScreen' component={AddAssetScreen} options={{headerShown : false}}/>
        <Stack.Screen name='WebViewScreen' component={WebViewScreen} options={{headerShown : false}}/>
        <Stack.Screen name='NotificationsScreen' component={NotificationsScreen} options={{headerShown : false}}/>
        <Stack.Screen name='QRCodeScannerScreen' component={QRCodeScannerScreen} options={{headerShown : false}}/>
        <Stack.Screen name='WalletConnectScreen' component={WalletConnectScreen} options={{headerShown : false}}/>
        <Stack.Screen name='MainV3DataScreen' component={MainV3DataScreen} options={{headerShown : false}}/>
        <Stack.Screen name='SMSV3CodeScreen' component={SMSV3CodeScreen} options={{headerShown : false}}/>
        <Stack.Screen name='MarketScreen' component={MarketScreen} options={{headerShown : false}}/>
        <Stack.Screen name='SendScreen' component={SendScreen} options={{headerShown : false}}/>
        <Stack.Screen name='SendAdvancedScreen' component={SendAdvancedSettingsScreen} options={{headerShown : false}}/>
        <Stack.Screen name='ReceiptScreen' component={ReceiptScreen} options={{headerShown : false}}/>
        <Stack.Screen name='AccountScreen' component={AccountScreen} options={{headerShown : false}}/>
        <Stack.Screen name='AccountSettings' component={AccountSettingsScreen} options={{headerShown : false}}/>
        <Stack.Screen name='TransactionScreen' component={TransactionScreen} options={{headerShown : false}}/>
        <Stack.Screen name='CheckV3DataScreen' component={CheckV3DataScreen} options={{headerShown : false}}/>
        <Stack.Screen name='ReceiveScreen' component={ReceiveScreen} options={{headerShown : false}}/>


        <Stack.Screen name='FioChooseRecipient' component={FioChooseRecipient} options={{headerShown : false}}/>
        <Stack.Screen name='FioChooseAddress' component={FioChooseAddress} options={{headerShown : false}}/>
        <Stack.Screen name='FioSendRequest' component={FioSendRequest} options={{headerShown : false}}/>
        <Stack.Screen name='FioRequestsList' component={FioRequestsList} options={{headerShown : false}}/>
        <Stack.Screen name='FioRequestDetails' component={FioRequestDetails} options={{headerShown : false}}/>
        <Stack.Screen name='FioAddresses' component={FioAddresses} options={{headerShown : false}}/>
        <Stack.Screen name='FioMainSettings' component={FioMainSettings} options={{headerShown : false}}/>
        <Stack.Screen name='FioSettings' component={FioSettings} options={{headerShown : false}}/>

        <Stack.Screen name='SettingsMainScreen' component={SettingsMainScreen} options={{headerShown : false}}/>
        <Stack.Screen name='WalletListScreen' component={WalletListScreen} options={{headerShown : false}}/>
        <Stack.Screen name='AddWalletScreen' component={AddWalletScreen} options={{headerShown : false}}/>
        <Stack.Screen name='AdvancedWalletScreen' component={AdvancedWalletScreen} options={{headerShown : false}}/>
        <Stack.Screen name='LocalCurrencyScreen' component={LocalCurrencyScreen} options={{headerShown : false}}/>
        <Stack.Screen name='LanguageListScreen' component={LanguageListScreen} options={{headerShown : false}}/>
        <Stack.Screen name='ScannerSettingsScreen' component={ScannerSettingsScreen} options={{headerShown : false}}/>
        <Stack.Screen name='NotificationsSettingsScreen' component={NotificationsSettingScreen} options={{headerShown : false}}/>
        <Stack.Screen name='TermsOfUseScreen' component={TermsOfUseScreen} options={{headerShown : false}}/>
        <Stack.Screen name='PrivacyPolicyScreen' component={PrivacyPolicyScreen} options={{headerShown : false}}/>

        <Stack.Screen name='CashbackScreen' component={CashbackScreen} options={{headerShown : false}}/>
    </Stack.Navigator>
}
