/**
 * @version 0.11
 */
import React, { Component } from 'react'
import { View, Text, TouchableOpacity, Platform } from 'react-native'
import { connect } from 'react-redux'

import IconAwesome from 'react-native-vector-icons/FontAwesome'
import FontistoIcon from 'react-native-vector-icons/Fontisto'

import NavStore from '../../../components/navigation/NavStore'
import ToolTips from '../../../components/elements/ToolTips'
import CustomIcon from '../../../components/elements/CustomIcon'

import { strings } from '../../../services/i18n'

import ToolTipsActions from '../../../appstores/Stores/ToolTips/ToolTipsActions'

import Log from '../../../services/Log/Log'
import Netinfo from '../../../services/Netinfo/Netinfo'

import { setLoaderStatus } from '../../../appstores/Stores/Main/MainStoreActions'
import { showModal } from '../../../appstores/Stores/Modal/ModalActions'

import { ThemeContext } from '../../../modules/theme/ThemeProvider'

import AsyncStorage from '@react-native-community/async-storage'
import settingsStoreReducer from '../../../appstores/Stores/Settings/SettingsStore'
import config from '../../../config/config'

import BlocksoftExternalSettings from '../../../../crypto/common/BlocksoftExternalSettings'


class BottomNavigation extends Component {

    constructor() {
        super()
        this.state = {
            btnType: 'BUY',
            tips: true
        }
    }

    handleModal = async () => {
        try {
            await Netinfo.isInternetReachable()
            NavStore.goNext('ExchangeV3ScreenStack')
        } catch (e) {
            if (Log.isNetworkError(e.message) || e.message.includes('UI_ERROR')) {
                Log.log('HomeScreen.BottomNavigation handleModal error ' + e.message)
            } else {
                Log.err('HomeScreen.BottomNavigation handleModal error ' + e.message)
            }
        }
    }

    handleMainBtn = async (tradeType) => {
        try {
            await Netinfo.isInternetReachable()

            ToolTipsActions.setToolTipState('HOME_SCREEN_BUY_SELL_BTN_TIP')

            if (tradeType === 'SELL') {
                NavStore.reset('MainV3DataScreen', { oldInterface : false, tradeType })
            } else if (tradeType === 'BUY') {
                NavStore.reset('MainV3DataScreen', { oldInterface : false, tradeType })
            } else {
               throw new Error('plz use type SELL or BUY, provided ' + tradeType)
            }

        } catch (e) {
            if (Log.isNetworkError(e.message)) {
                Log.log('HomeScreen.BottomNavigation handleMainBtn error ' + e.message)
            } else {
                Log.err('HomeScreen.BottomNavigation handleMainBtn error ' + e.message)
            }
        }
    }

    handleMainMarket = async () => {
        try {
            await Netinfo.isInternetReachable()

            NavStore.goNext('MarketScreen')

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

    returnBuyTooltip = () => {
        const { colors } = this.context
        return (
            <TouchableOpacity style={styles.navigation__item} onPress={() => this.handleMainBtn('BUY')}>
            <View style={{ alignItems: 'center' }}>
                <CustomIcon name="buy" style={{ color: colors.common.text1 }} size={21} />
                <Text style={{ ...styles.navigation__item__text, color: colors.homeScreen.tabBarText, marginTop: 3 }}>{strings('dashboardStack.buy')}</Text>
            </View>
            </TouchableOpacity>
        )
    }

    renderExchangeTooltip = () => {
        const { colors } = this.context
        return (
            <TouchableOpacity style={styles.navigation__item} onPress={() => this.handleModal()}>
            <View style={{ alignItems: 'center' }}>
                <CustomIcon name="exchange" style={{ color: colors.common.text1 }} size={21} />
                <Text style={{ ...styles.navigation__item__text, color: colors.homeScreen.tabBarText, marginTop: 3 }}>{strings('dashboardStack.exchange')}</Text>
            </View>
            </TouchableOpacity>
        )
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
                    {config.exchange.mode === 'DEV' ?
                        <>
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

                        </> :
                        <>
                            <View style={{ alignItems: 'center', flex: 4 }}>
                                <ToolTips showAfterRender={true} type={'HOME_SCREEN_BUY_BTN_TIP'} height={150}
                                    MainComponent={this.returnBuyTooltip} />
                            </View>
                            {/* </TouchableOpacity> */}

                            <View style={{ alignItems: 'center', flex: 4 }}>
                                <ToolTips type={'HOME_SCREEN_EXCHANGE_BTN_TIP'} height={150} MainComponent={this.renderExchangeTooltip} />
                            </View>
                            {/* </TouchableOpacity> */}

                            <TouchableOpacity style={{...styles.navigation__item, alignItems: 'center', flex: 4}} onPress={() => this.handleMainBtn('SELL')}>
                                <CustomIcon name="sell" style={{ color: colors.common.text1 }} size={21} />
                                <Text style={{ ...styles.navigation__item__text, color: colors.homeScreen.tabBarText }}>{strings('dashboardStack.sell')}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={{...styles.navigation__item, alignItems: 'center', flex: 4}} onPress={this.handleCashback}>
                                <CustomIcon name="earn" style={{ color: colors.common.text1 }} size={20} />
                                <Text style={[styles.navigation__item__text, { color: colors.homeScreen.tabBarText }]}>{strings('dashboardStack.earn')}</Text>
                            </TouchableOpacity>
                        </>
                    }

                    <View style={styles.itemStub} />
                </View>
            </View>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        language: state.settingsStore.data.language
    }
}

BottomNavigation.contextType = ThemeContext

export default connect(mapStateToProps, {})(BottomNavigation)

const styles = {
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
        padding: 10
    },
    navigation__item__text: {
        fontSize: 12,
        fontFamily: 'SFUIDisplay-Regular',
        marginTop: 3
    },
}
