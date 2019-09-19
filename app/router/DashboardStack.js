import React from 'react'
import { View } from 'react-native'

import { createMaterialBottomTabNavigator } from 'react-navigation-material-bottom-tabs'
import IconAwesome from 'react-native-vector-icons/FontAwesome'
import IconAwesome5 from 'react-native-vector-icons/FontAwesome5'
import Wallet from 'react-native-vector-icons/MaterialCommunityIcons'
import Cycle from 'react-native-vector-icons/Entypo'

import { strings } from '../services/i18n'

import HomeScreenStack from './HomeStack'
import ExchangeScreenStack from './ExchangeScreenStack'
import SettingsScreenStack from './SettingsStack'
import NavStore from '../components/navigation/NavStore'
import { setExchangeType } from '../appstores/Actions/ExchangeStorage'


export default (props) => {
    return createMaterialBottomTabNavigator({

        ExchangeStack: {
            screen: HomeScreenStack,
            navigationOptions: () => ({
                tabBarLabel: strings('dashboardStack.exchange'),
                tabBarIcon: ({ focused }) => <Cycle size={20} name="cycle" color={`${focused ? '#404040': '#404040'}`} />,
                tabBarOnPress: () => {
                    NavStore.goNext('ExchangeScreenStack')
                }
            })
        },

        HomeStack: {
            screen: HomeScreenStack,
            navigationOptions: () => ({
                title: strings('dashboardStack.buy'),
                tabBarIcon: ({ focused }) => <View><IconAwesome5 size={20} name="shopping-cart" color={`${focused ? '#404040' : '#404040'}`}/></View>,
                tabBarOnPress: () => {
                    setExchangeType({ exchangeType: 'BUY' })
                    NavStore.goNext('MainDataScreen')
                }
            }),
        },

        SettingsStack: {
            screen: HomeScreenStack,
            navigationOptions: () => ({
                tabBarLabel: strings('dashboardStack.settings'),
                tabBarIcon: ({ focused }) => <IconAwesome size={20} name="gear" color={`${focused ? '#404040': '#404040'}`} />,
                tabBarOnPress: () => {
                    NavStore.goNext('SettingsScreenStack')
                }
            })
        },


    }, {
        initialRouteName: 'HomeStack',
        activeColor: '#404040',
        inactiveColor: '#404040',



        barStyle: { backgroundColor: '#fff' }
    })
}
