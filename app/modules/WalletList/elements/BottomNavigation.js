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
import ExchangeActions from '../../../appstores/Stores/Exchange/ExchangeActions'

import Log from '../../../services/Log/Log'
import Netinfo from '../../../services/Netinfo/Netinfo'

import { setLoaderStatus } from '../../../appstores/Stores/Main/MainStoreActions'
import { showModal } from '../../../appstores/Stores/Modal/ModalActions'

import { ThemeContext } from '../../../modules/theme/ThemeProvider'

import AsyncStorage from '@react-native-community/async-storage'


class BottomNavigation extends Component {

    constructor() {
        super()
        this.state = {
            btnType: 'BUY',
            tips: true
        }
        this.buySellBtnTooltip = React.createRef()
    }

    handleModal = async () => {
        try {
            await Netinfo.isInternetReachable()

            const isNewInterface = await AsyncStorage.getItem('isNewInterface')
            if (isNewInterface === 'true') {
                NavStore.goNext('ExchangeV3ScreenStack')
            } else {
                await this._showModalNoOldConfigs()
                NavStore.goNext('ExchangeScreenStack')
            }
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

    _showModalNoOldConfigs = async () => {
        if (typeof this.props.exchangeStore.tradeApiConfig.exchangeWays === 'undefined') {
            setLoaderStatus(true)
            await ExchangeActions.init()
            setLoaderStatus(false)
        }
        if(typeof this.props.exchangeStore.tradeApiConfig.exchangeWays === 'undefined') {
            showModal({
                type: 'INFO_MODAL',
                icon: 'INFO',
                title: strings('modal.exchange.sorry'),
                description: strings('tradeScreen.modalError.serviceUnavailable')
            })
        }
    }

    handleMainBtn = async (type) => {
        try {
            await Netinfo.isInternetReachable()

            ToolTipsActions.setToolTipState('HOME_SCREEN_BUY_SELL_BTN_TIP')

            ExchangeActions.handleSetTradeType({ tradeType: type })

            if (type === 'SELL') {
                const isNewInterfaceSell = await AsyncStorage.getItem('isNewInterfaceSell')

                if (isNewInterfaceSell === 'true') {
                    ExchangeActions.handleSetNewInterface(true, 'SELL')
                    NavStore.goNext('TradeV3ScreenStack')
                } else {
                    await this._showModalNoOldConfigs()
                    ExchangeActions.handleSetNewInterface(false, 'SELL')
                    NavStore.goNext('TradeScreenStack')
                }
            } else if (type === 'BUY') {
                const isNewInterfaceBuy = await AsyncStorage.getItem('isNewInterfaceBuy')

                if (isNewInterfaceBuy === 'true') {
                    ExchangeActions.handleSetNewInterface(true, 'BUY')
                    NavStore.goNext('TradeV3ScreenStack')
                } else {
                    await this._showModalNoOldConfigs()
                    ExchangeActions.handleSetNewInterface(false, 'BUY')
                    NavStore.goNext('TradeScreenStack')
                }
            } else {
                await this._showModalNoOldConfigs()
                NavStore.goNext('TradeScreenStack')
            }

        } catch (e) {
            if (Log.isNetworkError(e.message)) {
                Log.log('HomeScreen.BottomNavigation handleMainBtn error ' + e.message)
            } else {
                Log.err('HomeScreen.BottomNavigation handleMainBtn error ' + e.message)
            }
        }
    }

    handleCashback = () => {
        NavStore.goNext('CashbackScreen')
    }

    returnBuyTooltip = () => {
        const { colors } = this.context
        return (
            <View style={{ alignItems: 'center' }}>
                <View style={{ marginTop: 1 }}>
                    <FontistoIcon size={18} name={'shopping-basket-add'} color={colors.common.text1} />
                </View>
                <Text style={{ ...styles.navigation__item__text, color: colors.homeScreen.tabBarText, marginTop: 4 }}>{strings('dashboardStack.buy')}</Text>
            </View>
        )
    }

    renderExchangeTooltip = () => {
        const { colors } = this.context
        return (
            <View style={{ alignItems: 'center' }}>
                <CustomIcon name="exchange" style={{ marginTop: 0, color: colors.common.text1, fontSize: 20 }} />
                <Text style={{ ...styles.navigation__item__text, color: colors.homeScreen.tabBarText, marginTop: 3 }}>{strings('dashboardStack.exchange')}</Text>
            </View>
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

                    <TouchableOpacity style={[styles.navigation__item]} onPress={() => this.handleMainBtn('BUY')}>
                        <ToolTips showAfterRender={true} type={'HOME_SCREEN_BUY_BTN_TIP'} height={100} MainComponent={() => this.returnBuyTooltip()} />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.navigation__item} onPress={() => this.handleModal()}>
                        <ToolTips type={'HOME_SCREEN_EXCHANGE_BTN_TIP'} height={100} MainComponent={() => this.renderExchangeTooltip()} />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.navigation__item} onPress={() => this.handleMainBtn('SELL')}>
                        <View style={{ marginTop: 1 }}>
                            <FontistoIcon size={18} name={'shopping-basket-remove'} color={colors.common.text1} />
                        </View>
                        <Text style={{ ...styles.navigation__item__text, color: colors.homeScreen.tabBarText, marginTop: 4 }}>{strings('dashboardStack.sell')}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.navigation__item} onPress={this.handleCashback}>
                        <CustomIcon name="earn" style={{ color: colors.common.text1, marginTop: 2 }} size={20} />
                        <Text style={[styles.navigation__item__text, { color: colors.homeScreen.tabBarText, marginTop: 2 }]}>{strings('dashboardStack.earn')}</Text>
                    </TouchableOpacity>

                    <View style={styles.itemStub} />
                </View>
            </View>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        exchangeStore: state.exchangeStore
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
        alignItems: 'center',
        flex: 4,
        paddingTop: 8,
        paddingBottom: 6,
    },
    navigation__item__text: {
        fontSize: 12,
        fontFamily: 'SFUIDisplay-Regular',
    },
}
