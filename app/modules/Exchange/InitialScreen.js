import React, { Component } from 'react'
import { connect } from 'react-redux'

import { Image, Text, View, ScrollView, Dimensions, Platform, TouchableOpacity } from 'react-native'
import GradientView from '../../components/elements/GradientView'
import Navigation from '../../components/navigation/Navigation'
import Button from '../../components/elements/Button'
import ButtonLine from '../../components/elements/ButtonLine'
import TextView from '../../components/elements/Text'
import NavStore from '../../components/navigation/NavStore'
import MaterialCommunity from 'react-native-vector-icons/MaterialCommunityIcons'
import { showModal, hideModal } from '../../appstores/Actions/ModalActions'
import { setExchangeType } from '../../appstores/Actions/ExchangeStorage'
import api from '../../services/api'

import { strings } from '../../services/i18n'
import i18n from '../../services/i18n'
import firebase from 'react-native-firebase'
import Log from '../../services/Log/Log'
import BlocksoftPrettyNumbers from '../../../crypto/common/BlocksoftPrettyNumbers'
import Swipeable from 'react-native-swipeable'
import { capitalize } from '../../services/utils'

import Cashback from '../../services/Cashback/Cashback'
import { setLoaderStatus } from '../../appstores/Actions/MainStoreActions'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

class InitialScreen extends Component {

    constructor() {
        super()
        this.state = {
            orders: []
        }
    }

    async componentDidMount() {
        this._onFocusListener = this.props.navigation.addListener('didFocus', async (payload) => {
            setLoaderStatus(true)



            const res = await api.getExchangeOrders()

            if(res.data.state == 'success'){
                const { buy, sell } = res.data.data

                //INFO: prepare orders

                const tmpBuyOrders = buy.map(obj=> ({ ...obj, type: 'BUY' }))

                const tmpSellOrders = sell.map(obj=> ({ ...obj, type: 'SELL' }))

                let orders = tmpBuyOrders.concat(tmpSellOrders)


                orders = orders.sort((a, b) => b.createdAt - a.createdAt)

                this.setState({
                    orders: orders
                })
            }

            setLoaderStatus(false)
        })
    }

    handleBuy = () => {
        setExchangeType({ exchangeType: 'BUY' })
        NavStore.goNext('MainDataScreen')
    }

    handleSell = () => {
        setExchangeType({ exchangeType: 'SELL' })
        NavStore.goNext('MainDataScreen')
    }

    render() {
        firebase.analytics().setCurrentScreen('Exchange.InitialScreen')
        Log.log('Exchange.InitialScreen is rendered')

        const { orders } = this.state

        return (
            <GradientView
                style={styles.wrapper}
                array={styles.wrapper_gradient.array}
                start={styles.wrapper_gradient.start}
                end={styles.wrapper_gradient.end}>
                <Navigation
                    title={strings('exchange.title')}/>
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{
                        flexGrow: 1,
                        justifyContent: 'space-between'
                    }}
                    style={styles.wrapper__scrollView}>
                    <View style={styles.wrapper__content}>

                        <View style={styles.transaction}>
                            <Text style={styles.transaction_title}>{strings('exchangeInit.ordersHistory')}</Text>
                            {
                                orders.length ? orders.map((item, index) => {

                                    let date = new Date(item.createdAt)
                                    date = date.toString()
                                    date = date.split(' ')

                                    let prettieAmount = item.requestedFiat
                                    prettieAmount = +prettieAmount
                                    prettieAmount = parseFloat(prettieAmount.toFixed(5))

                                    return (
                                        <View style={{ position: 'relative', paddingBottom: Platform.OS === 'ios' ? 5 : 0, overflow: 'visible' }} key={index}>
                                            <View style={{ position: 'relative', zIndex: 3 }}>
                                                {
                                                    item.type === 'SELL' ?
                                                        <View>
                                                            <View style={styles.transaction__item}>
                                                                <Text style={{ ...styles.transaction__subtext, fontSize: 14, marginTop: 2, width: 52 }}>
                                                                    {date[1] + ' ' + date[2]}
                                                                </Text>
                                                                <GradientView style={styles.circle}
                                                                              array={circle.array}
                                                                              start={circle.start}
                                                                              end={circle.end}/>
                                                                <TouchableOpacity style={styles.transaction__content}
                                                                                  onPress={() => this.handleLink({ address: item.transaction_hash })}>
                                                                    <View>
                                                                        <Text style={styles. transaction__expand}>
                                                                            { capitalize(strings(`exchange.${item.type.toLowerCase()}`)) }
                                                                        </Text>
                                                                        <Text style={styles.transaction__subtext}>
                                                                            { item.depositAddress.slice(0, 4) + '...' + item.depositAddress.slice(item.depositAddress.length - 4, item.depositAddress.length) }
                                                                        </Text>
                                                                    </View>
                                                                    <View>
                                                                        <Text style={[styles.transaction__expand, styles.textAlign_right]}>
                                                                            - { item.requestedCrypto } {item.currency.toUpperCase()}
                                                                        </Text>
                                                                        <Text style={[styles.transaction__subtext, styles.textAlign_right]}>
                                                                            { item.status }
                                                                        </Text>
                                                                    </View>
                                                                </TouchableOpacity>
                                                            </View>
                                                        </View>
                                                        :
                                                        <View style={[styles.transaction__item]}>
                                                            <Text style={{ ...styles.transaction__subtext, fontSize: 14, marginTop: 2, width: 52 }}>
                                                                {date[1] + ' ' + date[2]}
                                                            </Text>
                                                            <GradientView style={styles.circle}
                                                                          array={circle.array_}
                                                                          start={circle.start}
                                                                          end={circle.end}/>
                                                            <TouchableOpacity style={styles.transaction__content}
                                                                              onPress={() => this.handleLink({ address: item.transaction_hash })}>
                                                                <View>
                                                                    <Text style={[styles.transaction__income]}>
                                                                        { capitalize(strings(`exchange.${item.type.toLowerCase()}`)) }
                                                                    </Text>
                                                                    <Text style={[styles.transaction__subtext]}>
                                                                        { item.withdrawDestination.slice(0, 4) + '...' + item.withdrawDestination.slice(item.withdrawDestination.length - 4, item.withdrawDestination.length) }
                                                                    </Text>
                                                                </View>
                                                                <View>
                                                                    <Text style={[styles.transaction__income, styles.textAlign_right]}>
                                                                        + { item.requestedCrypto } {item.currency.toUpperCase()}
                                                                    </Text>
                                                                    <Text style={[styles.transaction__subtext, styles.textAlign_right]}>
                                                                        { item.status }
                                                                    </Text>
                                                                </View>
                                                            </TouchableOpacity>
                                                        </View>
                                                }
                                            </View>
                                            { orders.length != index + 1 ? <GradientView key={index} style={styles.line} array={line.array} start={line.start} end={line.end}/> : null }
                                        </View>
                                    )
                                }) : <Text style={styles.transaction__empty_text}>{strings('exchangeInit.ordersNull')}</Text>
                            }
                        </View>
                    </View>
                </ScrollView>
                <View style={styles.buttons}>
                    <View style={styles.btn}>
                        <ButtonLine press={this.handleSell}
                                    innerStyle={{ borderTopRightRadius: 0, borderBottomRightRadius: 0 }}>
                            {strings('exchange.sell')}
                        </ButtonLine>
                    </View>
                    <View style={styles.btn}>
                        <Button press={this.handleBuy}
                                innerStyle={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
                                btnWrapStyle={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}>
                            {strings('exchange.buy')}
                        </Button>
                    </View>
                </View>
            </GradientView>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        wallet: state.mainStore.selectedWallet,
        selectedAccount: state.mainStore.selectedAccount
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        dispatch
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(InitialScreen)

const circle = {
    array: ['#752cb2', '#efa7b5'],
    array_: ['#7127ac', '#9b62f0'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 0 }
}

const line = {
    array: ['#752cb2', '#efa7b5'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 0 }
}

const styles = {
    wrapper: {
        flex: 1
    },
    wrapper__scrollView: {
        marginTop: 80,
    },
    wrapper_gradient: {
        array: ['#fff', '#fff'],
        start: { x: 0.0, y: 0 },
        end: { x: 0, y: 1 }
    },
    wrapper__content: {
        flex: 1,
        marginTop: 20,
        paddingLeft: 15,
        paddingRight: 15
    },
    title: {
        marginTop: 20,
        marginBottom: 20,
        textAlign: 'center',
        fontSize: 24,
        fontFamily: 'SFUIDisplay-Semibold',
        color: '#404040'
    },
    buttons: {
        flexDirection: 'row',
        width: '100%',
        minHeight: 50,
        paddingTop: 20,
        paddingBottom: 20,
        paddingHorizontal: 30,

        backgroundColor: '#fff',

        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 7,
        },
        shadowOpacity: 0.43,
        shadowRadius: 9.51,

        elevation: 10,
    },
    buttons__content: {
        paddingHorizontal: 15,
    },
    btn: {
        flex: 1,
        marginBottom: 20
    },
    btn_divider: {
        width: 30
    },
    texts: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 20,
        marginRight: 30
    },
    texts__item: {
        fontSize: 16,
        fontFamily: 'SFUIDisplay-Regular',
        color: '#e77ca3'
    },
    texts__icon: {
        marginRight: 10,
        transform: [{ rotate: '180deg' }]
    },
    img: {
        alignSelf: 'center',
        width: 220,
        height: 250,
        marginTop: 0,
        marginBottom: 0
    },




    transaction_title: {
        marginLeft: 15,
        marginBottom: 10,
        color: '#404040',
        fontSize: 22,
        fontFamily: 'SFUIDisplay-Regular'
    },
    transaction__empty_text: {
        marginTop: -10,
        marginLeft: 15,
        color: '#404040',
        fontSize: 16,
        fontFamily: 'SFUIDisplay-Regular'
    },
    transaction__item: {
        position: 'relative',
        paddingTop: 10,
        paddingBottom: 10,
        marginLeft: 15,
        marginRight: 15,
        flexDirection: 'row',
        alignItems: 'center'
    },
    transaction__item_active: {
        backgroundColor: '#fff',
        borderRadius: 15,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.23,
        shadowRadius: 2.62,

        elevation: 4
    },
    transaction__subtext: {
        fontFamily: 'SFUIDisplay-Regular',
        color: '#999999',
        fontSize: 12
    },
    transaction__content: {
        flex: 1,
        justifyContent: 'space-between',
        flexDirection: 'row'
    },
    transaction__expand: {
        fontFamily: 'SFUIDisplay-Semibold',
        color: '#e77ca3',
        fontSize: 16
    },
    transaction__income: {
        fontFamily: 'SFUIDisplay-Semibold',
        color: '#864dd9',
        fontSize: 16
    },
    transaction__bg: {
        alignItems: 'flex-end',
        position: 'absolute',
        top: 0,
        left: 15,
        width: SCREEN_WIDTH - 30,
        height: '100%',
        borderRadius: 15,
        //backgroundColor: '#fff',
        zIndex: 1
    },
    transaction__bg_active: {
        backgroundColor: '#e77ca3'
    },
    transaction__action: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 72,
        height: '100%'
    },
    transaction__action__text: {
        fontFamily: 'SFUIDisplay-Regular',
        color: '#ffffff',
        fontSize: 10
    },
    circle: {
        position: 'relative',
        width: 10,
        height: 10,
        marginLeft: 6,
        marginRight: 20,
        borderRadius: 10,
        zIndex: 2
    },
    line: {
        position: 'absolute',
        top: 30,
        left: 77,
        width: 2,
        height: 60,
        zIndex: 2
    },
    textAlign_right: {
        textAlign: 'right'
    }
}
