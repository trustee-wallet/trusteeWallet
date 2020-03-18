import React, { Component } from 'react'
import { View, Text, TouchableOpacity } from 'react-native'

import { connect } from 'react-redux'

import Ionicons from 'react-native-vector-icons/Ionicons'

import CustomIcon from '../../../components/elements/CustomIcon.js'

import accountDS from '../../../appstores/DataSource/Account/Account'
import { showModal } from '../../../appstores/Actions/ModalActions'
import { strings } from '../../../services/i18n'


class InCryptocurrencies extends Component {

    constructor(props){
        super(props)
        this.state = {
            availableInCryptocurrencies: []
        }
    }

    // eslint-disable-next-line camelcase
    async UNSAFE_componentWillMount() {
        this.init()
    }

    // eslint-disable-next-line camelcase
    UNSAFE_componentWillReceiveProps(nextProps) {

        if(typeof nextProps.selectedInCryptocurrency.currencyCode != 'undefined' && this.props.selectedOutCryptocurrency.currencyCode === nextProps.selectedInCryptocurrency.currencyCode && this.props.selectedInCryptocurrency.currencyCode !== nextProps.selectedInCryptocurrency.currencyCode){
            this.props.refOutCryptocurrencies.setCryptocurrency({ key: this.props.selectedInCryptocurrency.currencyCode, value: this.getValueForSelected(this.props.selectedInCryptocurrency) })
        }

        // if(typeof nextProps.selectedOutCryptocurrency.currencyCode != 'undefined'){
        //     const { selectedOutCryptocurrency } = nextProps
        //     const { currencies: cryptocurrencies } = this.props.mainStore
        //     const { extendsFields } = this.props
        //     const exchangeApiConfig = JSON.parse(JSON.stringify(this.props.exchangeStore.exchangeApiConfig))
        //
        //     let cryptocurrenciesList
        //
        //     cryptocurrenciesList = exchangeApiConfig.map(item => {
        //         if(item[extendsFields.inCryptocurrency] !== selectedOutCryptocurrency.currencyCode){
        //             return item[extendsFields.inCryptocurrency]
        //         }
        //     })
        //
        //     cryptocurrenciesList = cryptocurrencies.map(item => {
        //         if(cryptocurrenciesList.includes(item.currencyCode)){
        //             return item
        //         }
        //     })
        //
        //     cryptocurrenciesList = cryptocurrenciesList.filter((el) => {
        //         return el != null
        //     })
        //
        //     this.setState({
        //         availableInCryptocurrencies: cryptocurrenciesList
        //     })
        // }
    }

    init = () => {
        const { currencies: cryptocurrencies } = this.props.mainStore
        const { extendsFields } = this.props
        const exchangeApiConfig = JSON.parse(JSON.stringify(this.props.exchangeStore.exchangeApiConfig))

        let cryptocurrenciesList

        cryptocurrenciesList = exchangeApiConfig.map(item => item[extendsFields.inCryptocurrency])

        cryptocurrenciesList = cryptocurrencies.map(item => {
            if(cryptocurrenciesList.includes(item.currencyCode)){
                return item
            }
        })

        cryptocurrenciesList = cryptocurrenciesList.filter((el) => {
            return el != null
        })

        const param = this.props.navigation.getParam('exchangeScreenParam')

        const tmpCryptocurrenciesList = JSON.parse(JSON.stringify(cryptocurrenciesList))

        const cryptocurrency = typeof param != 'undefined' ? { key: (tmpCryptocurrenciesList.filter(item => item.currencyCode !== param.selectedCryptocurrency.currencyCode))[0].currencyCode, value: `${(tmpCryptocurrenciesList.filter(item => item.currencyCode !== param.selectedCryptocurrency.currencyCode))[0].currencyName}` } : { key: 'BTC', value: 'Bitcoin (BTC)' }

        this.setState({
            availableInCryptocurrencies: cryptocurrenciesList
        }, () => {
            this.handleSelectCryptocurrency(cryptocurrency)
        })
    }

    setCryptocurrency = cryptocurrency => this.handleSelectCryptocurrency(cryptocurrency)

    handleSelectCryptocurrency = async (cryptocurrency) => {
        const { selectedWallet, currencies } = this.props.mainStore
        const { self, selectedOutCryptocurrency, handleGetExchangeWay, extendsFields } = this.props

        const availableInCryptocurrencies = JSON.parse(JSON.stringify(this.state.availableInCryptocurrencies))

        let selectedInCryptocurrency = availableInCryptocurrencies.filter(item => item.currencyCode === cryptocurrency.key)
        selectedInCryptocurrency = selectedInCryptocurrency[0]

        let selectedInAccount = await accountDS.getAccountData({wallet_hash : selectedWallet.wallet_hash, currency_code : selectedInCryptocurrency.currencyCode})
        selectedInAccount = selectedInAccount[0]

        const exchangeWay = handleGetExchangeWay(selectedInCryptocurrency, selectedOutCryptocurrency)

        if(typeof exchangeWay === "undefined"){
            let exchangeApiConfig = JSON.parse(JSON.stringify(this.props.exchangeStore.exchangeApiConfig))

            exchangeApiConfig = exchangeApiConfig.filter(item => item[extendsFields.inCryptocurrency] === selectedInCryptocurrency.currencyCode)

            let cryptocurrenciesList = exchangeApiConfig.map(item => item[extendsFields.outCryptocurrency])

            cryptocurrenciesList = currencies.map(item => {
                if(cryptocurrenciesList.includes(item.currencyCode)){
                    return item
                }
            })

            cryptocurrenciesList = cryptocurrenciesList.filter((el) => {
                return el != null
            })

            let selectedOutAccount = await accountDS.getAccountData({wallet_hash : selectedWallet.wallet_hash, currency_code : cryptocurrenciesList[0].currencyCode})
            selectedOutAccount = selectedOutAccount[0]

            const selectedOutCryptocurrency = currencies.find(item => item.currencyCode === cryptocurrenciesList[0].currencyCode)

            this.props.handleSetState('selectedOutCryptocurrency', selectedOutCryptocurrency)
            this.props.handleSetState('selectedOutAccount', selectedOutAccount)

            this.props.handleSetState('selectedInCryptocurrency', selectedInCryptocurrency)
            this.props.handleSetState('selectedInAccount', selectedInAccount)
        } else {
            this.props.handleSetState('selectedInCryptocurrency', selectedInCryptocurrency)
            this.props.handleSetState('selectedInAccount', selectedInAccount)
        }
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

        const availableInCryptocurrencies = JSON.parse(JSON.stringify(this.state.availableInCryptocurrencies))
        const selectedInCryptocurrency = JSON.parse(JSON.stringify(this.props.selectedInCryptocurrency))

        const selectedItem = {
            key: selectedInCryptocurrency.currencySymbol,
            value: this.getValueForSelected(selectedInCryptocurrency)
        }

        const listForSelect = availableInCryptocurrencies.map(item => {
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
            this.handleSelectCryptocurrency(selectedItem)
        })
    }

    renderSelectedCryptocurrency = (selectedInCryptocurrency) => {

        if(selectedInCryptocurrency.currencyCode === 'USDT')
            return `OMNI`
        else if(selectedInCryptocurrency.currencyCode === 'ETH_USDT')
            return `ERC20`
        else
            return selectedInCryptocurrency.currencyName

    }

    handleMainRender = () => {
        const { selectedInCryptocurrency } = this.props

        if(typeof selectedInCryptocurrency.currencyCode !== 'undefined' ){
            return (
                <TouchableOpacity style={[styles.select, styles.select_active]} onPress={this.handleOpenSelectTradeCryptocurrency}>
                    <CustomIcon style={styles.select__currencyIcon} name={selectedInCryptocurrency.currencyCode} />
                    <Text style={styles.select__text} numberOfLines={1}>{ this.renderSelectedCryptocurrency(selectedInCryptocurrency) }</Text>
                    <View style={styles.select__icon__wrap}>
                        <Ionicons style={styles.select__icon} name='ios-arrow-down' />
                    </View>
                </TouchableOpacity>
            )
        }

        return (
            <TouchableOpacity style={styles.select} onPress={this.handleOpenSelectTradeCryptocurrency}>
                <CustomIcon name={selectedInCryptocurrency.currencyCode} />
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

export default connect(mapStateToProps, mapDispatchToProps, null, { forwardRef: true })(InCryptocurrencies)


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
        flex: 1,

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
