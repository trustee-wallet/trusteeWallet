/**
 * @version 0.43
 */
import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'

import NavStore from '@app/components/navigation/NavStore'
import CustomIcon from '@app/components/elements/CustomIcon'

import { strings } from '@app/services/i18n'

import Log from '@app/services/Log/Log'
import Netinfo from '@app/services/Netinfo/Netinfo'

import { ThemeContext } from '@app/modules/theme/ThemeProvider'

import BlocksoftExternalSettings from '@crypto/common/BlocksoftExternalSettings'
import { showModal } from '@app/appstores/Stores/Modal/ModalActions'
import AsyncStorage from '@react-native-community/async-storage'


class BottomNavigation extends React.PureComponent {

    handleMainMarket = async () => {
        try {
            await Netinfo.isInternetReachable()

            let showMsg = await AsyncStorage.getItem('smartSwapMsg')
            showMsg = showMsg ? JSON.parse(showMsg) : false

            if (typeof showMsg === 'undefined' || !showMsg) {
                showModal({
                    type: 'MARKET_MODAL',
                    icon: 'INFO',
                    title: strings('modal.marketModal.title'),
                    description: strings('modal.marketModal.description'),
                }, () => {
                    NavStore.goNext('MarketScreen')
                })
            } else {
                NavStore.goNext('MarketScreen')
            }

        } catch (e) {
            if (Log.isNetworkError(e.message)) {
                Log.log('HomeScreen.BottomNavigation handleMainMarket error ' + e.message)
            } else {
                Log.err('HomeScreen.BottomNavigation handleMainMarket error ' + e.message)
            }
        }
    }

    handleSupport = async () => {
        const link = await BlocksoftExternalSettings.get('SUPPORT_BOT')
        NavStore.goNext('WebViewScreen', { url: link, title: strings('settings.about.contactSupportTitle') })
    }

    handleCashback = () => {
        NavStore.goNext('CashbackScreen')
    }

    render() {
        const { colors } = this.context
        return (
            <View>
                <View style={styles.wrapper__shadow__android}>
                    <View style={styles.wrapper__shadow__item__android} />
                </View>
                <View style={[styles.contentWrapper, { backgroundColor: colors.homeScreen.tabBarBackground }]}>
                    <View style={styles.itemStub} />

                                <TouchableOpacity style={{...styles.navigation__item, alignItems: 'center', flex: 3}} onPress={this.handleMainMarket}>
                                    <CustomIcon name="buy" style={{ color: colors.common.text1 }} size={21} />
                                    <Text style={{ ...styles.navigation__item__text, color: colors.homeScreen.tabBarText }}>{strings('dashboardStack.market')}</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={{...styles.navigation__item, alignItems: 'center', flex: 3}} onPress={this.handleCashback}>
                                    <CustomIcon name="earn" style={{ color: colors.common.text1 }} size={20} />
                                    <Text style={[styles.navigation__item__text, { color: colors.homeScreen.tabBarText }]}>{strings('dashboardStack.earn')}</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={{...styles.navigation__item, alignItems: 'center', flex: 3}} onPress={this.handleSupport}>
                                    <CustomIcon name="support" style={{ color: colors.common.text1 }} size={20} />
                                    <Text style={[styles.navigation__item__text, { color: colors.homeScreen.tabBarText }]}>{strings('dashboardStack.support')}</Text>
                                </TouchableOpacity>

                    <View style={styles.itemStub} />
                </View>
            </View>
        )
    }
}

BottomNavigation.contextType = ThemeContext

export default BottomNavigation

const styles = StyleSheet.create({
    contentWrapper: {
        flexDirection: 'row',
        zIndex: 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: -14
        },
        shadowOpacity: 0.06,
        shadowRadius: 10,
    },
    itemStub: {
        flex: 1,
    },
    wrapper__shadow__android: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 5,
        zIndex: 1,
    },
    wrapper__shadow__item__android: {
        flex: 1,
        borderWidth: 1,
        borderColor: 'transparent',
        elevation: 20,
    },
    navigation__item: {
        paddingTop: 8,
        paddingBottom: 6,
        justifyContent: 'space-between',
        alignItems: 'center',
        flex: 4
    },
    navigation__item__text: {
        fontSize: 12,
        fontFamily: 'SFUIDisplay-Regular',
        marginTop: 3
    },
})
