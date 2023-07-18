/* eslint-disable react/display-name */
/**
 * @version 0.44
 * @author yura
 */
import React, { useEffect } from 'react'
import { Platform } from 'react-native'

import { createStackNavigator, TransitionSpecs, CardStyleInterpolators } from '@react-navigation/stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import InitScreen from '@app/modules/Init/InitScreen'

import WalletCreateScreen from '@app/modules/WalletCreate/WalletCreateScreen'
import BackupStep0Screen from '@app/modules/WalletBackup/BackupStep0Screen'
import BackupStep1Screen from '@app/modules/WalletBackup/BackupStep1Screen'
import BackupSettingsScreen from '@app/modules/WalletBackup/Settings'
import EnterMnemonicPhrase from '@app/modules/WalletCreate/EnterMnemonicPhrase'
import WalletCreateWithAnimation from '@app/modules/WalletCreate/WalletCreateWithAnimation';

import ErrorScreen from '@app/modules/Error/ErrorScreen'
import HomeScreen from '@app/modules/WalletList/HomeScreen'
import AboutScreen from '@app/modules/Settings/About/AboutScreen'
import LockScreen from '@app/modules/LockScreen/LockScreen'
import AddAssetScreen from '@app/modules/AddAsset/AddAssetScreen'
import WebViewScreen from '@app/modules/WebView'
import NotificationsScreen from '@app/modules/Notifications'
import QRCodeScannerScreen from '@app/modules/QRCodeScanner/QRCodeScannerScreen'
import WalletConnectScreen from '@app/modules/WalletConnect/WalletConnectScreen'
import WalletConnectChangeNetworkScreen from '@app/modules/WalletConnect/WalletConnectChangeNetworkScreen'

import WalletDappWebViewScreen from '@app/modules/WalletDapp/WalletDappWebViewScreen'

import SMSV3CodeScreen from '@app/modules/Market/SMSV3CodeScreen'
import MarketScreen from '@app/modules/Market/MainScreen'

import SendScreen from '@app/modules/Send/SendScreen'
import SendScreenWithoutAmount from '@app/modules/Send/SendScreenWithoutAmount'
import SendAdvancedSettingsScreen from '@app/modules/Send/SendAdvancedSettings'
import ReceiptScreen from '@app/modules/Send/ReceiptScreen'

import AccountScreen from '@app/modules/Account/AccountScreen'
import AccountSettingsScreen from '@app/modules/Account/AccountSettings/AccountSettingsScreen'
import AccountSettingsPrivateScreen from '@app/modules/Account/AccountSettingsPrivate/AccountSettingsPrivateScreen'
import AccountReceiveScreen from '@app/modules/Account/AccountReceive/AccountReceiveScreen'
import AccountTransactionScreen from '@app/modules/Account/AccountTransaction/AccountTransactionScreen'
import AllAddressesScreen from '@app/modules/Account/AccountReceive/AllAddressesScreen'
import AccountStakingTRX from '@app/modules/Account/AccountStaking/AccountStakingTRX'
import AccountStakingV2WithdrawTRX from '@app/modules/Account/AccountStaking/AccountStakingV2WithdrawTRX'
import AccountStakingSOL from '@app/modules/Account/AccountStaking/AccountStakingSOL'

import SolStakingTransactionScreen from '@app/modules/Account/AccountStaking/sol/SolStakingTransactionScreen'
import SolValidators from '@app/modules/Account/AccountStaking/sol/SolValidators'


import FioChooseRecipient from '@app/modules/FIO/FioChooseRecipient'
import FioSendRequest from '@app/modules/FIO/FioSendRequest'
import FioRequestsList from '@app/modules/FIO/FioRequestsList'
import FioChooseAddress from '@app/modules/FIO/FioChooseAddress'
import FioRequestDetails from '@app/modules/FIO/FioRequestDetails'
import FioAddresses from '@app/modules/FIO/FioAddresses'
import FioMainSettings from '@app/modules/FIO/FioMainSettings'
import FioSettings from '@app/modules/FIO/FioSettings'

import SettingsMainScreen from '@app/modules/Settings/SettingsMainScreen'
import WalletListScreen from '@app/modules/Settings/WalletList/WalletListScreen'
import AddWalletScreen from '@app/modules/Settings/WalletList/AddWalletScreen'
import BackupSearchWallet from '@app/modules/Settings/WalletList/BackupSearchWalletScreen'
import BackupSearchOne from '@app/modules/Settings/WalletList/BackupSearchOneScreen'
import AdvancedWalletScreen from '@app/modules/Settings/WalletList/AdvancedWalletScreen'

import LocalCurrencyScreen from '@app/modules/Settings/Subsettings/LocalCurrencyScreen'
import LanguageListScreen from '@app/modules/Settings/Subsettings/LanguageListScreen'
import ScannerSettingsScreen from '@app/modules/Settings/Subsettings/ScannerSettingsScreen'
import LoggingSettingsScreen from '@app/modules/Settings/Subsettings/LoggingSettingsScreen'
import NotificationsSettingScreen from '@app/modules/Settings/Subsettings/NotificationsScreen'

import CashbackScreen from '@app/modules/Cashback/CashbackScreen'
import BotSupportScreen from '@app/modules/Support/botSupport'
import StreamSupportScreen from '@app/modules/Support/streamSupport'

import CustomIcon from '@app/components/elements/CustomIcon'
import { useTheme } from '@app/theme/ThemeProvider'
import { strings } from '@app/services/i18n'
import config from '@app/config/config';

import NftMainScreen from '@app/modules/NFT/NftMainScreen'
import NftDetailedInfo from '@app/modules/NFT/NftDetailedInfo'
import NftDetailedInfoQR from '@app/modules/NFT/NftDetailedInfoQR'
import NftDetailedInfoQRCheck from '@app/modules/NFT/NftDetailedInfoQRCheck'
import NftReceive from '@app/modules/NFT/NftReceive'
import NftCollectionView from '@app/modules/NFT/NftCollectionView'
import NftAddAssetScreen from '@app/modules/NFT/NftAddAssetScreen';

import SellCodeScreen from '@app/modules/Market/SellCodeScreen';
import GlobalCoinSettings from '@app/modules/Settings/CoinSettings/GlobalCoinSettings';
import BlocksoftExternalSettings from '@crypto/common/BlocksoftExternalSettings'
import HomeDragScreen from '@app/modules/WalletList/HomeFilter/HomeDragScreen';
import GuideScreen from '@app/modules/WalletList/HomeFilter/GuideScreen';

import TransactionFilter from '@app/modules/Account/AccountFilter/AccountTransactionFilter';
import TransactionCategories from '@app/modules/Account/AccountFilter/AccountTransactionCategories';

import AppDeepLinking from '@app/services/AppDeepLinking/AppDeepLinking';

const Stack = createStackNavigator()

const HomeStack = createStackNavigator()

const MarketStack = createStackNavigator()

const Tab = createBottomTabNavigator()

// https://reactnavigation.org/docs/stack-navigator/#animations
const transitionSpec = {
    open: TransitionSpecs.TransitionIOSSpec,
    close: TransitionSpecs.TransitionIOSSpec,
    gestureDirection: 'horizontal'
}
const cardStyleInterpolator = CardStyleInterpolators.forHorizontalIOS

let CASHE_USED = false

const HomeStackScreen = () => {

    useEffect(() => {
        if(!CASHE_USED){
            AppDeepLinking.receiveDeepLink(null, 'Init app')
            CASHE_USED = true
        }
    }, [])

    return (
        <HomeStack.Navigator initialRouteName='HomeScreenPop'>
            <HomeStack.Screen name='HomeScreen' component={HomeScreen} options={{ headerShown: false, transitionSpec, cardStyleInterpolator }} />
            <HomeStack.Screen name='HomeScreenPop' component={HomeScreen} options={{ headerShown: false }} />

            <HomeStack.Screen name='StreamSupportScreen' component={StreamSupportScreen} options={{ headerShown: false, transitionSpec, cardStyleInterpolator }} />
            <HomeStack.Screen name='BotSupportScreen' component={BotSupportScreen} options={{ headerShown: false, transitionSpec, cardStyleInterpolator }} />

            <HomeStack.Screen name='AddAssetScreen' component={AddAssetScreen} options={{ headerShown: false, transitionSpec, cardStyleInterpolator }} />
            <HomeStack.Screen name='NotificationsScreen' component={NotificationsScreen} options={{ headerShown: false, transitionSpec, cardStyleInterpolator }} />
            <HomeStack.Screen name='WalletConnectScreen' component={WalletConnectScreen} options={{ headerShown: false, transitionSpec, cardStyleInterpolator }} />
            <HomeStack.Screen name='WalletConnectChangeNetworkScreen' component={WalletConnectChangeNetworkScreen} options={{ headerShown: false, transitionSpec, cardStyleInterpolator }} />

            <HomeStack.Screen name='WalletDappWebViewScreen' component={WalletDappWebViewScreen} options={{ headerShown: false, transitionSpec, cardStyleInterpolator }} />

            <HomeStack.Screen name='SendScreen' component={SendScreen} options={{ headerShown: false, transitionSpec, cardStyleInterpolator }} />
            <HomeStack.Screen name='SendScreenWithoutAmount' component={SendScreenWithoutAmount} options={{ headerShown: false, transitionSpec, cardStyleInterpolator }} />
            <HomeStack.Screen name='SendAdvancedScreen' component={SendAdvancedSettingsScreen} options={{ headerShown: false, transitionSpec, cardStyleInterpolator }} />
            <HomeStack.Screen name='ReceiptScreen' component={ReceiptScreen} options={{ headerShown: false, transitionSpec, cardStyleInterpolator }} />
            <HomeStack.Screen name='AccountScreen' component={AccountScreen} options={{ headerShown: false, transitionSpec, cardStyleInterpolator }} />
            <HomeStack.Screen name='AccountSettings' component={AccountSettingsScreen} options={{ headerShown: false, transitionSpec, cardStyleInterpolator }} />
            <HomeStack.Screen name='AccountSettingsPrivate' component={AccountSettingsPrivateScreen} options={{ headerShown: false, transitionSpec, cardStyleInterpolator }} />
            <HomeStack.Screen name='AccountTransactionScreen' component={AccountTransactionScreen} options={{ headerShown: false, transitionSpec, cardStyleInterpolator }} />
            <HomeStack.Screen name='AccountReceiveScreen' component={AccountReceiveScreen} options={{ headerShown: false, transitionSpec, cardStyleInterpolator }} />
            <HomeStack.Screen name='SolStakingTransactionScreen' component={SolStakingTransactionScreen} options={{ headerShown: false, transitionSpec, cardStyleInterpolator }} />
            <HomeStack.Screen name='SolValidators' component={SolValidators} options={{ headerShown: false, transitionSpec, cardStyleInterpolator }} />
            <HomeStack.Screen name='AllAddressesScreen' component={AllAddressesScreen} options={{ headerShown: false, transitionSpec, cardStyleInterpolator }} />

            <HomeStack.Screen name='AccountStakingSOL' component={AccountStakingSOL} options={{ headerShown: false, transitionSpec, cardStyleInterpolator }} />
            <HomeStack.Screen name='AccountStakingTRX' component={AccountStakingTRX} options={{ headerShown: false, transitionSpec, cardStyleInterpolator }} />
            <HomeStack.Screen name='AccountStakingWithdrawTRX' component={AccountStakingV2WithdrawTRX} options={{ headerShown: false, transitionSpec, cardStyleInterpolator }} />

            <HomeStack.Screen name='TransactionFilter' component={TransactionFilter} options={{ headerShown: false, transitionSpec, cardStyleInterpolator }} />
            <HomeStack.Screen name='TransactionCategories' component={TransactionCategories} options={{ headerShown: false, transitionSpec, cardStyleInterpolator }} />

            <HomeStack.Screen name='AboutScreen' component={AboutScreen} options={{ headerShown: false, transitionSpec, cardStyleInterpolator }} />

            <HomeStack.Screen name='SettingsMainScreen' component={SettingsMainScreen} options={{ headerShown: false, transitionSpec, cardStyleInterpolator }} />
            <HomeStack.Screen name='WalletListScreen' component={WalletListScreen} options={{ headerShown: false, transitionSpec, cardStyleInterpolator }} />
            <HomeStack.Screen name='AddWalletScreen' component={AddWalletScreen} options={{ headerShown: false, transitionSpec, cardStyleInterpolator }} />
            <HomeStack.Screen name='BackupSearchWallet' component={BackupSearchWallet} options={{ headerShown: false, transitionSpec, cardStyleInterpolator }} />
            <HomeStack.Screen name='BackupSearchOne' component={BackupSearchOne} options={{ headerShown: false, transitionSpec, cardStyleInterpolator }} />

            <HomeStack.Screen name='AdvancedWalletScreen' component={AdvancedWalletScreen} options={{ headerShown: false, transitionSpec, cardStyleInterpolator }} />
            <HomeStack.Screen name='LocalCurrencyScreen' component={LocalCurrencyScreen} options={{ headerShown: false, transitionSpec, cardStyleInterpolator }} />
            <HomeStack.Screen name='LanguageListScreen' component={LanguageListScreen} options={{ headerShown: false, transitionSpec, cardStyleInterpolator }} />
            <HomeStack.Screen name='ScannerSettingsScreen' component={ScannerSettingsScreen} options={{ headerShown: false, transitionSpec, cardStyleInterpolator }} />
            <HomeStack.Screen name='LoggingSettingsScreen' component={LoggingSettingsScreen} options={{ headerShown: false, transitionSpec, cardStyleInterpolator }} />
            <HomeStack.Screen name='NotificationsSettingsScreen' component={NotificationsSettingScreen} options={{ headerShown: false, transitionSpec, cardStyleInterpolator }} />
            <HomeStack.Screen name='GlobalCoinSettings' component={GlobalCoinSettings} options={{ headerShown: false, transitionSpec, cardStyleInterpolator }} />

            <HomeStack.Screen name='FioChooseRecipient' component={FioChooseRecipient} options={{ headerShown: false, transitionSpec, cardStyleInterpolator }} />
            <HomeStack.Screen name='FioChooseAddress' component={FioChooseAddress} options={{ headerShown: false, transitionSpec, cardStyleInterpolator }} />
            <HomeStack.Screen name='FioSendRequest' component={FioSendRequest} options={{ headerShown: false, transitionSpec, cardStyleInterpolator }} />
            <HomeStack.Screen name='FioRequestsList' component={FioRequestsList} options={{ headerShown: false, transitionSpec, cardStyleInterpolator }} />
            <HomeStack.Screen name='FioRequestDetails' component={FioRequestDetails} options={{ headerShown: false, transitionSpec, cardStyleInterpolator }} />
            <HomeStack.Screen name='FioAddresses' component={FioAddresses} options={{ headerShown: false, transitionSpec, cardStyleInterpolator }} />
            <HomeStack.Screen name='FioMainSettings' component={FioMainSettings} options={{ headerShown: false, transitionSpec, cardStyleInterpolator }} />
            <HomeStack.Screen name='FioSettings' component={FioSettings} options={{ headerShown: false, transitionSpec, cardStyleInterpolator }} />

            <HomeStack.Screen name='NftMainScreen' component={NftMainScreen} options={{ headerShown: false, transitionSpec, cardStyleInterpolator }} />
            <HomeStack.Screen name='NftReceive' component={NftReceive} options={{ headerShown: false, transitionSpec, cardStyleInterpolator }} />
            <HomeStack.Screen name='NftDetailedInfo' component={NftDetailedInfo} options={{ headerShown: false, transitionSpec, cardStyleInterpolator }} />
            <HomeStack.Screen name='NftDetailedInfoQR' component={NftDetailedInfoQR} options={{ headerShown: false, transitionSpec, cardStyleInterpolator }} />
            <HomeStack.Screen name='NftDetailedInfoQRCheck' component={NftDetailedInfoQRCheck} options={{ headerShown: false, transitionSpec, cardStyleInterpolator }} />
            <HomeStack.Screen name='NftCollectionView' component={NftCollectionView} options={{ headerShown: false, transitionSpec, cardStyleInterpolator }} />
            <HomeStack.Screen name='NftAddAssetScreen' component={NftAddAssetScreen} options={{ headerShown: false, transitionSpec, cardStyleInterpolator }} />

        </HomeStack.Navigator>
    )
}

const MarketStackScreen = () => {
    return (
        <MarketStack.Navigator initialRouteName='MarketScreen'>
            <MarketStack.Screen name='MarketScreen' component={MarketScreen} options={{ headerShown: false, transitionSpec, cardStyleInterpolator }} />
            <MarketStack.Screen name='SMSV3CodeScreen' component={SMSV3CodeScreen} options={{ headerShown: false, transitionSpec, cardStyleInterpolator }} />
            <MarketStack.Screen name='SellCodeScreen' component={SellCodeScreen} options={{ headerShown: false, transitionSpec, cardStyleInterpolator }}/>
            <MarketStack.Screen name='MarketReceiptScreen' component={ReceiptScreen} options={{ headerShown: false, transitionSpec, cardStyleInterpolator }} />
            <MarketStack.Screen name='MarketAdvancedScreen' component={SendAdvancedSettingsScreen} options={{ headerShown: false, transitionSpec, cardStyleInterpolator }} />
        </MarketStack.Navigator>
    )
}

const SupportStackScreen = () => {
    return (
        <MarketStack.Navigator initialRouteName='StreamSupportScreen'>
            <MarketStack.Screen name='StreamSupportScreen' component={StreamSupportScreen} options={{ headerShown: false, transitionSpec, cardStyleInterpolator }} />
            <MarketStack.Screen name='SupportAboutScreen' component={AboutScreen} options={{ headerShown: false, transitionSpec, cardStyleInterpolator }} />
        </MarketStack.Navigator>
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
                lazy: true,
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
                },
                tabStyle: {
                    paddingTop: 10,
                    paddingBottom: Platform.OS === 'ios' ? 4 : 10,
                    height: 50,
                    fontSize: 12,
                    fontFamily: 'SFUIDisplay-Regular',
                }
            }}
        >
            <Tab.Screen
                name='HomeScreen'
                component={HomeStackScreen}
                initialParams={{ icon: 'wallet' }}
                options={{
                    tabBarLabel: strings('dashboardStack.wallet'),
                    tabBarIcon: ({ color }) => (
                        <CustomIcon name="wallet" color={color} size={22} style={{ marginBottom: 3 }} />
                    )
                }}
            />
            <Tab.Screen
                name='MarketScreen'
                component={MarketStackScreen}
                options={{
                    tabBarLabel: strings('dashboardStack.market'),
                    tabBarIcon: ({ color }) => (
                        <CustomIcon name="exchange" color={color} size={22} style={{ marginBottom: 3 }} />
                    ),
                    tabBarOnPress: ({ navigation }) => {
                        if (config.debug.appErrors) {
                            console.log("pressed")
                        }
                    }
                }}
            />
            <Tab.Screen
                name='CashbackScreen'
                component={CashbackScreen}
                options={{
                    tabBarLabel: strings('dashboardStack.earn'),
                    tabBarIcon: ({ color }) => (
                        <CustomIcon name="earn" color={color} size={22} style={{ marginBottom: 3 }} />
                    )
                }}
            />
            {BlocksoftExternalSettings.getStatic('ROCKET_CHAT_USE') * 1 > 0 ?
                <Tab.Screen
                    name='SupportScreen'
                    component={SupportStackScreen}
                    options={{
                        unmountOnBlur: true,
                        tabBarLabel: strings('dashboardStack.support'),
                        tabBarIcon: ({ color }) => (
                            <CustomIcon name="support" color={color} size={22} style={{ marginBottom: 3 }} />
                        )
                    }}
                />
                :
                <Tab.Screen
                    name='SupportScreen'
                    component={BotSupportScreen}
                    options={{
                        unmountOnBlur: true,
                        tabBarLabel: strings('dashboardStack.support'),
                        tabBarIcon: ({ color }) => (
                            <CustomIcon name="support" color={color} size={22} style={{ marginBottom: 3 }} />
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
            <Stack.Screen name='WalletCreateWithAnimation' component={WalletCreateWithAnimation} options={{ headerShown: false, transitionSpec, cardStyleInterpolator, gestureEnabled: false }} />

            <Stack.Screen name='WebViewScreen' component={WebViewScreen} options={{ headerShown: false, transitionSpec, cardStyleInterpolator }} />

            <Stack.Screen name='ErrorScreen' component={ErrorScreen} options={{ headerShown: false, transitionSpec, cardStyleInterpolator }} />

            <Stack.Screen name='HomeDragScreen' component={HomeDragScreen} options={{ headerShown: false, transitionSpec, cardStyleInterpolator }} />
            <Stack.Screen name='GuideScreen' component={GuideScreen} options={{ headerShown: false, transitionSpec, cardStyleInterpolator }} />
        </Stack.Navigator>
    )

}
