import React, { Component } from 'react'
import { View, Text, TouchableOpacity } from 'react-native'

import { connect } from 'react-redux'
import Ionicons from 'react-native-vector-icons/Ionicons'

import { showModal } from '../../../appstores/Actions/ModalActions'
import { strings } from '../../../services/i18n'
import NavStore from '../../../components/navigation/NavStore'

import countryCodesWithCurrencyCodes from '../../../assets/jsons/other/country-codes'
import Log from '../../../services/Log/Log'


class FiatCurrencies extends Component {

    constructor(props){
        super(props)
        this.state = {
            availableFiatCurrencies: []
        }
    }
    drop = () => {
        this.setState({
            availableFiatCurrencies: []
        })
    }

    UNSAFE_componentWillReceiveProps(nextProps) {
        try {
            const tradeApiConfig = JSON.parse(JSON.stringify(this.props.exchangeStore.tradeApiConfig))
            const { extendsFields } = this.props
            const { tradeType } = this.props.exchangeStore
            const { fiatRates } = this.props.fiatRatesStore
            const { selectedCryptocurrency } = nextProps

            let tradeWaysTmp = tradeApiConfig.exchangeWays.filter(item => item[extendsFields.fieldForCryptocurrency] === selectedCryptocurrency.currencyCode)

            let fiatCurrenciesTmp = []

            for (const way of tradeWaysTmp)
                fiatCurrenciesTmp = fiatCurrenciesTmp.concat(way.supportedCountries)

            fiatCurrenciesTmp = [...new Set(fiatCurrenciesTmp)]

            let availableFiatCurrenciesTmp = []
            let availableFiatCurrenciesTmp2 = []

            fiatCurrenciesTmp.forEach(item1 => countryCodesWithCurrencyCodes.forEach(item2 => {
                if (item1.toString() === item2.iso) availableFiatCurrenciesTmp.push(item2)
            }))

            fiatRates.forEach(item1 => availableFiatCurrenciesTmp.forEach(item2 => {
                if (item1.cc === item2.currencyCode) availableFiatCurrenciesTmp2.push(item1)
            }))

            availableFiatCurrenciesTmp2 = [...new Set(availableFiatCurrenciesTmp2)]

            //TODO: kostil dlia togo shob bulo toko dve valuti

            const UAHindex = availableFiatCurrenciesTmp2.findIndex(obj => obj.cc === 'UAH')
            const RUBindex = availableFiatCurrenciesTmp2.findIndex(obj => obj.cc === 'RUB')

            let arrayToState = []
            UAHindex !== -1 ? arrayToState.push(availableFiatCurrenciesTmp2[UAHindex]) : null
            RUBindex !== -1 ? arrayToState.push(availableFiatCurrenciesTmp2[RUBindex]) : null

            //TODO: **************************************************************************

            this.setState({
                availableFiatCurrencies: arrayToState
            })

            // if(tradeType === 'SELL'){
            //     if(typeof nextProps.selectedFiatCurrency.cc == 'undefined' && availableFiatCurrenciesTmp2.length){
            //         this.props.handleSetState('selectedFiatCurrency', availableFiatCurrenciesTmp2[availableFiatCurrenciesTmp2.length - 1])
            //     }
            // }
        } catch (e) {
            Log.err('FiatCurrencies.UNSAFE_componentWillReceiveProps error ' + e)
        }
    }


    //TODO: romove kostil
    reInit = (selectedCryptocurrency) => {
        try {
            const tradeApiConfig = JSON.parse(JSON.stringify(this.props.exchangeStore.tradeApiConfig))
            const { extendsFields, selectedFiatCurrency } = this.props
            const { tradeType } = this.props.exchangeStore
            const { fiatRates } = this.props.fiatRatesStore

            let tradeWaysTmp = tradeApiConfig.exchangeWays.filter(item => item[extendsFields.fieldForCryptocurrency] === selectedCryptocurrency.currencyCode)

            let fiatCurrenciesTmp = []

            for (const way of tradeWaysTmp)
                fiatCurrenciesTmp = fiatCurrenciesTmp.concat(way.supportedCountries)

            fiatCurrenciesTmp = [...new Set(fiatCurrenciesTmp)]

            let availableFiatCurrenciesTmp = []
            let availableFiatCurrenciesTmp2 = []

            fiatCurrenciesTmp.forEach(item1 => countryCodesWithCurrencyCodes.forEach(item2 => {
                if (item1.toString() === item2.iso) availableFiatCurrenciesTmp.push(item2)
            }))

            fiatRates.forEach(item1 => availableFiatCurrenciesTmp.forEach(item2 => {
                if (item1.cc === item2.currencyCode) availableFiatCurrenciesTmp2.push(item1)
            }))

            availableFiatCurrenciesTmp2 = [...new Set(availableFiatCurrenciesTmp2)]

            //TODO: kostil dlia togo shob bulo toko dve valuti

            const UAHindex = availableFiatCurrenciesTmp2.findIndex(obj => obj.cc === 'UAH')
            const RUBindex = availableFiatCurrenciesTmp2.findIndex(obj => obj.cc === 'RUB')

            let arrayToState = []
            UAHindex !== -1 ? arrayToState.push(availableFiatCurrenciesTmp2[UAHindex]) : null
            RUBindex !== -1 ? arrayToState.push(availableFiatCurrenciesTmp2[RUBindex]) : null


            const isAvailable = arrayToState.find(item => item.cc === selectedFiatCurrency.cc)

            this.setState({
                availableFiatCurrencies: arrayToState
            })

            if(typeof isAvailable == 'undefined'){
                this.props.handleSetState('selectedFiatCurrency', arrayToState[0])
            }

        } catch (e) {
            Log.err('FiatCurrencies.UNSAFE_componentWillReceiveProps error ' + e)
        }
    }

    //TODO: ******************************************************************************************

    handleSelectFiatCurrency = (fiatCurrency) => {
        const availableFiatCurrencies = JSON.parse(JSON.stringify(this.state.availableFiatCurrencies))

        let selectedFiatCurrency = availableFiatCurrencies.filter(item => item.cc === fiatCurrency.key)
        selectedFiatCurrency = selectedFiatCurrency[0]

        this.props.handleSetState('selectedFiatCurrency', selectedFiatCurrency)
    }

    handleOpenSelectFiatCurrency = () => {

        const availableFiatCurrencies = JSON.parse(JSON.stringify(this.state.availableFiatCurrencies))
        const selectedFiatCurrency = JSON.parse(JSON.stringify(this.props.selectedFiatCurrency))

        let listForSelect
        let selectedItem = {
            key: selectedFiatCurrency.cc,
            value: selectedFiatCurrency.cc
        }

        listForSelect = availableFiatCurrencies.map(item => { return { key: item.cc, value : `${item.cc}` }})

        const array = ['GBP','CHF','RUB','UAH','EUR','USD']

        for(const item of array){
            const currencyIndex = listForSelect.findIndex(currency => currency.key === item)
            listForSelect.unshift( listForSelect.splice( currencyIndex, 1 )[0] )
        }

        showModal({
            type: 'SELECT_MODAL',
            data: {
                title: strings('tradeScreen.selectFiat'),
                listForSelect,
                selectedItem
            }
        }, (selectedItem) => {
            this.handleSelectFiatCurrency(selectedItem)
        })
    }

    handleMainRender = () => {
        const { symbol, cc } = this.props.selectedFiatCurrency
        const { selectedCryptocurrency } = this.props

        if(typeof selectedCryptocurrency.currencyCode == 'undefined'){
            return (
                <View style={[styles.select, styles.select_disabled]}>
                    <Text style={[styles.select__text, styles.select__text_disabled]}>{ `Fiat` }</Text>
                    <View style={styles.select__icon__wrap}>
                        <Ionicons style={[styles.select__icon, styles.select__icon_disabled]} name='ios-arrow-down' />
                    </View>
                </View>
            )
        }

        if(typeof cc !== 'undefined' ){
            return (
                <TouchableOpacity style={[styles.select, styles.select_active]} onPress={this.handleOpenSelectFiatCurrency}>
                    <Text style={styles.select__currencyIcon}>
                        { symbol }
                    </Text>
                    <Text style={styles.select__text}>{ `${cc}` }</Text>
                    <View style={styles.select__icon__wrap}>
                        <Ionicons style={styles.select__icon} name='ios-arrow-down' />
                    </View>
                </TouchableOpacity>
            )
        }

        return (
            <TouchableOpacity style={styles.select} onPress={this.handleOpenSelectFiatCurrency}>
                <Text style={styles.select__text}>{ "--" }</Text>
                <View style={styles.select__icon__wrap}>
                    <Ionicons style={styles.select__icon} name='ios-arrow-down' />
                </View>
            </TouchableOpacity>
        )

    }

    render() {
        return this.handleMainRender()
    }
}

const mapStateToProps = (state) => {
    return {
        fiatRatesStore: state.fiatRatesStore,
        exchangeStore: state.exchangeStore,
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
        height: 44,

        backgroundColor: '#7127AC',
        borderRadius: 10,

        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.23,
        shadowRadius: 2.62,

        elevation: 4,
    },
    select_disabled: {
        borderWidth: 1.5,
        borderColor: '#F3E6FF',
        borderStyle: 'solid',

        backgroundColor: '#fff',

        shadowColor: "#fff",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.23,
        shadowRadius: 2.62,

        elevation: 0,
    },
    select_active: {
        backgroundColor: '#A168F2',
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
        fontSize: 18,
    },
    select__icon: {
        height: 21,

        color: '#fff',
        fontSize: 22,
    },
    select__icon_disabled: {
        color: '#F3E6FF'
    }
}
