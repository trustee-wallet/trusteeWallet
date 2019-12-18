import React, { Component } from 'react'
import { connect } from 'react-redux'
import { View, Text, TouchableOpacity, ScrollView } from 'react-native'

import Changelly from '../../../assets/images/changelly'

import Feather from 'react-native-vector-icons/Feather'
import { strings } from '../../../services/i18n'

import _ from 'lodash'
import { showModal } from '../../../appstores/Actions/ModalActions'
import Log from '../../../services/Log/Log'


class PaymentSystem extends Component {

    constructor(props) {
        super(props)
        this.state = {
            paymentSystemList: []
        }
    }

    init = () => {
        try {
            const exchangeApiConfig = JSON.parse(JSON.stringify(this.props.exchangeStore.exchangeApiConfig))
            const { extendsFields } = this.props


            let paymentSystemListTmp = _.uniqBy(exchangeApiConfig, 'provider')
            let paymentSystemList = []


            for(const paymentSystem of paymentSystemListTmp){
                paymentSystemList.push({
                    paymentSystem: paymentSystem.provider,
                    inCryptocurrency: paymentSystem[extendsFields.inCryptocurrency],
                    outCryptocurrency: paymentSystem[extendsFields.outCryptocurrency],
                    providerFee: paymentSystem.providerFee,
                    available: false,
                    limits: paymentSystem.limits
                })
            }

            this.setState({
                paymentSystemList
            })

        } catch (e) {
            Log.err('PaymentSystem.init error', e)
        }
    }

    componentWillMount() {
        this.init()
    }

    reInit = (nextProps) => {
        try {
            const tradeApiConfig = JSON.parse(JSON.stringify(this.props.exchangeStore.exchangeApiConfig))
            const { selectedInCryptocurrency, selectedOutCryptocurrency } = nextProps
            const { extendsFields } = this.props


            let paymentSystemListTmp = tradeApiConfig.filter(item => item[extendsFields.inCryptocurrency] === selectedInCryptocurrency.currencyCode && item[extendsFields.outCryptocurrency] === selectedOutCryptocurrency.currencyCode)

            let paymentSystemList = []

            for(const paymentSystem of paymentSystemListTmp){
                paymentSystemList.push({
                    paymentSystem: paymentSystem.provider,
                    inCryptocurrency: paymentSystem[extendsFields.inCryptocurrency],
                    outCryptocurrency: paymentSystem[extendsFields.outCryptocurrency],
                    providerFee: paymentSystem.providerFee,
                    available: true,
                    limits: paymentSystem.limits
                })
            }

            this.setState({
                paymentSystemList
            })

            let isOneAvailable = JSON.parse(JSON.stringify(paymentSystemList))
            isOneAvailable = isOneAvailable.filter(item => item.available === true)

            if(isOneAvailable.length === 1 && typeof selectedOutCryptocurrency.currencyCode != 'undefined' && selectedOutCryptocurrency.currencyCode !== this.props.selectedOutCryptocurrency.currencyCode)
                this.handleSetSelectedPaymentSystem(isOneAvailable[0])
        } catch(e) {
            Log.err('PaymentSystem.init error', e)
        }
    }

    componentWillReceiveProps(nextProps) {

        const { selectedInCryptocurrency: sc1, selectedOutCryptocurrency: sc2 } = nextProps

        if(typeof sc1.currencyCode != 'undefined' && typeof sc2.currencyCode != 'undefined'){
            this.reInit(nextProps)
        }
    }

    handleSetSelectedPaymentSystem = (selectedPaymentSystem) => {

        this.props.handleSetState('selectedPaymentSystem', {
            ...selectedPaymentSystem
        })
    }

    handlePaymentSystemInfo = (paymentSystem) => {
        try {
            const { selectedInCryptocurrency } = this.props

            showModal({
                type: 'EXCHANGE_PROVIDER_INFO_MODAL',
                data: {
                    paymentSystem,
                    selectedInCryptocurrency
                }
            })
        } catch (e) {
            Log.err('PaymentSystem.handlePaymentSystemInfo error', e)
        }

    }

    renderPaymentSystem = (item, index) => {

        const { selectedPaymentSystem, extendsFields } = this.props

        const ifSelectStyle = typeof selectedPaymentSystem.inCryptocurrency != 'undefined' && selectedPaymentSystem.paymentSystem === item.paymentSystem
        // const title = item.paymentSystem === 'VISA_MC_P2P' ? strings(`tradeScreen.${item.currencyCode}`) + ' ' + strings('tradeScreen.only') : strings('tradeScreen.worldwide')

        const fee = item.providerFee['out'].find(item => item.type === 'percent')

        console.log(ifSelectStyle)
        console.log(item)

        return (
            <View style={{ position: 'relative' }} key={index}>
                <TouchableOpacity
                    disabled={!item.available || ifSelectStyle}
                    style={[styles.paymentSystem, ifSelectStyle ? styles.paymentSystem_active : null]}
                    onPress={() => this.handleSetSelectedPaymentSystem(item)}>
                        <View style={styles.paymentSystem__top}>
                            <Text style={[styles.paymentSystem__title, ifSelectStyle ? styles.paymentSystem__title_active : null]}>{ item.paymentSystem.charAt(0).toUpperCase() + item.paymentSystem.slice(1) }</Text>
                        </View>
                        <View style={styles.paymentSystem__medium}>
                            <Changelly />
                        </View>
                        <View style={styles.paymentSystem__bottom}>
                            <Text style={[styles.paymentSystem__text, ifSelectStyle ? styles.paymentSystem__text_active : null]}>{ strings('exchangeScreen.fee') } { fee.amount } %</Text>
                        </View>
                        { !item.available ? <View style={styles.paymentSystem__block} /> : null }
                </TouchableOpacity>
                <TouchableOpacity style={styles.paymentSystem__wrap__icon} onPress={() => this.handlePaymentSystemInfo(item)}>
                    <Feather style={[styles.paymentSystem__icon, ifSelectStyle ? styles.paymentSystem__icon_active : null]} name={'info'} />
                </TouchableOpacity>
            </View>
        )
    }


    render() {

        const { paymentSystemList } = this.state

        return (
            <ScrollView horizontal={true}
                        showsHorizontalScrollIndicator={false}>
                { paymentSystemList.map((item, index) => this.renderPaymentSystem(item, index)) }
            </ScrollView>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        settingsStore: state.settingsStore,
        fiatRatesStore: state.fiatRatesStore,
        exchangeStore: state.exchangeStore
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        dispatch
    }
}

export default connect(mapStateToProps, mapDispatchToProps, null, { forwardRef: true })(PaymentSystem)

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
        height: 98,
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

        marginTop: 15
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

        paddingRight: 20,
        marginTop: 10
    },
    paymentSystem__bottom: {
        marginTop: 8
    }
}