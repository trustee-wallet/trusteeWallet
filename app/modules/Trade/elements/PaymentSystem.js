/**
 * @version todo
 */
import React, { Component } from 'react'
import AsyncStorage from '@react-native-community/async-storage'
import { connect } from 'react-redux'
import { View, Text, TouchableOpacity, ScrollView } from 'react-native'

import MasterCard from '../../../assets/images/mastercard'
import Visa from '../../../assets/images/visa'
import QIWI from '../../../assets/images/QIWI'
import ADVCASH from '../../../assets/images/ADVCASH'
import PAYEER from '../../../assets/images/PAYEER'
import PerfectMoney from '../../../assets/images/PerfectMoney'

import Lifecell from '../../../assets/images/lifecell'
import KievStar from '../../../assets/images/kievstar'
import Vodafone from '../../../assets/images/vodafone'

import Feather from 'react-native-vector-icons/Feather'
import { strings, sublocale } from '../../../services/i18n'

import { showModal } from '../../../appstores/Stores/Modal/ModalActions'
import Log from '../../../services/Log/Log'
import TmpConstants from './TmpConstants'
import BlocksoftExternalSettings from '../../../../crypto/common/BlocksoftExternalSettings'

let CACHE_PAUSE_PROPS = false
let CACHE_SELECTED_PAYMENT = false
let CACHE_SEND_TO_PARENT = false

class PaymentSystem extends Component {

    constructor(props) {
        super(props)
        this.state = {
            paymentSystemList: []
        }
        this.scrollViewRef = React.createRef()
        CACHE_PAUSE_PROPS = false
        CACHE_SEND_TO_PARENT = false
    }

    drop = () => {
        this.setState({
            paymentSystemList: []
        })
        CACHE_PAUSE_PROPS = false
        CACHE_SEND_TO_PARENT = false
    }

    reInit = () => {
        try {
            const tradeApiConfig = this.props.exchangeStore.tradeApiConfig
            const { extendsFields } = this.props


            const paymentSystemList = []
            const selectedCache = TmpConstants.CACHE_SELECTED_PREV_CRYPTO ? TmpConstants.CACHE_SELECTED_PREV_CRYPTO.key : 'BTC'
            for (const paymentSystem of tradeApiConfig.exchangeWays) {
                if (paymentSystem[extendsFields.fieldForCryptocurrency] !== selectedCache) continue
                paymentSystemList.push({
                    provider: paymentSystem.provider,
                    currencyCode: paymentSystem[extendsFields.fieldForFiatCurrency],
                    paymentSystem: paymentSystem[extendsFields.fieldForPaywayCode],
                    providerFee: paymentSystem.providerFee,
                    limits: paymentSystem.limits,
                    available: false,
                    supportedCountries: paymentSystem.supportedCountries || false,
                    paymentTitleSuffix: paymentSystem.paymentTitleSuffix || false,
                    hasDouble: paymentSystem.hasDouble || false,
                    id: paymentSystem.id
                })
            }

            if (paymentSystemList.length < 2) {
                if (typeof this.scrollViewRef !== 'undefined' && typeof this.scrollViewRef.current !== 'undefined' && this.scrollViewRef.current !== null) {
                    this.scrollViewRef.current.scrollTo({
                        x: 0,
                        y: 0
                    })
                }
            }

            this.setState({
                paymentSystemList
            })
        } catch (e) {
            Log.err('TRADE/PaymentSystem.reInit error ' + e.message)
        }
    }

    UNSAFE_componentWillMount() {
        this.reInit()
    }

    init = (nextProps) => {
        try {
            const tradeApiConfig = this.props.exchangeStore.tradeApiConfig
            const { selectedCryptocurrency, selectedFiatCurrency } = nextProps
            const { extendsFields, selectedPaymentSystem } = this.props

            const paymentSystemList = []
            const otherPaymentSystemList = []
            const available = []
            let isAvailable = false
            for (const paymentSystem of tradeApiConfig.exchangeWays) {
                if (paymentSystem[extendsFields.fieldForCryptocurrency] !== selectedCryptocurrency.currencyCode) {
                    continue
                }
                const item = {
                    provider: paymentSystem.provider,
                    currencyCode: paymentSystem[extendsFields.fieldForFiatCurrency],
                    paymentSystem: paymentSystem[extendsFields.fieldForPaywayCode],
                    providerFee: paymentSystem.providerFee,
                    available: true,
                    limits: paymentSystem.limits,
                    supportedCountries: paymentSystem.supportedCountries || false,
                    paymentTitleSuffix: paymentSystem.paymentTitleSuffix || false,
                    hasDouble: paymentSystem.hasDouble || false,
                    id: paymentSystem.id
                }
                if (selectedFiatCurrency && typeof selectedFiatCurrency !== 'undefined' && typeof selectedFiatCurrency.iso !== 'undefined') {
                    if (typeof paymentSystem.supportedByCurrency === 'undefined' && paymentSystem.supportedCountries) {
                        item.available = paymentSystem.supportedCountries.indexOf(selectedFiatCurrency.iso ? selectedFiatCurrency.iso.toString() : '') !== -1
                    } else {
                        if (paymentSystem.inCurrencyCode === selectedFiatCurrency.cc || paymentSystem.outCurrencyCode === selectedFiatCurrency.cc) {
                            item.available = true
                        } else {
                            item.available = false
                        }
                    }
                } else {
                    item.available = true
                }
                if (item.available) {
                    paymentSystemList.push(item)
                } else {
                    otherPaymentSystemList.push(item)
                }
                if (item.available === true && !isAvailable) {
                    available.push(item)
                    if (selectedPaymentSystem.provider === item.provider && selectedPaymentSystem.currencyCode === item.currencyCode && selectedPaymentSystem.paymentSystem === item.paymentSystem) {
                        isAvailable = true
                    }
                }
            }

            if (otherPaymentSystemList.length > 0) {
                for (const item of otherPaymentSystemList) {
                    paymentSystemList.push(item)
                }
            }


            if (paymentSystemList.length < 2) {
                if (typeof this.scrollViewRef !== 'undefined' && typeof this.scrollViewRef.current !== 'undefined') {
                    this.scrollViewRef.current.scrollTo({
                        x: 0,
                        y: 0
                    })
                }
            }

            this.setState({
                paymentSystemList
            })

            if (!isAvailable && typeof selectedFiatCurrency.cc !== 'undefined' && available.length > 0) {
                let found = available[0]
                let source = 'init.found'
                if (!TmpConstants.CACHE_SELECTED_PREV_ID && this.props.exchangeStore.tradePrevID) {
                    let item
                    for (item of available) {
                        if (item.id.toString() === this.props.exchangeStore.tradePrevID.toString()) {
                            found = item
                            source = 'FromHistory'
                        }
                    }
                    TmpConstants.CACHE_SELECTED_PREV_ID = this.props.exchangeStore.tradePrevID
                } else if (found.paymentSystem === 'QIWI' && available.length > 1) {
                    found = available[1]
                }
                this.handleSetSelectedPaymentSystem(found, true, source)
            } else if (isAvailable) {
                this.handleSetSelectedPaymentSystem(selectedPaymentSystem, true, 'init.isAvailable')
            }
        } catch (e) {
            Log.err('TRADE/PaymentSystem.init error ' + e.message)
        }
    }

    UNSAFE_componentWillReceiveProps(nextProps) {

        const { selectedCryptocurrency: sc2, selectedFiatCurrency: sfc2 } = nextProps

        if (typeof sc2 !== 'undefined' && typeof sfc2.cc !== 'undefined') {
            // console.log('sc2', sc2.currencyCode + ' ' + sfc2.cc, CACHE_PAUSE_PROPS)
            if (!CACHE_PAUSE_PROPS) {
                this.init(nextProps)
            }
        }
    }

    handleSetSelectedPaymentSystem = (selectedPaymentSystem, onlyInit = false, source = '') => {


        // if(selectedPaymentSystem.paymentSystem === 'QIWI')
        //     this.props.refCards.disableCards()
        // else
        //     this.props.refCards.enableCards()

        // console.log('handle select ' + source, selectedPaymentSystem.currencyCode + ' ' + selectedPaymentSystem.paymentSystem, onlyInit)
        CACHE_PAUSE_PROPS = true
        CACHE_SELECTED_PAYMENT = selectedPaymentSystem


        this.handleSelectors(selectedPaymentSystem)

        if (onlyInit) {
            CACHE_PAUSE_PROPS = false
            return true
        }

        if (selectedPaymentSystem.id) {
            TmpConstants.CACHE_SELECTED_PREV_ID = selectedPaymentSystem.id
            AsyncStorage.setItem('trade.selectedPaymentSystem.id', selectedPaymentSystem.id.toString())
        }

        this.props.handleSetState('selectedPaymentSystem', {
            ...selectedPaymentSystem
        }, () => {
            CACHE_PAUSE_PROPS = false
        })
    }

    handleSelectors = (selectedPaymentSystem) => {
        if (selectedPaymentSystem.paymentSystem === 'VISA_MC_P2P' && selectedPaymentSystem.currencyCode === 'RUB' && selectedPaymentSystem.provider === '365cash') {
            if (typeof this.props.refCards !== 'undefined' && this.props.refCards) {
                this.props.refCards.enableCards(selectedPaymentSystem).enableCardValidation()
            }
            if (typeof this.props.refOptionalData !== 'undefined' && this.props.refOptionalData) {
                this.props.refOptionalData.enable(selectedPaymentSystem)
            }
        } else if (selectedPaymentSystem.paymentSystem === 'QIWI') {
            if (typeof this.props.refCards !== 'undefined' && this.props.refCards) {
                this.props.refCards.disableCards().disableCardValidation()
            }
            if (typeof this.props.refOptionalData !== 'undefined' && this.props.refOptionalData) {
                this.props.refOptionalData.enable(selectedPaymentSystem)
            }
        } else if (selectedPaymentSystem.paymentSystem === 'ADVCASH' || selectedPaymentSystem.paymentSystem === 'PAYEER' || selectedPaymentSystem.paymentSystem === 'PERFECT_MONEY') {
            if (typeof this.props.refCards !== 'undefined' && this.props.refCards) {
                this.props.refCards.disableCards().disableCardValidation()
            }
            if (typeof this.props.refOptionalData !== 'undefined' && this.props.refOptionalData) {
                this.props.refOptionalData.enable(selectedPaymentSystem)
            }
        } else if (selectedPaymentSystem.paymentSystem === 'MOBILE_PHONE') {
            if (typeof this.props.refOptionalData !== 'undefined' && this.props.refOptionalData) {
                this.props.refOptionalData.enable(selectedPaymentSystem)
            }
            if (typeof this.props.refCards !== 'undefined' && this.props.refCards !== 'null') {
                this.props.refCards.disableCards().disableCardValidation()
            }
        } else {
            if (typeof this.props.refOptionalData !== 'undefined' && this.props.refOptionalData) {
                this.props.refOptionalData.disable()
            }
            if (typeof this.props.refCards !== 'undefined' && this.props.refCards) {
                this.props.refCards.enableCards(selectedPaymentSystem).disableCardValidation()
            }
        }
    }

    handlePaymentSystemInfo = (paymentSystem) => {
        try {
            const { selectedFiatCurrency } = this.props

            showModal({
                type: 'PAYMENT_SYSTEM_INFO_MODAL',
                data: {
                    paymentSystem,
                    selectedFiatCurrency: selectedFiatCurrency
                }
            })
        } catch (e) {
            Log.err('PaymentSystem.handlePaymentSystemInfo error', e)
        }

    }

    renderPaymentSystem = (item, index) => {

        const { selectedPaymentSystem, extendsFields } = this.props

        let ifSelectStyle = false

        // console.log('selected', selectedPaymentSystem.currencyCode + ' ' + selectedPaymentSystem.paymentSystem, CACHE_SELECTED_PAYMENT.currencyCode + ' ' + CACHE_SELECTED_PAYMENT.paymentSystem)

        if (CACHE_SELECTED_PAYMENT) {
            ifSelectStyle = CACHE_SELECTED_PAYMENT.currencyCode === item.currencyCode && CACHE_SELECTED_PAYMENT.paymentSystem === item.paymentSystem
            if (CACHE_SELECTED_PAYMENT.hasDouble) {
                ifSelectStyle = CACHE_SELECTED_PAYMENT.id === item.id
            }
            if (ifSelectStyle) {
                this.handleSelectors(CACHE_SELECTED_PAYMENT)
                if (!CACHE_SEND_TO_PARENT || CACHE_SEND_TO_PARENT !== CACHE_SELECTED_PAYMENT.id) {
                    // console.log('setToParent ' + CACHE_SELECTED_PAYMENT.currencyCode + ' ' + CACHE_SELECTED_PAYMENT.paymentSystem)
                    CACHE_SEND_TO_PARENT = CACHE_SELECTED_PAYMENT.id
                    CACHE_PAUSE_PROPS = true
                    this.props.handleSetState('selectedPaymentSystem', {
                        ...CACHE_SELECTED_PAYMENT
                    }, () => {
                        CACHE_PAUSE_PROPS = false
                    })
                }

            }
        } else if (!selectedPaymentSystem || typeof selectedPaymentSystem.currencyCode === 'undefined') {
            ifSelectStyle = selectedPaymentSystem.currencyCode === item.currencyCode && selectedPaymentSystem.paymentSystem === item.paymentSystem
            if (selectedPaymentSystem.hasDouble) {
                ifSelectStyle = selectedPaymentSystem.id === item.id
            }
        }

        if (ifSelectStyle && (!selectedPaymentSystem ||  typeof selectedPaymentSystem.currencyCode === 'undefined')) {
            CACHE_PAUSE_PROPS = true
            this.props.handleSetState('selectedPaymentSystem', {
                ...item
            }, () => {
                CACHE_PAUSE_PROPS = false
            })
        }

        let bankFeeString = strings('tradeScreen.fee') + ' ' + item.providerFee[extendsFields.fieldForWayId.toLowerCase()][0].amount + ' %'
        if (item.paymentSystem === 'ADVCASH') {
            bankFeeString = strings('tradeScreen.ADVCASH') + ' ' + (BlocksoftExternalSettings.getStatic('ADV_PERCENT')) + '%'
        }

        return (
            <View style={{ position: 'relative' }} key={index}>
                <TouchableOpacity
                    disabled={!item.available || ifSelectStyle}
                    style={[styles.paymentSystem, ifSelectStyle ? styles.paymentSystem_active : null]}
                    onPress={() => this.handleSetSelectedPaymentSystem(item, false, 'onClick')}>
                    {this.renderPaymentSystemSelect(item, ifSelectStyle)}
                    <View style={styles.paymentSystem__bottom}>
                        <Text
                            style={[styles.paymentSystem__text, ifSelectStyle ? styles.paymentSystem__text_active : null]}>{bankFeeString}</Text>
                    </View>
                    {!item.available ? <View style={styles.paymentSystem__block}/> : null}
                </TouchableOpacity>
                <TouchableOpacity style={styles.paymentSystem__wrap__icon}
                                  onPress={() => this.handlePaymentSystemInfo(item)}>
                    <Feather
                        style={[styles.paymentSystem__icon, ifSelectStyle ? styles.paymentSystem__icon_active : null]}
                        name={'info'}/>
                </TouchableOpacity>
            </View>
        )
    }

    renderPaymentSystemSelect = (item, ifSelectStyle) => {

        let title = null
        let Icon = null

        switch (item.paymentSystem) {
            case 'VISA_MC_P2P':
            case 'VISA_MC':

                if (typeof item.paymentTitleSuffix === 'undefined' || !item.paymentTitleSuffix) {
                    title = strings(`tradeScreen.${item.currencyCode}`)
                } else {
                    title = strings(`tradeScreen.${item.paymentTitleSuffix}`)
                }
                Icon = () => <View style={styles.paymentSystem__medium}>
                    <Visa fill={ifSelectStyle ? '#fff' : '#1A1F71'} ifSelectStyle={ifSelectStyle}/>
                    <MasterCard ifSelectStyle={ifSelectStyle}/>
                </View>
                break
            case 'VISA_MC_WW':
                title = strings('tradeScreen.worldwide')
                Icon = () => <View style={styles.paymentSystem__medium}>
                    <Visa fill={ifSelectStyle ? '#fff' : '#1A1F71'} ifSelectStyle={ifSelectStyle}/>
                    <MasterCard ifSelectStyle={ifSelectStyle}/>
                </View>
                break
            case 'QIWI':
                title = strings('tradeScreen.QIWI')
                Icon = () => <View style={styles.paymentSystem__medium}>
                    <QIWI ifSelectStyle={ifSelectStyle}/>
                </View>
                break
            case 'MOBILE_PHONE':
                title = strings(`tradeScreen.${item.currencyCode}`)
                Icon = () => <View style={[styles.paymentSystem__medium, { flex: 1, justifyContent: 'space-between' }]}>
                    <KievStar fill={ifSelectStyle ? '#fff' : '#0095db'} ifSelectStyle={ifSelectStyle}/>
                    <Vodafone fill={ifSelectStyle ? '#fff' : '#e60000'} subFill={ifSelectStyle ? '#e60000' : '#fff'}
                              ifSelectStyle={ifSelectStyle}/>
                    <Lifecell fill={ifSelectStyle ? '#fff' : '#244f9a'} ifSelectStyle={ifSelectStyle}/>
                </View>
                break
            case 'ADVCASH':
                title = strings('tradeScreen.ADVCashName')
                Icon = () => <View style={styles.paymentSystem__medium}>
                    <ADVCASH fill={ifSelectStyle ? '#fff' : '#00364D'} ifSelectStyle={ifSelectStyle}/>
                </View>
                break
            case 'PAYEER':
                title = strings('tradeScreen.PayeerName')
                Icon = () => <View style={styles.paymentSystem__medium}>
                    <PAYEER fill={ifSelectStyle ? '#fff' : '#000'} ifSelectStyle={ifSelectStyle}/>
                </View>
                break
            case 'PERFECT_MONEY':
                title = strings('tradeScreen.PMName')
                Icon = () => <View style={styles.paymentSystem__medium}>
                    <PerfectMoney fill={ifSelectStyle ? '#fff' : '#00364D'} ifSelectStyle={ifSelectStyle}/>

                </View>
                break
            default:
                title = ''
                Icon = () => <View/>
                break
        }

        if (typeof item.title !== 'undefined' && typeof item.title[sublocale()] !== 'undefined' && item.title[sublocale()] && item.title[sublocale()] !== '') {
            title = item.title[sublocale()]
        }

        return (
            <View style={{ flex: 1 }}>
                <View style={styles.paymentSystem__top}>
                    <Text
                        style={[styles.paymentSystem__title, ifSelectStyle ? styles.paymentSystem__title_active : null]}>{title}</Text>
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
                        showsHorizontalScrollIndicator={false}
                        ref={this.scrollViewRef}>
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
