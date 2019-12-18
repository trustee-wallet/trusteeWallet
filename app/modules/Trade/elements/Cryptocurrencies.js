import React, { Component } from 'react'
import { View, Text, TouchableOpacity } from 'react-native'

import { connect } from 'react-redux'

import Ionicons from 'react-native-vector-icons/Ionicons'

import CustomIcon from '../../../components/elements/CustomIcon.js'

import accountDS from '../../../appstores/DataSource/Account/Account'
import { showModal } from '../../../appstores/Actions/ModalActions'
import { strings } from '../../../services/i18n'

import _ from 'lodash'

class Cryptocurrencies extends Component {

    constructor(props){
        super(props)
        this.state = {
            availableCryptocurrencies: []
        }
    }

    async componentWillMount() {
        this.init()
    }

    init = () => {
        const { currencies: cryptocurrencies } = this.props.mainStore
        const { extendsFields } = this.props
        const tradeApiConfig = JSON.parse(JSON.stringify(this.props.exchangeStore.tradeApiConfig))

        let cryptocurrenciesList

        cryptocurrenciesList = tradeApiConfig.exchangeWays.map(item => item[extendsFields.fieldForCryptocurrency])

        cryptocurrenciesList = cryptocurrencies.map(item => {
            if(cryptocurrenciesList.includes(item.currencyCode)){
                return item
            }
        })

        cryptocurrenciesList = cryptocurrenciesList.filter((el) => {
            return el != null
        })

        const param = this.props.navigation.getParam('exchangeScreenParam')

        const cruptocurrencyTmp = typeof param != 'undefined' ? { key: param.selectedCryptocurrency.currencyCode, value: `${param.selectedCryptocurrency.currencyName} (${param.selectedCryptocurrency.currencyCode})`} : { key: 'BTC', value: 'Bitcoin (BTC)' }

        this.setState({
            availableCryptocurrencies: cryptocurrenciesList
        }, () => {
            this.handleSelectCryptocurrency(cruptocurrencyTmp, false)
        })
    }

    drop = () => {
        this.setState({
            availableCryptocurrencies: []
        })
    }

    handleSelectCryptocurrency = async (cryptocurrency, isReInit) => {
        const { selectedWallet } = this.props.mainStore

        const availableCryptocurrencies = JSON.parse(JSON.stringify(this.state.availableCryptocurrencies))

        let selectedCryptocurrency = availableCryptocurrencies.filter(item => item.currencyCode === cryptocurrency.key)
        selectedCryptocurrency = selectedCryptocurrency[0]

        //TODO: romove kostil
        if(isReInit){
            this.props.handleSetState('selectedPaymentSystem', '')
            this.props.refFiatCurrencies.reInit(selectedCryptocurrency)
        }
        //TODO: ***************************

        let selectedAccount = await accountDS.getAccountData(selectedWallet.wallet_hash, selectedCryptocurrency.currencyCode)
        selectedAccount = selectedAccount.array[0]

        this.props.handleSetState('selectedCryptocurrency', selectedCryptocurrency)
        this.props.handleSetState('selectedAccount', selectedAccount)
    }

    getValueForSelected = (selectedCryptocurrency) => {
        if(selectedCryptocurrency.currencyCode === 'USDT')
            return `USDT - Tether OMNI`
        else if(selectedCryptocurrency.currencyCode === 'ETH_USDT')
            return `USDT - Tether ERC20`
        else
            return `${selectedCryptocurrency.currencySymbol} - ${selectedCryptocurrency.currencyName}`
    }

    handleOpenSelectTradeCryptocurrency = () => {

        const availableCryptocurrencies = JSON.parse(JSON.stringify(this.state.availableCryptocurrencies))
        const selectedCryptocurrency = JSON.parse(JSON.stringify(this.props.selectedCryptocurrency))

        let listForSelect
        let selectedItem = {
            key: selectedCryptocurrency.currencySymbol,
            value: this.getValueForSelected(selectedCryptocurrency)
        }

        listForSelect = availableCryptocurrencies.map(item => {
            if(item.currencyCode === 'USDT')
                return { key: item.currencyCode, value : `USDT - Tether OMNI`}
            else if(item.currencyCode === 'ETH_USDT')
                return { key: item.currencyCode, value : `USDT - Tether ERC20`}
            else
                return { key: item.currencyCode, value : `${item.currencySymbol} - ${item.currencyName}`}
        })

        listForSelect.push(listForSelect.splice(listForSelect.findIndex(v => v.key === 'LTC'), 1)[0])

        showModal({
            type: 'SELECT_MODAL',
            data: {
                title: strings('tradeScreen.selectCrypto'),
                listForSelect,
                selectedItem
            }
        }, (selectedItem) => {
            this.handleSelectCryptocurrency(selectedItem, true)
        })
    }

    renderSelectedCryptocurrency = (selectedCryptocurrency) => {

        if(selectedCryptocurrency.currencyCode === 'USDT')
            return `OMNI`
        else if(selectedCryptocurrency.currencyCode === 'ETH_USDT')
            return `ERC20`
        else
            return selectedCryptocurrency.currencyName

    }

    handleMainRender = () => {
        const { selectedCryptocurrency } = this.props

        if(typeof selectedCryptocurrency.currencyCode !== 'undefined' ){
            return (
                <TouchableOpacity style={[styles.select, styles.select_active]} onPress={this.handleOpenSelectTradeCryptocurrency}>
                    <CustomIcon style={styles.select__currencyIcon} name={selectedCryptocurrency.currencyCode} />
                    <Text style={styles.select__text}>{ this.renderSelectedCryptocurrency(selectedCryptocurrency) }</Text>
                    <View style={styles.select__icon__wrap}>
                        <Ionicons style={styles.select__icon} name='ios-arrow-down' />
                    </View>
                </TouchableOpacity>
            )
        }

        return (
            <TouchableOpacity style={styles.select} onPress={this.handleOpenSelectTradeCryptocurrency}>
                <CustomIcon name={selectedCryptocurrency.currencyCode} />
                <Text style={styles.select__text}>{ strings('tradeScreen.crypto') }</Text>
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
        exchangeStore: state.exchangeStore,
        mainStore: state.mainStore
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        dispatch
    }
}

export default connect(mapStateToProps, mapDispatchToProps, null, { forwardRef: true })(Cryptocurrencies)


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
    select_active: {
        backgroundColor: '#A168F2',
    },
    select__text: {
        marginRight: 'auto',

        fontSize: 19,
        fontFamily: 'SFUIDisplay-Regular',
        color: '#fff'
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
}