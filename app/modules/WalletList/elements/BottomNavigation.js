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
            // AppSupport.isExchangeAvailable()

            if (typeof this.props.exchangeStore.tradeApiConfig.exchangeWays === 'undefined') {
                setLoaderStatus(true)
                await ExchangeActions.init()
                setLoaderStatus(false)
            }

            // NavStore.goNext('ExchangeScreenStack')
            const newInterface = AsyncStorage.getItem('isNewInterface').then(res => {
                let isNewInterface = JSON.parse(res)
                isNewInterface = isNewInterface === true ? NavStore.goNext('ExchangeV3ScreenStack') : NavStore.goNext('ExchangeScreenStack')
            })
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

            if (typeof this.props.exchangeStore.tradeApiConfig.exchangeWays === 'undefined') {
                setLoaderStatus(true)
                await ExchangeActions.init()
                setLoaderStatus(false)
            }

            ToolTipsActions.setToolTipState('HOME_SCREEN_BUY_SELL_BTN_TIP')

            ExchangeActions.handleSetTradeType({ tradeType: type })

            if (typeof this.props.exchangeStore.tradeApiConfig.exchangeWays === 'undefined') {
                showModal({
                    type: 'INFO_MODAL',
                    icon: 'INFO',
                    title: strings('modal.exchange.sorry'),
                    description: strings('tradeScreen.modalError.serviceUnavailable')
                })
                // } else {
                // if (type === 'SELL') {
                //     const isNewInterfaceSell = await AsyncStorage.getItem('isNewInterfaceSell')

                //     if (isNewInterfaceSell === 'true') {
                //         NavStore.goNext('TradeV3ScreenStack')
                //     } else {
                //         NavStore.goNext('TradeScreenStack')
                //     }
            } else {
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
        return (
            <View style={{ alignItems: 'center' }}>
                <View style={{ marginTop: 1 }}>
                    <FontistoIcon size={18} name={'shopping-basket-add'} color={`${'#404040'}`} />
                </View>
                <Text style={{ ...styles.navigation__item__text, marginTop: 4 }}>{strings('dashboardStack.buy')}</Text>
            </View>
        )
    }

    renderExchangeTooltip = () => {
        return (
            <View style={{ alignItems: 'center' }}>
                <CustomIcon name="exchangeMain" style={{ marginTop: 2, color: '#404040', fontSize: 18 }} />
                <Text style={{ ...styles.navigation__item__text, marginTop: 3 }}>{strings('dashboardStack.exchange')}</Text>
            </View>
        )
    }

    render() {

        return (
            <View>
                <View style={styles.wrapper__shadow__android}>
                    <View style={styles.wrapper__shadow__item__android} />
                </View>
                <View style={styles.contentWrapper}>
                    <View style={styles.itemStub} />

                    <TouchableOpacity style={[styles.navigation__item]} onPress={() => this.handleMainBtn('BUY')}>
                        <ToolTips showAfterRender={true} type={'HOME_SCREEN_BUY_BTN_TIP'} height={100} MainComponent={this.returnBuyTooltip} />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.navigation__item} onPress={() => this.handleModal()}>
                        <ToolTips type={'HOME_SCREEN_EXCHANGE_BTN_TIP'} height={100} MainComponent={this.renderExchangeTooltip} />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.navigation__item} onPress={() => this.handleMainBtn('SELL')}>
                        <View style={{ marginTop: 1 }}>
                            <FontistoIcon size={18} name={'shopping-basket-remove'} color={`${'#404040'}`} />
                        </View>
                        <Text style={{ ...styles.navigation__item__text, marginTop: 4 }}>{strings('dashboardStack.sell')}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.navigation__item} onPress={this.handleCashback}>
                        <CustomIcon name="earn" style={{ color: '#404040', marginTop: 2 }} size={20} />
                        <Text style={[styles.navigation__item__text, { marginTop: 2 }]}>{strings('dashboardStack.earn')}</Text>
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

export default connect(mapStateToProps, {})(BottomNavigation)

const styles = {
    contentWrapper: {
        flexDirection: 'row',
        backgroundColor: '#f7f7f7',
        zIndex: 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: -13
        },
        shadowOpacity: 0.07,
        shadowRadius: 14,
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
        color: '#404040'
    },
}
