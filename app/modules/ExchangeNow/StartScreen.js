/**
 * @version todo
 * @misha to review
 */
import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Dimensions, View, Text, ScrollView, TouchableOpacity, Platform, Image } from 'react-native'
import Entypo from 'react-native-vector-icons/Entypo'
import AsyncStorage from '@react-native-community/async-storage'

import NavStore from '../../components/navigation/NavStore'
import Navigation from '../../components/navigation/Navigation'
import GradientView from '../../components/elements/GradientView'

import firebase from 'react-native-firebase'

import { strings, sublocale } from '../../services/i18n'
import Log from '../../services/Log/Log'
import { showModal } from '../../appstores/Stores/Modal/ModalActions'


const { height: WINDOW_HEIGHT } = Dimensions.get('window')

class MainDataScreen extends Component {

    constructor() {
        super()
        this.state = {
            source: `https://changenow.io/${sublocale()}/exchange?amount=1&from=btc&link_id=35bd08f188a35c&to=eth`,

            orders: []
        }

        this.exchangeId = null

    }

    // eslint-disable-next-line react/no-deprecated,camelcase
    async UNSAFE_componentWillMount() {

        const param = this.props.navigation.getParam('exchangeMainDataScreenParam')

        if (typeof param !== 'undefined') {
            NavStore.goNext('MainDataScreen',
                {
                    exchangeMainDataScreenParam: {
                        url: param.url,
                        type: 'CREATE_NEW_ORDER'
                    }
                })
        }

        try {
            let res = await AsyncStorage.getItem('EXCHANGE_ORDERS')

            if (res !== null) {
                res = JSON.parse(res)
                res = res.reverse()

                this.setState({ orders: res })
            }
            Log.log('Exchange.StartScreen.UNSAFE_componentWillMount res ' + res)
        } catch (e) {
            Log.err('Exchange.StartScreen.UNSAFE_componentWillMount error ' + e.message)
        }

        this._onFocusListener = this.props.navigation.addListener('didFocus', async (payload) => {
            try {
                let res = await AsyncStorage.getItem('EXCHANGE_ORDERS')

                if (res !== null) {

                    res = JSON.parse(res)
                    res = res.reverse()

                    this.setState({ orders: res })
                }

                Log.log('Exchange.StartScreen.UNSAFE_componentWillMount didFocus res ' + res)
            } catch (e) {
                Log.err('Exchange.StartScreen.UNSAFE_componentWillMount didFocus error ' + e.message)
            }
        })
    }

    handleOpenLinkLongPress = async () => {
        const res = await AsyncStorage.getItem('EXCHANGE_ORDERS')
        showModal({
            type: 'INFO_MODAL',
            icon: 'INFO',
            title: 'SYSTEM_LOG',
            description: 'DATA: ' + res
        })
    }

    createNewOrder = () => {
        NavStore.goNext('MainDataScreen',
            {
                exchangeMainDataScreenParam: {
                    url: `https://changenow.io/${sublocale()}/exchange?amount=1&from=btc&link_id=35bd08f188a35c&to=eth`,
                    type: 'CREATE_NEW_ORDER'
                }
            })
    }

    selectOrder = (item) => {
        NavStore.goNext('MainDataScreen',
            {
                exchangeMainDataScreenParam: {
                    url: `https://changenow.io/${sublocale()}/exchange/txs/${item.id}`,
                    type: 'VIEW_ORDER'
                }
            })
    }

    render() {

        const { exchangeStore } = this.props
        const { orders } = this.state

        firebase.analytics().setCurrentScreen('Exchange.StartScreen.' + exchangeStore.tradeType)

        return (
            <View style={styles.wrapper}>
                <Navigation
                    title={strings('exchangeScreen.title')}
                    navigation={this.props.navigation}
                />
                <View style={styles.wrapper__content}>
                    <ScrollView>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <TouchableOpacity style={styles.title} onLongPress={() => this.handleOpenLinkLongPress()} delayLongPress={5000}>
                                <Text>
                                    {strings('exchangeInit.ordersHistory')}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.addAsset} onPress={() => this.createNewOrder()}>
                                <View style={styles.addAsset__content}>
                                    <Entypo style={styles.addAsset__icon} size={13} name="plus"/>
                                    <Text style={styles.addAsset__text}>
                                        {strings('exchangeScreen.title')}
                                    </Text>
                                    <Image
                                        style={[styles.img__hor, styles.img__hor_right]}
                                        resizeMode={'stretch'}
                                        source={styles.img__paths.right}
                                    />
                                    <Image
                                        style={[styles.img__hor, styles.img__hor_left]}
                                        resizeMode={'stretch'}
                                        source={styles.img__paths.left}
                                    />
                                    <Image
                                        style={[styles.img__ver]}
                                        resizeMode={'stretch'}
                                        source={styles.img__paths.line}
                                    />
                                </View>
                            </TouchableOpacity>
                        </View>
                        {
                            orders.length ? orders.map((item, index) => {

                                return (
                                    <View style={styles.container} key={index}>
                                        <View style={{ position: 'relative' }}>
                                            <View style={{
                                                position: 'relative',

                                                marginBottom: 15,
                                                marginTop: 5,
                                                marginLeft: 16,
                                                marginRight: 16,
                                                backgroundColor: '#fff',
                                                borderRadius: 16,

                                                zIndex: 2
                                            }}>
                                                <TouchableOpacity style={styles.cryptoList__item} onPress={() => this.selectOrder(item)}>
                                                    <GradientView
                                                        style={styles.cryptoList__item__content}
                                                        array={styles_.cryptoList__item.array}
                                                        start={styles_.cryptoList__item.start}
                                                        end={styles_.cryptoList__item.end}>

                                                        <View style={styles.cryptoList__info}>
                                                            <Text style={styles.cryptoList__title}>
                                                                {strings('exchangeScreen.title')} {item.fromCurrency.toUpperCase()} {strings('exchange.to')} {item.toCurrency.toUpperCase()}
                                                            </Text>
                                                            <Text style={styles.cryptoList__text}>
                                                                {strings('exchangeScreen.payinAddress')}: {item.payinAddress.slice(0, 4) + '...' + item.payinAddress.slice(item.payinAddress.length - 4, item.payinAddress.length)} | {item.expectedSendAmount} {item.fromCurrency.toUpperCase()}
                                                            </Text>
                                                            <Text style={styles.cryptoList__text}>
                                                                {strings('exchangeScreen.payoutAddress')}: {item.payoutAddress.slice(0, 4) + '...' + item.payoutAddress.slice(item.payoutAddress.length - 4, item.payoutAddress.length)} | {item.expectedReceiveAmount} {item.toCurrency.toUpperCase()}
                                                            </Text>
                                                            <Text style={styles.cryptoList__text}>
                                                                {strings('exchangeScreen.date')} {new Date(item.createdAt).toLocaleTimeString() + ' ' + new Date(item.createdAt).toLocaleDateString()}
                                                            </Text>
                                                        </View>
                                                    </GradientView>
                                                </TouchableOpacity>
                                            </View>
                                            <View style={styles.shadow}>
                                                <View style={styles.shadow__item}/>
                                            </View>
                                        </View>
                                    </View>
                                )
                            }) : <Text style={{ marginLeft: 30 }}>{strings('exchangeInit.ordersNull')}</Text>
                        }
                    </ScrollView>
                </View>
            </View>
        )
    }
}

const styles_ = {
    cryptoList__icoWrap_bitcoin: {
        array: ['#e67947', '#f9f871'],
        start: { x: 0.0, y: 0.5 },
        end: { x: 1, y: 0.5 }
    },
    cryptoList__icoWrap_eth: {
        array: ['#145de3', '#4ec8f7'],
        start: { x: 0.0, y: 0.5 },
        end: { x: 1, y: 0.5 }
    },
    cryptoList__icoWrap_omni: {
        array: ['#3ac058', '#27e3ae']
    },
    cryptoList__ico: {
        color: '#FBFFFF',
        size: 24
    },
    cryptoList__item: {
        array: ['#fff', '#f4f4f4'],
        start: { x: 1, y: 0 },
        end: { x: 1, y: 1 }
    },
    bg: {
        array: ['#fff', '#F8FCFF'],
        start: { x: 0.0, y: 0.5 },
        end: { x: 0, y: 1 }
    }
}

const mapStateToProps = (state) => {
    return {
        exchangeStore: state.exchangeStore
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        dispatch
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(MainDataScreen)

const styles = {
    wrapper: {
        flex: 1,
        height: WINDOW_HEIGHT,
        backgroundColor: '#f4f4f4'
    },
    wrapper__content: {
        flex: 1,

        position: 'relative',

        marginTop: 80,
        backgroundColor: '#f4f4f4'
    },
    top: {
        flexDirection: 'row',
        justifyContent: 'space-between',

        width: '100%',
        paddingHorizontal: 15
    },
    title: {
        marginVertical: 20,
        marginBottom: 15,

        marginLeft: 31,
        fontFamily: 'Montserrat-Bold',
        color: '#404040',
        fontSize: 14
    },
    newOrder: {
        alignItems: 'center',
        justifyContent: 'center',

        height: 50,
        marginVertical: 20,

        borderRadius: 10,

        borderColor: '#404040',
        borderStyle: 'dashed',
        borderWidth: 1
    },
    cryptoList__item: {

        justifyContent: 'center',
        height: 80,
        borderRadius: 16,
        shadowColor: '#000'
    },
    cryptoList__item__bg: {
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,

        backgroundColor: '#fff'
    },
    cryptoList__item__content: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',

        paddingLeft: 15,

        borderRadius: 16
    },
    cryptoList__title: {
        marginVertical: 5,

        color: '#404040',
        fontFamily: 'Montserrat-SemiBold',
        fontSize: 14
    },
    cryptoList__text: {
        color: '#999999',
        fontSize: 12,
        fontFamily: 'SFUIDisplay-Regular'
    },
    cryptoList__info: {
        flex: 1
    },
    cryptoList__icoWrap: {
        width: 42,
        height: 42,
        marginRight: 15,
        elevation: 0,
        shadowColor: '#fff'
    },
    cryptoList__icon: {
        fontSize: 20
    },
    cryptoList__icon__mark: {
        bottom: 5
    },
    cryptoList__icon__mark__text: {
        fontSize: 5
    },
    shadow: {
        position: 'absolute',
        top: 0,
        left: 0,

        width: '100%',
        height: '100%',

        zIndex: 1
    },
    shadow__item: {

        marginHorizontal: 20,
        marginTop: 32,
        height: Platform.OS === 'ios' ? 50 : 52,

        backgroundColor: '#fff',

        borderRadius: 16,

        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 5
        },
        shadowOpacity: 0.34,
        shadowRadius: 6.27,

        elevation: 10
    },
    img__paths: {
        left: require('../../assets/images/addAssetborderShadowLeft.png'),
        right: require('../../assets/images/addAssetborderShadowRight.png'),
        line: require('../../assets/images/addAssetborderShadowLines.png')
    },
    img__ver: {
        flex: 1,

        position: 'absolute',
        top: -6,
        left: 5,

        width: '103%',
        height: 39,

        opacity: .5,

        zIndex: 2
    },
    img__hor: {
        flex: 1,

        position: 'absolute',
        top: -6,

        width: 10,
        height: 39,

        opacity: .5,

        zIndex: 2
    },
    img__hor_right: {
        right: -5
    },
    img__hor_left: {
        left: -5
    },
    addAsset: {
        paddingVertical: 19,
        paddingHorizontal: 15
    },
    addAsset__content: {
        position: 'relative',

        flexDirection: 'row',
        alignItems: 'center',

        height: 30,

        paddingHorizontal: 8,
        paddingVertical: 5,
        paddingLeft: 4,

        borderRadius: 6,
        borderColor: '#864DD9',
        borderWidth: 1.5
    },
    addAsset__text: {
        fontSize: 10,
        color: '#864DD9',
        fontFamily: 'Montserrat-Bold'
    },
    addAsset__icon: {
        marginRight: 2,
        marginTop: 1,

        color: '#864DD9'
    }
}
