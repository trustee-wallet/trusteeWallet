/* eslint-disable react/display-name */
/**
 * @version 0.44
 * @author yura
 */
import React, { useEffect } from 'react'
import { Platform, View } from 'react-native'

import { createStackNavigator, TransitionSpecs, CardStyleInterpolators } from '@react-navigation/stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'

import InitScreen from '@app/modules/Init/InitScreen'

import WalletCreateScreen from '@app/modules/WalletCreate/WalletCreateScreen'
import BackupStep0Screen from '@app/modules/WalletBackup/BackupStep0Screen'
import BackupStep1Screen from '@app/modules/WalletBackup/BackupStep1Screen'
import BackupSettingsScreen from '@app/modules/WalletBackup/Settings'
import EnterMnemonicPhrase from '@app/modules/WalletCreate/EnterMnemonicPhrase'
import WalletCreateWithAnimation from '@app/modules/WalletCreate/WalletCreateWithAnimation'

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
import config from '@app/config/config'

import NftMainScreen from '@app/modules/NFT/NftMainScreen'
import NftDetailedInfo from '@app/modules/NFT/NftDetailedInfo'
import NftDetailedInfoQR from '@app/modules/NFT/NftDetailedInfoQR'
import NftDetailedInfoQRCheck from '@app/modules/NFT/NftDetailedInfoQRCheck'
import NftReceive from '@app/modules/NFT/NftReceive'
import NftCollectionView from '@app/modules/NFT/NftCollectionView'
import NftAddAssetScreen from '@app/modules/NFT/NftAddAssetScreen'

import SellCodeScreen from '@app/modules/Market/SellCodeScreen'
import GlobalCoinSettings from '@app/modules/Settings/CoinSettings/GlobalCoinSettings'
import BlocksoftExternalSettings from '@crypto/common/BlocksoftExternalSettings'
import HomeDragScreen from '@app/modules/WalletList/HomeFilter/HomeDragScreen'
import GuideScreen from '@app/modules/WalletList/HomeFilter/GuideScreen'

import TransactionFilter from '@app/modules/Account/AccountFilter/AccountTransactionFilter'
import TransactionCategories from '@app/modules/Account/AccountFilter/AccountTransactionCategories'

import AppDeepLinking from '@app/services/AppDeepLinking/AppDeepLinking'

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

let CACHE_USED = false

const HomeStackScreen = () => {
    useEffect(() => {
        if (!CACHE_USED) {
            AppDeepLinking.receiveDeepLink(null, 'Init app')
            CACHE_USED = true
        }
    }, [])

    return (
        <HomeStack.Navigator initialRouteName='HomeScreenPop' screenOptions={{ headerShown: false }}>
            <HomeStack.Screen name='HomeScreenPop' component={HomeScreen} />
            <HomeStack.Group screenOptions={{ transitionSpec, cardStyleInterpolator }}>
                <HomeStack.Screen name='HomeScreen' component={HomeScreen} />

                <HomeStack.Screen name='AddAssetScreen' component={AddAssetScreen} />

                <HomeStack.Screen name='NotificationsScreen' component={NotificationsScreen} />
                <HomeStack.Screen name='StreamSupportScreen' component={StreamSupportScreen} />
                <HomeStack.Screen name='BotSupportScreen' component={BotSupportScreen} />

                <HomeStack.Screen name='WalletConnectScreen' component={WalletConnectScreen} />
                <HomeStack.Screen name='WalletConnectChangeNetworkScreen' component={WalletConnectChangeNetworkScreen} />

                <HomeStack.Screen name='WalletDappWebViewScreen' component={WalletDappWebViewScreen} />

                <HomeStack.Screen name='SendScreen' component={SendScreen} />
                <HomeStack.Screen name='SendScreenWithoutAmount' component={SendScreenWithoutAmount} />
                <HomeStack.Screen name='SendAdvancedScreen' component={SendAdvancedSettingsScreen} />
                <HomeStack.Screen name='ReceiptScreen' component={ReceiptScreen} />
                <HomeStack.Screen name='AccountScreen' component={AccountScreen} />
                <HomeStack.Screen name='AccountSettings' component={AccountSettingsScreen} />
                <HomeStack.Screen name='AccountSettingsPrivate' component={AccountSettingsPrivateScreen} />
                <HomeStack.Screen name='AccountTransactionScreen' component={AccountTransactionScreen} />
                <HomeStack.Screen name='AccountReceiveScreen' component={AccountReceiveScreen} />
                <HomeStack.Screen name='SolStakingTransactionScreen' component={SolStakingTransactionScreen} />
                <HomeStack.Screen name='SolValidators' component={SolValidators} />
                <HomeStack.Screen name='AllAddressesScreen' component={AllAddressesScreen} />

                <HomeStack.Screen name='AccountStakingSOL' component={AccountStakingSOL} />
                <HomeStack.Screen name='AccountStakingTRX' component={AccountStakingTRX} />
                <HomeStack.Screen name='AccountStakingWithdrawTRX' component={AccountStakingV2WithdrawTRX} />

                <HomeStack.Screen name='TransactionFilter' component={TransactionFilter} />
                <HomeStack.Screen name='TransactionCategories' component={TransactionCategories} />

                <HomeStack.Screen name='AboutScreen' component={AboutScreen} />

                <HomeStack.Screen name='SettingsMainScreen' component={SettingsMainScreen} />
                <HomeStack.Screen name='WalletListScreen' component={WalletListScreen} />
                <HomeStack.Screen name='AddWalletScreen' component={AddWalletScreen} />
                <HomeStack.Screen name='BackupSearchWallet' component={BackupSearchWallet} />
                <HomeStack.Screen name='BackupSearchOne' component={BackupSearchOne} />

                <HomeStack.Screen name='AdvancedWalletScreen' component={AdvancedWalletScreen} />
                <HomeStack.Screen name='LocalCurrencyScreen' component={LocalCurrencyScreen} />
                <HomeStack.Screen name='LanguageListScreen' component={LanguageListScreen} />
                <HomeStack.Screen name='ScannerSettingsScreen' component={ScannerSettingsScreen} />
                <HomeStack.Screen name='LoggingSettingsScreen' component={LoggingSettingsScreen} />
                <HomeStack.Screen name='NotificationsSettingsScreen' component={NotificationsSettingScreen} />
                <HomeStack.Screen name='GlobalCoinSettings' component={GlobalCoinSettings} />

                <HomeStack.Screen name='FioChooseRecipient' component={FioChooseRecipient} />
                <HomeStack.Screen name='FioChooseAddress' component={FioChooseAddress} />
                <HomeStack.Screen name='FioSendRequest' component={FioSendRequest} />
                <HomeStack.Screen name='FioRequestsList' component={FioRequestsList} />
                <HomeStack.Screen name='FioRequestDetails' component={FioRequestDetails} />
                <HomeStack.Screen name='FioAddresses' component={FioAddresses} />
                <HomeStack.Screen name='FioMainSettings' component={FioMainSettings} />
                <HomeStack.Screen name='FioSettings' component={FioSettings} />

                <HomeStack.Screen name='NftMainScreen' component={NftMainScreen} />
                <HomeStack.Screen name='NftReceive' component={NftReceive} />
                <HomeStack.Screen name='NftDetailedInfo' component={NftDetailedInfo} />
                <HomeStack.Screen name='NftDetailedInfoQR' component={NftDetailedInfoQR} />
                <HomeStack.Screen name='NftDetailedInfoQRCheck' component={NftDetailedInfoQRCheck} />
                <HomeStack.Screen name='NftCollectionView' component={NftCollectionView} />
                <HomeStack.Screen name='NftAddAssetScreen' component={NftAddAssetScreen} />
            </HomeStack.Group>
        </HomeStack.Navigator>
    )
}

const MarketStackScreen = () => {
    return (
        <MarketStack.Navigator initialRouteName='MarketScreen' screenOptions={{ headerShown: false }}>
            <MarketStack.Group screenOptions={{ transitionSpec, cardStyleInterpolator }}>
                <MarketStack.Screen name='MarketScreen' component={MarketScreen} />
                <MarketStack.Screen name='SMSV3CodeScreen' component={SMSV3CodeScreen} />
                <MarketStack.Screen name='SellCodeScreen' component={SellCodeScreen} />
                <MarketStack.Screen name='MarketReceiptScreen' component={ReceiptScreen} />
                <MarketStack.Screen name='MarketAdvancedScreen' component={SendAdvancedSettingsScreen} />
            </MarketStack.Group>
        </MarketStack.Navigator>
    )
}

const SupportStackScreen = () => {
    return (
        <MarketStack.Navigator initialRouteName='StreamSupportScreen' screenOptions={{ headerShown: false }}>
            <MarketStack.Group screenOptions={{ transitionSpec, cardStyleInterpolator }}>
                <MarketStack.Screen name='StreamSupportScreen' component={StreamSupportScreen} />
                <MarketStack.Screen name='SupportAboutScreen' component={AboutScreen} />
            </MarketStack.Group>
        </MarketStack.Navigator>
    )
}

const TabBar = () => {
    const { colors } = useTheme()

    const tabBarStyle = {}

    if (Platform.OS === 'ios') {
        tabBarStyle.paddingTop = 10
    } else {
        // tabBarStyle.paddingBottom = 10
    }

    return (
        <Tab.Navigator
            initialRouteName='HomeScreen'
            allowFontScaling={false}
            screenOptions={{
                headerShown: false,
                tabBarHideOnKeyboard: true,
                tabBarActiveTintColor: colors.common.checkbox.bgChecked,
                tabBarInactiveTintColor: colors.common.text1,
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontFamily: 'SFUIDisplay-Regular'
                },
                tabBarStyle,
                tabBarBackground: () => (
                    <View
                        style={{
                            flex: 1,
                            backgroundColor: colors.homeScreen.tabBarBackground,
                            shadowColor: '#000',
                            elevation: 0,
                            shadowOffset: {
                                width: 0,
                                height: -14
                            },
                            shadowOpacity: 0.06,
                            shadowRadius: 10
                        }}
                    />
                )
            }}>
            <Tab.Screen
                name='HomeScreen'
                component={HomeStackScreen}
                initialParams={{ icon: 'wallet' }}
                options={{
                    tabBarLabel: strings('dashboardStack.wallet'),
                    tabBarIcon: ({ color }) => <CustomIcon name='wallet' color={color} size={22} style={{ marginBottom: 3 }} />
                }}
            />
            <Tab.Screen
                name='MarketScreen'
                component={MarketStackScreen}
                options={{
                    tabBarLabel: strings('dashboardStack.market'),
                    tabBarIcon: ({ color }) => <CustomIcon name='exchange' color={color} size={22} style={{ marginBottom: 3 }} />,
                    tabBarOnPress: ({ navigation }) => {
                        if (config.debug.appErrors) {
                            console.log('pressed')
                        }
                    }
                }}
            />
            <Tab.Screen
                name='CashbackScreen'
                component={CashbackScreen}
                options={{
                    tabBarLabel: strings('dashboardStack.earn'),
                    tabBarIcon: ({ color }) => <CustomIcon name='earn' color={color} size={22} style={{ marginBottom: 3 }} />
                }}
            />
            {BlocksoftExternalSettings.getStatic('ROCKET_CHAT_USE') * 1 > 0 ? (
                <Tab.Screen
                    name='SupportScreen'
                    component={SupportStackScreen}
                    options={{
                        unmountOnBlur: true,
                        tabBarLabel: strings('dashboardStack.support'),
                        tabBarIcon: ({ color }) => <CustomIcon name='support' color={color} size={22} style={{ marginBottom: 3 }} />
                    }}
                />
            ) : (
                <Tab.Screen
                    name='SupportScreen'
                    component={BotSupportScreen}
                    options={{
                        unmountOnBlur: true,
                        tabBarLabel: strings('dashboardStack.support'),
                        tabBarIcon: ({ color }) => <CustomIcon name='support' color={color} size={22} style={{ marginBottom: 3 }} />
                    }}
                />
            )}
        </Tab.Navigator>
    )
}

export default () => {
    return (
        <Stack.Navigator initialRouteName='InitScreen' screenOptions={{ headerShown: false }}>
            <Stack.Screen name='InitScreen' component={InitScreen} />
            <Stack.Screen name='LockScreenPop' component={LockScreen} />
            <Stack.Screen name='TabBar' component={TabBar} />

            <Stack.Group screenOptions={{ transitionSpec, cardStyleInterpolator }}>
                <Stack.Screen name='LockScreen' component={LockScreen} />

                <Stack.Screen name='QRCodeScannerScreen' component={QRCodeScannerScreen} />

                <Stack.Screen name='WalletCreateScreen' component={WalletCreateScreen} />
                <Stack.Screen name='BackupStep0Screen' component={BackupStep0Screen} />
                <Stack.Screen name='BackupStep1Screen' component={BackupStep1Screen} />
                <Stack.Screen name='BackupSettingsScreen' component={BackupSettingsScreen} />
                <Stack.Screen name='EnterMnemonicPhrase' component={EnterMnemonicPhrase} />
                <Stack.Screen name='WalletCreateWithAnimation' component={WalletCreateWithAnimation} options={{ gestureEnabled: false }} />
                <HomeStack.Screen name='BotSupportScreen' component={BotSupportScreen} />

                <Stack.Screen name='WebViewScreen' component={WebViewScreen} />

                <Stack.Screen name='ErrorScreen' component={ErrorScreen} />

                <Stack.Screen name='HomeDragScreen' component={HomeDragScreen} />
                <Stack.Screen name='GuideScreen' component={GuideScreen} />
            </Stack.Group>
        </Stack.Navigator>
    )
}
