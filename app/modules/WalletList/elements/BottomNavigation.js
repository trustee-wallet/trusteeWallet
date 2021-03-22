/**
 * @version 0.11
 */
import React, { Component } from 'react'
import { View, Text, TouchableOpacity, Platform } from 'react-native'
import { connect } from 'react-redux'

import NavStore from '@app/components/navigation/NavStore'
import CustomIcon from '@app/components/elements/CustomIcon'

import { strings } from '@app/services/i18n'

import Log from '@app/services/Log/Log'
import Netinfo from '@app/services/Netinfo/Netinfo'

import { ThemeContext } from '@app/modules/theme/ThemeProvider'

import config from '@app/config/config'

import BlocksoftExternalSettings from '@crypto/common/BlocksoftExternalSettings'


class BottomNavigation extends Component {

    constructor() {
        super()
        this.state = {}
        this.buySellBtnTooltip = React.createRef()
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

    handleSellBtn = () => {
        NavStore.goNext('SellV3ScreenStack')
    }


    handleMainBtn = async (type) => {
        try {
            await Netinfo.isInternetReachable()

            if (type === 'SELL') {
                    NavStore.goNext('MainV3DataScreen', { tradeType: 'SELL' })
            } else if (type === 'BUY') {
                    NavStore.goNext('MainV3DataScreen', { tradeType: 'BUY' })
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
                            </>
                            :
                            <>
                                <TouchableOpacity style={styles.navigation__item} onPress={() => this.handleMainBtn('BUY')}>
                                    <CustomIcon name="buy" style={{ color: colors.common.text1 }} size={21} />
                                    <Text style={{ ...styles.navigation__item__text, color: colors.homeScreen.tabBarText, marginTop: 3 }}>{strings('dashboardStack.buy')}</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.navigation__item} onPress={() => this.handleModal()}>
                                    <CustomIcon name="exchange" style={{ color: colors.common.text1 }} size={21} />
                                    <Text style={{ ...styles.navigation__item__text, color: colors.homeScreen.tabBarText, marginTop: 3 }}>{strings('dashboardStack.exchange')}</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.navigation__item} onPress={() => this.handleMainBtn('SELL')}>
                                    <CustomIcon name="sell" style={{ color: colors.common.text1 }} size={21} />
                                    <Text style={{ ...styles.navigation__item__text, color: colors.homeScreen.tabBarText }}>{strings('dashboardStack.sell')}</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.navigation__item} onPress={this.handleCashback}>
                                    <CustomIcon name="earn" style={{ color: colors.common.text1 }} size={20} />
                                    <Text style={[styles.navigation__item__text, { color: colors.homeScreen.tabBarText }]} numberOfLines={1} >{strings('dashboardStack.earn')}</Text>
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
        alignItems: 'center',
        flex: 4
    },
    navigation__item__text: {
        fontSize: 12,
        fontFamily: 'SFUIDisplay-Regular',
        marginTop: 3
    },
}
