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

            if(typeof this.props.exchangeStore.tradeApiConfig.exchangeWays === 'undefined') {
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
                    <FontistoIcon size={18} name={'shopping-basket-add'} color={`${'#404040'}`}/>
                </View>
                <Text style={{ ...styles.navigation__item__text, marginTop: 4 }}>{strings('dashboardStack.buy')}</Text>
            </View>
        )
    }

    renderExchangeTooltip = () => {
        return (
            <View style={{ alignItems: 'center' }}>
                <CustomIcon name="exchangeMain" style={{ marginTop: 2, color: '#404040', fontSize: 18 }}/>
                <Text style={{ ...styles.navigation__item__text, marginTop: 3 }}>{strings('dashboardStack.exchange')}</Text>
            </View>
        )
    }

    render() {

        return (
            <View style={styles.wrapper}>

                <TouchableOpacity style={[styles.navigation__item]} onPress={() => this.handleMainBtn('BUY')}>
                    <ToolTips showAfterRender={true} type={'HOME_SCREEN_BUY_BTN_TIP'} height={100} MainComponent={this.returnBuyTooltip}/>
                </TouchableOpacity>

                <TouchableOpacity style={styles.navigation__item} onPress={() => this.handleModal()}>
                    <ToolTips type={'HOME_SCREEN_EXCHANGE_BTN_TIP'} height={100} MainComponent={this.renderExchangeTooltip}/>
                </TouchableOpacity>

                <TouchableOpacity style={styles.navigation__item} onPress={() => this.handleMainBtn('SELL')}>
                    <View style={{ marginTop: 1 }}>
                        <FontistoIcon size={18} name={'shopping-basket-remove'} color={`${'#404040'}`}/>
                    </View>
                    <Text style={{ ...styles.navigation__item__text, marginTop: 4 }}>{strings('dashboardStack.sell')}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.navigation__item} onPress={this.handleCashback}>
                    <CustomIcon name="earn" style={{ color: '#404040', marginTop: 2 }} size={20}/>
                    <Text style={[styles.navigation__item__text, { marginTop: 2 }]}>{strings('dashboardStack.earn')}</Text>
                </TouchableOpacity>

                <View style={styles.wrapper__shadow}>
                    <View style={styles.wrapper__shadow__item}/>
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
    wrapper: {
        flexDirection: 'row',

        position: 'relative',
        zIndex: 2,

        width: '100%',
        // height: deviceModel === 'iPhone X' || deviceModel === 'iPhone XS Max' ? 108 : 78,
        paddingTop: 22

    },
    wrapper__shadow: {
        position: 'absolute',
        top: 20,
        left: 0,
        bottom: 0,
        right: 0,

        borderTopWidth: Platform.OS === 'android' ? 1 : 0,
        borderTopColor: '#f5f5f5',

        backgroundColor: '#fff',

        zIndex: 1
    },
    wrapper__shadow__item: {
        flex: 1,

        // marginTop: 20,

        backgroundColor: '#f9f9f9',

        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 12
        },
        shadowOpacity: 0.3,
        shadowRadius: 16.00,

        elevation: 24
    },
    navigation__item: {
        position: 'relative',
        alignItems: 'center',

        flex: 1,

        paddingVertical: 6,

        zIndex: 2
    },
    navigation__item__content: {
        position: 'relative',
        width: 80
    },
    navigation__item_main: {
        marginTop: -30
    },
    navigation__item__text: {
        fontSize: 12,
        fontFamily: 'SFUIDisplay-Regular',
        color: '#404040'
    },
    navigation__main: {
        // position: 'absolute',
        // left: 0,
        // top: 0,

        justifyContent: 'center',
        alignItems: 'center',

        width: 60,
        height: 60,

        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1
        },
        shadowOpacity: 0.22,
        shadowRadius: 2.22,

        elevation: 3,

        backgroundColor: '#fff',

        borderRadius: 30,
        zIndex: 3
    },
    navigation__main__container: {
        position: 'relative',

        // width: 60,
        // height: 60,

        backgroundColor: '#fff',
        borderRadius: 40,
        zIndex: 3
    },
    navigation__main__shadow: {
        position: 'absolute',
        top: 20,
        left: -30,

        width: 140,
        height: 64,

        zIndex: 2
    },
    navigation__main__white: {
        position: 'absolute',
        top: -55,
        left: -35,

        width: 80,
        height: 80,

        backgroundColor: '#fff',
        borderRadius: 80
    }
}
