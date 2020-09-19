/**
 * @version 0.11
 */
import React, { Component } from 'react'
import { connect } from 'react-redux'
import { View, Text, TouchableOpacity, ScrollView } from 'react-native'

import Feather from 'react-native-vector-icons/Feather'
import Changelly from '../../../assets/images/changelly'

import { strings } from '../../../services/i18n'

import { showModal } from '../../../appstores/Stores/Modal/ModalActions'
import Log from '../../../services/Log/Log'


let CACHE_INIT_KEY = ''

class ExchangePaymentSystem extends Component {

    constructor(props) {
        super(props)
        this.state = {
            paymentSystemList: []
        }
    }

    drop = () => {
        Log.log('EXC/PaymentSystem.drop')
        this.setState({
            paymentSystemList: []
        })
    }

    init = (nextProps) => {
        const { selectedInCurrency, selectedOutCurrency } = nextProps
        if (typeof selectedInCurrency === 'undefined' || typeof selectedOutCurrency === 'undefined'
            || typeof selectedInCurrency.currencyCode === 'undefined'
            || typeof selectedOutCurrency.currencyCode === 'undefined'
        ) {
            return ;
        }
        const key =  selectedInCurrency.currencyCode + '_' +  selectedOutCurrency.currencyCode
        if (CACHE_INIT_KEY === key && this.state.paymentSystemList.length > 0) {
            return ;
        }
        CACHE_INIT_KEY = key

        try {
            const tradeApiConfig = this.props.exchangeStore.exchangeApiConfig
            const { extendsFields } = this.props

            if (typeof extendsFields === 'undefined' || typeof extendsFields.fieldForInCurrency === 'undefined') {
                return ;
            }

            const paymentSystemList = []

            let item
            for (item of tradeApiConfig) {
                if (typeof item === 'undefined' || !item) {
                    continue
                }
                if (item[extendsFields.fieldForInCurrency] !== selectedInCurrency.currencyCode) {
                    continue
                }
                if (item[extendsFields.fieldForOutCurrency] !== selectedOutCurrency.currencyCode) {
                    continue
                }
                paymentSystemList.push({
                    provider: item.provider,
                    currencyCode: item[extendsFields.fieldForOutCurrency],
                    paymentSystem: item[extendsFields.fieldForPaywayCode],
                    providerFee: item.providerFee,
                    available: 1,
                    limits: item.limits
                })
            }

            this.setState({
                paymentSystemList
            })
            if (paymentSystemList && paymentSystemList.length === 1) {
                const available = paymentSystemList[0]
                if (typeof available !== 'undefined') {
                    this.handleSetSelectedPaymentSystem(available)
                }
            }
        } catch (e) {
            Log.err('EXC/PaymentSystem.init error ' + e.message)
        }
    }

    // eslint-disable-next-line camelcase
    UNSAFE_componentWillReceiveProps(nextProps) {
        this.init(nextProps)
    }

    handleSetSelectedPaymentSystem = (selectedPaymentSystem) => {
        this.props.handleSetState('selectedPaymentSystem', {
            ...selectedPaymentSystem
        })
    }

    handlePaymentSystemInfo = (paymentSystem) => {
        try {
            const { selectedInCurrency } = this.props
            Log.log('handlePaymentSystemInfo', paymentSystem, selectedInCurrency)

            showModal({
                type: 'EXCHANGE_PROVIDER_INFO_MODAL',
                data: {
                    paymentSystem,
                    selectedInCurrency: selectedInCurrency
                }
            })
        } catch (e) {
            Log.err('EXC/PaymentSystem.handlePaymentSystemInfo error', e)
        }

    }

    renderPaymentSystem = (item, index) => {
        const { selectedPaymentSystem } = this.props
        const ifSelectStyle = typeof selectedPaymentSystem.currencyCode !== 'undefined' && selectedPaymentSystem.currencyCode === item.currencyCode
        const fee = item.providerFee['out'].find(item => item.type === 'percent')
        return (
            <View style={{ position: 'relative' }} key={index}>
                <TouchableOpacity
                    disabled={!item.available || ifSelectStyle}
                    style={[styles.paymentSystem, ifSelectStyle ? styles.paymentSystem_active : null]}
                    onPress={() => this.handleSetSelectedPaymentSystem(item)}>
                    {this.renderPaymentSystemSelect(item, ifSelectStyle)}
                    <View style={styles.paymentSystem__bottom}>
                        <Text style={[styles.paymentSystem__text, ifSelectStyle ? styles.paymentSystem__text_active : null]}>{strings('exchangeScreen.fee')} {fee.amount} %</Text>
                    </View>
                    {!item.available ? <View style={styles.paymentSystem__block}/> : null}
                </TouchableOpacity>
                <TouchableOpacity style={styles.paymentSystem__wrap__icon} onPress={() => this.handlePaymentSystemInfo(item)}>
                    <Feather style={[styles.paymentSystem__icon, ifSelectStyle ? styles.paymentSystem__icon_active : null]} name={'info'}/>
                </TouchableOpacity>
            </View>
        )
    }

    renderPaymentSystemSelect = (item, ifSelectStyle) => {
        let title = null
        let Icon = null

        switch (item.provider) {
            case 'changelly':
                title = item.provider.charAt(0).toUpperCase() + item.provider.slice(1)
                Icon = () => <View style={styles.paymentSystem__medium}>
                    <Changelly ifSelectStyle={ifSelectStyle}/>
                </View>
                break
            default:
                title = ''
                Icon = () => <View/>
                break
        }

        return (
            <View style={{ flex: 1 }}>
                <View style={styles.paymentSystem__top}>
                    <Text style={[styles.paymentSystem__title, ifSelectStyle ? styles.paymentSystem__title_active : null]}>{title}</Text>
                </View>
                <View style={{ flex: 1, justifyContent: 'center' }}>
                    <Icon/>
                </View>
            </View>
        )
    }


    render() {
        const { paymentSystemList } = this.state
        return (
            <ScrollView horizontal={true}
                        showsHorizontalScrollIndicator={false}>
                {paymentSystemList.map((item, index) => this.renderPaymentSystem(item, index))}
            </ScrollView>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        settingsStore: state.settingsStore,
        exchangeStore: state.exchangeStore
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        dispatch
    }
}

export default connect(mapStateToProps, mapDispatchToProps, null, { forwardRef: true })(ExchangePaymentSystem)

const styles = {
    btn: {
        padding: 20,
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1
        },
        shadowOpacity: 0.22,
        shadowRadius: 2.22,

        elevation: 3
    },
    paymentSystem: {
        position: 'relative',

        width: 138,
        height: 110,
        paddingLeft: 15,
        marginLeft: 15,

        backgroundColor: '#F9F2FF',
        borderRadius: 10
    },
    paymentSystem_active: {
        backgroundColor: '#A168F2'
    },
    paymentSystem__block: {
        alignItems: 'center',
        justifyContent: 'center',

        position: 'absolute',
        top: 0,
        left: 0,
        width: 138,
        height: '100%',
        backgroundColor: '#fff',
        borderRadius: 10,
        opacity: 0.6,
        zIndex: 2
    },
    paymentSystem__top: {
        flexDirection: 'row',
        justifyContent: 'space-between',

        marginTop: 15,
        marginBottom: 'auto'
    },
    paymentSystem__wrap__icon: {
        position: 'absolute',
        top: 0,
        right: 0,

        padding: 10,

        zIndex: 2
    },
    paymentSystem__icon: {
        color: '#7127AC',
        fontSize: 20
    },
    paymentSystem__icon_active: {
        color: '#fff'
    },
    paymentSystem__title: {
        marginTop: 3,

        fontSize: 12,
        fontFamily: 'SFUIDisplay-Semibold',
        color: '#7127AC'
    },
    paymentSystem__title_active: {
        color: '#fff'
    },
    paymentSystem__text: {
        fontSize: 10,
        fontFamily: 'SFUIDisplay-Regular',
        color: '#B38BF0'
    },
    paymentSystem__text_active: {
        color: '#F3E6FF'
    },
    paymentSystem__medium: {

        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',

        paddingRight: 10
    },
    paymentSystem__bottom: {
        marginTop: 'auto',
        marginBottom: 8
    }
}
