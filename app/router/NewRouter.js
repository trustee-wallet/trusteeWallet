/* eslint-disable react/display-name */
/**
 * @version 0.44
 * @author yura
 */
import React from 'react'

import { createStackNavigator, TransitionSpecs, CardStyleInterpolators } from '@react-navigation/stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import InitScreen from '@app/modules/Init/InitScreen'

import WalletCreateScreen from '@app/modules/WalletCreate/WalletCreateScreen'
import BackupStep0Screen from '@app/modules/WalletBackup/BackupStep0Screen'
import BackupStep1Screen from '@app/modules/WalletBackup/BackupStep1Screen'
import BackupSettingsScreen from '@app/modules/WalletBackup/Settings'
import EnterMnemonicPhrase from '@app/modules/WalletCreate/EnterMnemonicPhrase'

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
import AccountReceiveScreen from '@app/modules/Account/AccountReceive/AccountReceiveScreen'
import AccountTransactionScreen from '@app/modules/Account/AccountTransaction/AccountTransactionScreen'
import AccountTransactionCheckScreen from '@app/modules/Account/AccountTransactionCheck/AccountTransactionCheckScreen'


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
import SupportScreen from '@app/modules/Support/index'

import CustomIcon from '@app/components/elements/CustomIcon'
import { useTheme } from '@app/modules/theme/ThemeProvider'
import { strings } from '@app/services/i18n'

const Stack = createStackNavigator()

const HomeStack = createStackNavigator()

const Tab = createBottomTabNavigator()

// https://reactnavigation.org/docs/stack-navigator/#animations
const transitionSpec = {
    open: TransitionSpecs.TransitionIOSSpec,
    close: TransitionSpecs.TransitionIOSSpec,
    gestureDirection: 'horizontal'
}
const cardStyleInterpolator = CardStyleInterpolators.forHorizontalIOS

const HomeStackScreen = (props) => {

    return (
        <HomeStack.Navigator initialRouteName='HomeScreenPop'>
            <HomeStack.Screen name='HomeScreen' component={HomeScreen} options={{ headerShown: false, transitionSpec, cardStyleInterpolator }} />
            <HomeStack.Screen name='HomeScreenPop' component={HomeScreen} options={{ headerShown: false }} />

            <HomeStack.Screen name='AddAssetScreen' component={AddAssetScreen} options={{ headerShown: false, transitionSpec, cardStyleInterpolator }} />
            <HomeStack.Screen name='NotificationsScreen' component={NotificationsScreen} options={{ headerShown: false, transitionSpec, cardStyleInterpolator }} />
            <HomeStack.Screen name='WalletConnectScreen' component={WalletConnectScreen} options={{ headerShown: false, transitionSpec, cardStyleInterpolator }} />
            <HomeStack.Screen name='MainV3DataScreen' component={MainV3DataScreen} options={{ headerShown: false, transitionSpec, cardStyleInterpolator }} />
            <HomeStack.Screen name='SMSV3CodeScreen' component={SMSV3CodeScreen} options={{ headerShown: false, transitionSpec, cardStyleInterpolator }} />
            <HomeStack.Screen name='SendScreen' component={SendScreen} options={{ headerShown: false, transitionSpec, cardStyleInterpolator }} />
            <HomeStack.Screen name='SendAdvancedScreen' component={SendAdvancedSettingsScreen} options={{ headerShown: false, transitionSpec, cardStyleInterpolator }} />
            <HomeStack.Screen name='ReceiptScreen' component={ReceiptScreen} options={{ headerShown: false, transitionSpec, cardStyleInterpolator }} />
            <HomeStack.Screen name='AccountScreen' component={AccountScreen} options={{ headerShown: false, transitionSpec, cardStyleInterpolator }} />
            <HomeStack.Screen name='AccountSettings' component={AccountSettingsScreen} options={{ headerShown: false, transitionSpec, cardStyleInterpolator }} />
            <HomeStack.Screen name='AccountTransactionScreen' component={AccountTransactionScreen} options={{ headerShown: false, transitionSpec, cardStyleInterpolator }} />
            <HomeStack.Screen name='AccountTransactionCheckScreen' component={AccountTransactionCheckScreen} options={{ headerShown: false, transitionSpec, cardStyleInterpolator }} />
            <HomeStack.Screen name='AccountReceiveScreen' component={AccountReceiveScreen} options={{ headerShown: false, transitionSpec, cardStyleInterpolator }} />

            <HomeStack.Screen name='AboutScreen' component={AboutScreen} options={{ headerShown: false, transitionSpec, cardStyleInterpolator }} />

            <HomeStack.Screen name='SettingsMainScreen' component={SettingsMainScreen} options={{ headerShown: false, transitionSpec, cardStyleInterpolator }} />
            <HomeStack.Screen name='WalletListScreen' component={WalletListScreen} options={{ headerShown: false, transitionSpec, cardStyleInterpolator }} />
            <HomeStack.Screen name='AddWalletScreen' component={AddWalletScreen} options={{ headerShown: false, transitionSpec, cardStyleInterpolator }} />
            <HomeStack.Screen name='AdvancedWalletScreen' component={AdvancedWalletScreen} options={{ headerShown: false, transitionSpec, cardStyleInterpolator }} />
            <HomeStack.Screen name='LocalCurrencyScreen' component={LocalCurrencyScreen} options={{ headerShown: false, transitionSpec, cardStyleInterpolator }} />
            <HomeStack.Screen name='LanguageListScreen' component={LanguageListScreen} options={{ headerShown: false, transitionSpec, cardStyleInterpolator }} />
            <HomeStack.Screen name='ScannerSettingsScreen' component={ScannerSettingsScreen} options={{ headerShown: false, transitionSpec, cardStyleInterpolator }} />
            <HomeStack.Screen name='NotificationsSettingsScreen' component={NotificationsSettingScreen} options={{ headerShown: false, transitionSpec, cardStyleInterpolator }} />
            <HomeStack.Screen name='TermsOfUseScreen' component={TermsOfUseScreen} options={{ headerShown: false, transitionSpec, cardStyleInterpolator }} />
            <HomeStack.Screen name='PrivacyPolicyScreen' component={PrivacyPolicyScreen} options={{ headerShown: false, transitionSpec, cardStyleInterpolator }} />

            <HomeStack.Screen name='FioChooseRecipient' component={FioChooseRecipient} options={{ headerShown: false, transitionSpec, cardStyleInterpolator }} />
            <HomeStack.Screen name='FioChooseAddress' component={FioChooseAddress} options={{ headerShown: false, transitionSpec, cardStyleInterpolator }} />
            <HomeStack.Screen name='FioSendRequest' component={FioSendRequest} options={{ headerShown: false, transitionSpec, cardStyleInterpolator }} />
            <HomeStack.Screen name='FioRequestsList' component={FioRequestsList} options={{ headerShown: false, transitionSpec, cardStyleInterpolator }} />
            <HomeStack.Screen name='FioRequestDetails' component={FioRequestDetails} options={{ headerShown: false, transitionSpec, cardStyleInterpolator }} />
            <HomeStack.Screen name='FioAddresses' component={FioAddresses} options={{ headerShown: false, transitionSpec, cardStyleInterpolator }} />
            <HomeStack.Screen name='FioMainSettings' component={FioMainSettings} options={{ headerShown: false, transitionSpec, cardStyleInterpolator }} />
            <HomeStack.Screen name='FioSettings' component={FioSettings} options={{ headerShown: false, transitionSpec, cardStyleInterpolator }} />
        </HomeStack.Navigator>
    )
}

const TabBar = () => {

    const { colors } = useTheme()

    return (
        <Tab.Navigator
            initialRouteName={'HomeScreen'}
            allowFontScaling={false}
            lazy={true}
            animationEnabled={true}
            tabBarOptions={{
                // safeAreaInsets: {
                //     bottom: 20,
                // },
                keyboardHidesTabBar: true,
                activeTintColor: colors.common.checkbox.bgChecked,
                inactiveTintColor: colors.common.text1,
                style: {
                    color: colors.common.text1,
                    borderTopWidth: 0,
                    borderTopColor: colors.common.text1,
                    backgroundColor: colors.homeScreen.tabBarBackground,
                    borderColor: colors.homeScreen.tabBarBackground,
                    shadowColor: '#000',
                    shadowOffset: {
                        width: 0,
                        height: -14
                    },
                    shadowOpacity: 0.06,
                    shadowRadius: 10,
                    paddingTop: 8,
                    height: 80
                }
            }}
        >
            <Tab.Screen
                name='HomeScreen'
                component={HomeStackScreen}
                options={{
                    tabBarLabel: strings('dashboardStack.wallet'),
                    tabBarIcon: ({ color }) => (
                        <CustomIcon name="wallet" color={color} size={22} />
                    )
                }}
            />
            <Tab.Screen
                name='MarketScreen'
                component={MarketScreen}
                options={{
                    unmountOnBlur: true,
                    tabBarLabel: strings('dashboardStack.market'),
                    tabBarIcon: ({ color }) => (
                        <CustomIcon name="exchange" color={color} size={22} />
                    )
                }}
            />
            <Tab.Screen
                name='CashbackScreen'
                component={CashbackScreen}
                options={{
                    tabBarLabel: strings('dashboardStack.earn'),
                    tabBarIcon: ({ color }) => (
                        <CustomIcon name="earn" color={color} size={22} />
                    )
                }}
            />
            <Tab.Screen
                name='SupportScreen'
                component={SupportScreen}
                options={{
                    unmountOnBlur: true,
                    tabBarLabel: strings('dashboardStack.support'),
                    tabBarIcon: ({ color }) => (
                        <CustomIcon name="support" color={color} size={22} />
                    )
                }}
            />
        </Tab.Navigator>
    )
}

export default () => {

    return (
        <Stack.Navigator initialRouteName='InitScreen'>
            <Stack.Screen name='InitScreen' component={InitScreen} options={{ headerShown: false }} />

            <Stack.Screen name='LockScreen' component={LockScreen} options={{ headerShown: false, transitionSpec, cardStyleInterpolator }} />
            <Stack.Screen name='LockScreenPop' component={LockScreen} options={{ headerShown: false }} />

            <Stack.Screen name='TabBar' component={TabBar} options={{ headerShown: false, }} />

            <Stack.Screen name='QRCodeScannerScreen' component={QRCodeScannerScreen} options={{ headerShown: false, transitionSpec, cardStyleInterpolator }} />

            <Stack.Screen name='WalletCreateScreen' component={WalletCreateScreen} options={{ headerShown: false, transitionSpec, cardStyleInterpolator }} />
            <Stack.Screen name='BackupStep0Screen' component={BackupStep0Screen} options={{ headerShown: false, transitionSpec, cardStyleInterpolator }} />
            <Stack.Screen name='BackupStep1Screen' component={BackupStep1Screen} options={{ headerShown: false, transitionSpec, cardStyleInterpolator }} />
            <Stack.Screen name='BackupSettingsScreen' component={BackupSettingsScreen} options={{ headerShown: false, transitionSpec, cardStyleInterpolator }} />
            <Stack.Screen name='EnterMnemonicPhrase' component={EnterMnemonicPhrase} options={{ headerShown: false, transitionSpec, cardStyleInterpolator }} />

            <Stack.Screen name='WebViewScreen' component={WebViewScreen} options={{ headerShown: false, transitionSpec, cardStyleInterpolator }} />

            <Stack.Screen name='ErrorScreen' component={ErrorScreen} options={{ headerShown: false, transitionSpec, cardStyleInterpolator }} />
        </Stack.Navigator>
    )

}