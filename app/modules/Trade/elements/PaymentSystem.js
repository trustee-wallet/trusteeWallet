import React, { Component } from 'react'
import { connect } from 'react-redux'
import { View, Text, TouchableOpacity, ScrollView } from 'react-native'

import MasterCard from '../../../assets/images/mastercard'
import Visa from '../../../assets/images/visa'
import QIWI from '../../../assets/images/QIWI'

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

    drop = () => {
        this.setState({
            paymentSystemList: []
        })
    }

    reInit = () => {
        try {
            const tradeApiConfig = JSON.parse(JSON.stringify(this.props.exchangeStore.tradeApiConfig))
            const { extendsFields } = this.props

            //TODO: write function to uniq by two fields

            let paymentSystemListTmp = tradeApiConfig.exchangeWays.filter(item => item[extendsFields.fieldForCryptocurrency] === 'BTC')
            let paymentSystemList = []

            for(const paymentSystem of paymentSystemListTmp){
                paymentSystemList.push({
                    provider: paymentSystem.provider,
                    currencyCode: paymentSystem[extendsFields.fieldForFiatCurrency],
                    paymentSystem: paymentSystem[extendsFields.fieldForPaywayCode],
                    providerFee: paymentSystem.providerFee,
                    limits: paymentSystem.limits
                })
            }

            paymentSystemList = paymentSystemList.map(item => {
                return {
                    ...item, available: false
                }
            })

            this.setState({
                paymentSystemList
            })
        } catch (e) {
            Log.err('PaymentSystem.reInit error ' + e.message)
        }
    }

    UNSAFE_componentWillMount() {
        this.reInit()
    }

    init = (nextProps) => {
        try {
            const tradeApiConfig = JSON.parse(JSON.stringify(this.props.exchangeStore.tradeApiConfig))
            const { selectedCryptocurrency, selectedFiatCurrency } = nextProps
            const { extendsFields, selectedPaymentSystem } = this.props

            let paymentSystemListTmp = tradeApiConfig.exchangeWays.filter(item => item[extendsFields.fieldForCryptocurrency] === selectedCryptocurrency.currencyCode)
            let paymentSystemList = []

            for(const paymentSystem of paymentSystemListTmp){
                paymentSystemList.push({
                    provider: paymentSystem.provider,
                    currencyCode: paymentSystem[extendsFields.fieldForFiatCurrency],
                    paymentSystem: paymentSystem[extendsFields.fieldForPaywayCode],
                    providerFee: paymentSystem.providerFee,
                    //TODO: exchangeStore.tradeType === 'SELL' ? paymentSystem.supportedCountries.indexOf(selectedFiatCurrency.r030.toString()) !== -1 : true,
                    available: paymentSystem.supportedCountries.indexOf(selectedFiatCurrency.r030.toString()) !== -1,
                    limits: paymentSystem.limits
                })
            }

            this.setState({
                paymentSystemList
            })

            let available = JSON.parse(JSON.stringify(paymentSystemList))
            available = available.filter(item => item.available === true)

            const isAvailable = available.filter(item => selectedPaymentSystem.provider === item.provider && selectedPaymentSystem.currencyCode === item.currencyCode && selectedPaymentSystem.paymentSystem === item.paymentSystem )

            if(!isAvailable.length && typeof selectedFiatCurrency.cc != 'undefined')
                this.handleSetSelectedPaymentSystem(available[0])
        } catch(e) {
            Log.err('PaymentSystem.init error', e)
        }
    }

    UNSAFE_componentWillReceiveProps(nextProps) {

        const { selectedCryptocurrency: sc2, selectedFiatCurrency: sfc2 } = nextProps

        if(typeof sc2 != 'undefined' && typeof sfc2.cc != 'undefined'){
            this.init(nextProps)
        }
    }

    handleSetSelectedPaymentSystem = (selectedPaymentSystem) => {


        // if(selectedPaymentSystem.paymentSystem === 'QIWI')
        //     this.props.refCards.disableCards()
        // else
        //     this.props.refCards.enableCards()

        if(selectedPaymentSystem.paymentSystem === 'VISA_MC_P2P' && selectedPaymentSystem.currencyCode === 'RUB' && selectedPaymentSystem.provider === '365cash'){
            this.props.refOptionalData.enable()
            this.props.refCards.enableCards().enableCardValidation()
        } else if(selectedPaymentSystem.paymentSystem === 'QIWI'){
            this.props.refCards.disableCards().disableCardValidation()
            this.props.refOptionalData.enable()
        } else {
            this.props.refOptionalData.disable()
            this.props.refCards.enableCards().disableCardValidation()
        }


        this.props.handleSetState('selectedPaymentSystem', {
            ...selectedPaymentSystem
        })
    }

    handlePaymentSystemInfo = (paymentSystem) => {
        try {
            const { selectedFiatCurrency, fiatRatesStore, settingsStore } = this.props

            let fiatRates = JSON.parse(JSON.stringify(fiatRatesStore.fiatRates))
            fiatRates = fiatRates.filter(item => item.cc === settingsStore.data.local_currency)

            showModal({
                type: 'PAYMENT_SYSTEM_INFO_MODAL',
                data: {
                    paymentSystem,
                    selectedFiatCurrency: typeof selectedFiatCurrency.cc == 'undefined' ? fiatRates[0] : selectedFiatCurrency
                }
            })
        } catch (e) {
            Log.err('PaymentSystem.handlePaymentSystemInfo error', e)
        }

    }

    renderPaymentSystem = (item, index) => {

        const { selectedPaymentSystem, extendsFields } = this.props

        const ifSelectStyle = typeof selectedPaymentSystem.currencyCode != 'undefined' && selectedPaymentSystem.currencyCode === item.currencyCode && selectedPaymentSystem.paymentSystem === item.paymentSystem

        return (
            <View style={{ position: 'relative' }} key={index}>
                <TouchableOpacity
                    disabled={!item.available || ifSelectStyle}
                    style={[styles.paymentSystem, ifSelectStyle ? styles.paymentSystem_active : null]}
                    onPress={() => this.handleSetSelectedPaymentSystem(item)}>
                        { this.renderPaymentSystemSelect(item, ifSelectStyle) }
                        <View style={styles.paymentSystem__bottom}>
                            <Text style={[styles.paymentSystem__text, ifSelectStyle ? styles.paymentSystem__text_active : null]}>{ strings('tradeScreen.fee') } { item.providerFee[extendsFields.fieldForWayId.toLowerCase()][0].amount } %</Text>
                        </View>
                        { !item.available ? <View style={styles.paymentSystem__block} /> : null }
                </TouchableOpacity>
                <TouchableOpacity style={styles.paymentSystem__wrap__icon} onPress={() => this.handlePaymentSystemInfo(item)}>
                    <Feather style={[styles.paymentSystem__icon, ifSelectStyle ? styles.paymentSystem__icon_active : null]} name={'info'} />
                </TouchableOpacity>
            </View>
        )
    }

    renderPaymentSystemSelect = (item, ifSelectStyle) => {

        let title = null
        let Icon = null

        switch(item.paymentSystem){
            case "VISA_MC_P2P":
            case "VISA_MC":
                title = strings(`tradeScreen.${item.currencyCode}`) + ' ' + strings('tradeScreen.only')
                Icon = () => <View style={styles.paymentSystem__medium}>
                                <Visa fill={ ifSelectStyle ? '#fff' : '#1A1F71'} />
                                <MasterCard />
                             </View>
                break
            case "VISA_MC_WW":
                title = strings('tradeScreen.worldwide')
                Icon = () => <View style={styles.paymentSystem__medium}>
                                <Visa fill={ ifSelectStyle ? '#fff' : '#1A1F71'} />
                                <MasterCard />
                             </View>
                break
            case "QIWI":
                title = strings('tradeScreen.QIWI')
                Icon = () => <View style={styles.paymentSystem__medium}>
                                <QIWI />
                            </View>
                break
            default:
                title = ''
                Icon = () => <View />
                break
        }

        return (
            <View>
                <View style={styles.paymentSystem__top}>
                    <Text style={[styles.paymentSystem__title, ifSelectStyle ? styles.paymentSystem__title_active : null]}>{ title }</Text>
                </View>
                <Icon />
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
