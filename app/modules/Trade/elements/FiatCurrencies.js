/**
 * @version 0.11
 */
import React, { Component } from 'react'
import { View, Text, TouchableOpacity } from 'react-native'

import AsyncStorage from '@react-native-community/async-storage'

import { connect } from 'react-redux'
import Ionicons from 'react-native-vector-icons/Ionicons'

import { showModal } from '../../../appstores/Stores/Modal/ModalActions'
import { strings } from '../../../services/i18n'

import Log from '../../../services/Log/Log'
import NavStore from '../../../components/navigation/NavStore'
import TmpConstants from './TmpConstants'

const CACHE_CODES = {}
CACHE_CODES['KZ'] = '108'
CACHE_CODES['RUB'] = '643'
CACHE_CODES['UAH'] = '804'
CACHE_CODES['USD'] =  '840'

const CACHE_ISO = {}
CACHE_ISO['108'] = { country: 'Kazakhstan', iso: '398', cc: 'KZ', currencyCode: 'KZ' }
CACHE_ISO['643'] = { country: 'Russian Federation', iso: '643', cc: 'RUB', currencyCode: 'RUB', symbol: '₽' }
CACHE_ISO['804'] = { country: 'Ukraine', iso: '804', cc: 'UAH', currencyCode: 'UAH', symbol: '₴' }
CACHE_ISO['840'] = { country: 'International', iso: '840', cc: 'USD', currencyCode: 'USD', symbol: '$' }

let CACHE_INIT_KEY = ''
let CACHE_SET = false
const CACHE_AV = {}

class FiatCurrencies extends Component {

    constructor(props) {
        super(props)
        this.state = {
            availableFiatCurrencies: []
        }
        CACHE_SET = false
    }

    drop = () => {
        this.setState({
            availableFiatCurrencies: []
        })
        CACHE_SET = false
    }

    init() {

        const { extendsFields, selectedCryptocurrency, selectedFiatCurrency } = this.props

        if (typeof selectedCryptocurrency === 'undefined' || !selectedCryptocurrency || typeof selectedCryptocurrency.currencyCode === 'undefined') {
            return
        }


        const key = 'onlyOne_' + selectedCryptocurrency.currencyCode
        if (CACHE_INIT_KEY === key) {
            if (!CACHE_SET) {
                if (typeof CACHE_AV[selectedCryptocurrency.currencyCode] !== 'undefined') {
                    CACHE_SET = true
                    this.setState({
                        availableFiatCurrencies: CACHE_AV[selectedCryptocurrency.currencyCode]
                    })
                    if (TmpConstants.CACHE_SELECTED_PREV_FIAT) {
                        if (!selectedFiatCurrency || typeof selectedFiatCurrency.cc === 'undefined') {
                            const iso = CACHE_CODES[TmpConstants.CACHE_SELECTED_PREV_FIAT]
                            this.props.handleSetState('selectedFiatCurrency', JSON.parse(JSON.stringify(CACHE_ISO[iso])))
                        }
                    }
                    return
                }
            } else {
                if (TmpConstants.CACHE_SELECTED_PREV_FIAT) {
                    if (!selectedFiatCurrency || typeof selectedFiatCurrency.cc === 'undefined') {
                        const iso = CACHE_CODES[TmpConstants.CACHE_SELECTED_PREV_FIAT]
                        this.props.handleSetState('selectedFiatCurrency', JSON.parse(JSON.stringify(CACHE_ISO[iso])))
                    }
                }
                return
            }
        }

        CACHE_INIT_KEY = key

        const tradeApiConfig = this.props.exchangeStore.tradeApiConfig

        if (typeof tradeApiConfig.exchangeWays === 'undefined') {
            return
        }

        try {
            let item, tmp
            const availableFiatCurrencies = {}

            for (item of tradeApiConfig.exchangeWays) {
                if (item[extendsFields.fieldForCryptocurrency] !== selectedCryptocurrency.currencyCode) {
                    continue
                }
                if (item.supportedCountries && item.supportedCountries.length > 0) {
                    for (tmp of item.supportedCountries) {
                        const iso = tmp.toString()
                        if (typeof CACHE_ISO[iso] === 'undefined') continue
                        if (typeof availableFiatCurrencies[iso] === 'undefined') {
                            availableFiatCurrencies[CACHE_ISO[iso].currencyCode] = CACHE_ISO[iso]
                        }
                    }
                } else if (typeof CACHE_CODES[item.inCurrencyCode] !== 'undefined') {
                    const iso = CACHE_CODES[item.inCurrencyCode]
                    if (typeof availableFiatCurrencies[iso] === 'undefined') {
                        availableFiatCurrencies[CACHE_ISO[iso].currencyCode] = CACHE_ISO[iso]
                    }
                } else if (typeof CACHE_CODES[item.outCurrencyCode] !== 'undefined') {
                    const iso = CACHE_CODES[item.outCurrencyCode]
                    if (typeof availableFiatCurrencies[iso] === 'undefined') {
                        availableFiatCurrencies[CACHE_ISO[iso].currencyCode] = CACHE_ISO[iso]
                    }
                }
            }

            CACHE_AV[selectedCryptocurrency.currencyCode] = availableFiatCurrencies
            CACHE_SET = true

            this.setState({
                availableFiatCurrencies: availableFiatCurrencies
            })

            if (!TmpConstants.CACHE_SELECTED_PREV_FIAT) {
                if (this.props.exchangeStore.tradePrevFC && typeof availableFiatCurrencies[this.props.exchangeStore.tradePrevFC] !== 'undefined') {
                    TmpConstants.CACHE_SELECTED_PREV_FIAT = this.props.exchangeStore.tradePrevFC
                    this.props.handleSetState('selectedFiatCurrency', JSON.parse(JSON.stringify(availableFiatCurrencies[this.props.exchangeStore.tradePrevFC])))
                }
            } else {
                if (!selectedFiatCurrency || typeof selectedFiatCurrency.cc === 'undefined') {
                    const iso = CACHE_CODES[TmpConstants.CACHE_SELECTED_PREV_FIAT]
                    this.props.handleSetState('selectedFiatCurrency', JSON.parse(JSON.stringify(CACHE_ISO[iso])))
                }
            }

        } catch (e) {
            Log.err('FiatCurrencies.init error ' + e.message)
        }
    }


    // TODO: romove kostil
    reInit = (selectedCryptocurrency) => {
        try {
            const tradeApiConfig = this.props.exchangeStore.tradeApiConfig
            const { extendsFields, selectedFiatCurrency } = this.props

            let item, tmp
            const availableFiatCurrencies = {}

            for (item of tradeApiConfig.exchangeWays) {
                if (item[extendsFields.fieldForCryptocurrency] !== selectedCryptocurrency.currencyCode) {
                    continue
                }
                if (item.supportedCountries && item.supportedCountries.length > 0) {
                    for (tmp of item.supportedCountries) {
                        const iso = tmp.toString()
                        if (typeof CACHE_ISO[iso] === 'undefined') continue
                        if (typeof availableFiatCurrencies[iso] === 'undefined') {
                            availableFiatCurrencies[CACHE_ISO[iso].currencyCode] = CACHE_ISO[iso]
                        }
                    }
                } else if (typeof CACHE_CODES[item.inCurrencyCode] !== 'undefined') {
                    const iso = CACHE_CODES[item.inCurrencyCode]
                    if (typeof availableFiatCurrencies[iso] === 'undefined') {
                        availableFiatCurrencies[CACHE_ISO[iso].currencyCode] = CACHE_ISO[iso]
                    }
                } else if (typeof CACHE_CODES[item.outCurrencyCode] !== 'undefined') {
                    const iso = CACHE_CODES[item.outCurrencyCode]
                    if (typeof availableFiatCurrencies[iso] === 'undefined') {
                        availableFiatCurrencies[CACHE_ISO[iso].currencyCode] = CACHE_ISO[iso]
                    }
                }
            }

            this.setState({
                availableFiatCurrencies: availableFiatCurrencies
            })

            if (selectedFiatCurrency && typeof selectedFiatCurrency.currencyCode !== 'undefined') {
                if (typeof availableFiatCurrencies[selectedFiatCurrency.currencyCode] === 'undefined') {
                    if (typeof availableFiatCurrencies['UAH'] !== 'undefined') {
                        AsyncStorage.setItem('trade.selectedFiatCurrency.cc', 'UAH')
                        this.props.handleSetState('selectedFiatCurrency', JSON.parse(JSON.stringify(availableFiatCurrencies['UAH'])))
                    } else if (typeof availableFiatCurrencies['RUB'] !== 'undefined') {
                        AsyncStorage.setItem('trade.selectedFiatCurrency.cc', 'RUB')
                        this.props.handleSetState('selectedFiatCurrency', JSON.parse(JSON.stringify(availableFiatCurrencies['RUB'])))
                    } else if (typeof availableFiatCurrencies['USD'] !== 'undefined') {
                        AsyncStorage.setItem('trade.selectedFiatCurrency.cc', 'USD')
                        this.props.handleSetState('selectedFiatCurrency', JSON.parse(JSON.stringify(availableFiatCurrencies['USD'])))
                    } else {
                        this.props.handleSetState('selectedFiatCurrency', false)
                    }
                }
            } else if (TmpConstants.CACHE_SELECTED_PREV_FIAT) {
                console.log('prev', TmpConstants.CACHE_SELECTED_PREV_FIAT)
            }

        } catch (e) {
            Log.err('FiatCurrencies.reInit error ' + e.message)
        }
    }


    handleSelectFiatCurrency = (fiatCurrency) => {
        try {
            const found = typeof this.state.availableFiatCurrencies[fiatCurrency.key] !== 'undefined' ? this.state.availableFiatCurrencies[fiatCurrency.key] : false
            if (found) {
                AsyncStorage.setItem('trade.selectedFiatCurrency.cc', fiatCurrency.key)
                this.props.handleSetState('selectedFiatCurrency', JSON.parse(JSON.stringify(found)))
            } else {
                this.props.handleSetState('selectedFiatCurrency', false)
            }
        } catch (e) {
            Log.err('TradeScreen/FiatCurrencies.handleSelectFiatCurrency error', e.message)
            showModal({
                type: 'INFO_MODAL',
                icon: 'INFO',
                title: strings('modal.exchange.sorry'),
                description: strings('tradeScreen.modalError.serviceUnavailable')
            }, () => {
                NavStore.goBack()
            })
        }
    }

    handleOpenSelectFiatCurrency = () => {
        try {
            const selectedFiatCurrency = this.props.selectedFiatCurrency

            const selectedItem = {
                key: selectedFiatCurrency.cc,
                value: selectedFiatCurrency.cc
            }
            const array = ['UAH', 'RUB', 'EUR', 'USD', 'GBP', 'CHF']


            const listForSelect = []
            for (const item of array) {
                if (typeof this.state.availableFiatCurrencies[item] === 'undefined') {
                    continue
                }
                listForSelect.push({ key: item, value: `${item}` })
            }

            showModal({
                type: 'SELECT_MODAL',
                data: {
                    title: strings('tradeScreen.selectFiat'),
                    listForSelect,
                    selectedItem
                }
            }, (selectedItem) => {
                TmpConstants.CACHE_SELECTED_PREV_FIAT = selectedItem.key
                this.handleSelectFiatCurrency(selectedItem)
            })
        } catch (e) {
            Log.err('TradeScreen/FiatCurrencies.handleOpenSelectFiatCurrency error', e.message)
            showModal({
                type: 'INFO_MODAL',
                icon: 'INFO',
                title: strings('modal.exchange.sorry'),
                description: strings('tradeScreen.modalError.serviceUnavailable')
            }, () => {
                NavStore.goBack()
            })
        }
    }

    handleMainRender = () => {
        const { symbol, cc } = this.props.selectedFiatCurrency
        const { selectedCryptocurrency } = this.props

        if (selectedCryptocurrency && typeof selectedCryptocurrency.currencyCode === 'undefined') {
            return (
                <View style={[styles.select, styles.select_disabled]}>
                    <Text style={[styles.select__text, styles.select__text_disabled]}>{`Fiat`}</Text>
                    <View style={styles.select__icon__wrap}>
                        <Ionicons style={[styles.select__icon, styles.select__icon_disabled]} name='ios-arrow-down'/>
                    </View>
                </View>
            )
        }

        if (typeof cc !== 'undefined') {
            return (
                <TouchableOpacity style={[styles.select, styles.select_active]}
                                  onPress={this.handleOpenSelectFiatCurrency}>
                    <Text style={styles.select__currencyIcon}>
                        {symbol}
                    </Text>
                    <Text style={styles.select__text}>{`${cc}`}</Text>
                    <View style={styles.select__icon__wrap}>
                        <Ionicons style={styles.select__icon} name='ios-arrow-down'/>
                    </View>
                </TouchableOpacity>
            )
        }

        return (
            <TouchableOpacity style={styles.select} onPress={this.handleOpenSelectFiatCurrency}>
                <Text style={styles.select__text}>{'--'}</Text>
                <View style={styles.select__icon__wrap}>
                    <Ionicons style={styles.select__icon} name='ios-arrow-down'/>
                </View>
            </TouchableOpacity>
        )

    }

    render() {
        this.init()
        return this.handleMainRender()
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

export default connect(mapStateToProps, mapDispatchToProps, null, { forwardRef: true })(FiatCurrencies)


const styles = {
    select: {
        position: 'relative',

        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',

        paddingHorizontal: 15,
        maxHeight: 44,

        backgroundColor: '#7127AC',
        borderRadius: 10,

        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.23,
        shadowRadius: 2.62,

        elevation: 4
    },
    select_disabled: {
        borderWidth: 1.5,
        borderColor: '#F3E6FF',
        borderStyle: 'solid',

        backgroundColor: '#fff',

        shadowColor: '#fff',
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.23,
        shadowRadius: 2.62,

        elevation: 0
    },
    select_active: {
        backgroundColor: '#A168F2'
    },
    select__text: {
        marginRight: 'auto',

        fontSize: 19,
        fontFamily: 'SFUIDisplay-Regular',
        color: '#fff'
    },
    select__text_disabled: {
        color: '#F3E6FF'
    },
    select__currencyIcon: {
        marginRight: 13,

        color: '#fff',
        fontSize: 18
    },
    select__icon: {
        height: 21,

        color: '#fff',
        fontSize: 22
    },
    select__icon_disabled: {
        color: '#F3E6FF'
    }
}
