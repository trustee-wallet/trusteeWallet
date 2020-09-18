/**
 * @version 0.11
 */
import React, { Component } from 'react'
import { View, Text, TouchableOpacity } from 'react-native'

import { connect } from 'react-redux'

import Ionicons from 'react-native-vector-icons/Ionicons'

import CustomIcon from '../../../components/elements/CustomIcon.js'

import { showModal } from '../../../appstores/Stores/Modal/ModalActions'

import { strings } from '../../../services/i18n'
import Log from '../../../services/Log/Log'
import NavStore from '../../../components/navigation/NavStore'
import BlocksoftPrettyNumbers from '../../../../crypto/common/BlocksoftPrettyNumbers'
import accountDS from '../../../appstores/DataSource/Account/Account'
import UpdateAccountListDaemon from '../../../daemons/view/UpdateAccountListDaemon'
import AsyncStorage from '@react-native-community/async-storage'
import ExchangeTmpConstants from './ExchangeTmpConstants'

let CACHE_INIT_KEY = ''

class ExchangeInCurrency extends Component {

    constructor(props) {
        super(props)
        this.state = {
            indexedCrypto : {},
            indexedCryptoLength : 0
        }
    }

    // eslint-disable-next-line camelcase
    UNSAFE_componentWillReceiveProps(nextProps) {
        if (typeof nextProps.selectedInCurrency === 'undefined' || typeof nextProps.selectedInCurrency.currencyCode === 'undefined') {
            return false
        }
        if (this.props.selectedInCurrency.currencyCode !== nextProps.selectedInCurrency.currencyCode) {
            this.handleSelectCryptocurrency({ key: nextProps.selectedInCurrency.currencyCode }, false)
        }
    }

    init = () => {
        const key = 'onlyOne'
        if (CACHE_INIT_KEY === key && this.state.indexedCryptoLength > 0) {
            return ;
        }

        try {
            const cryptocurrencies = this.props.currencyStore.cryptoCurrencies
            const { selectedInCurrency, extendsFields } = this.props
            const tradeApiConfig = this.props.exchangeStore.exchangeApiConfig

            Log.log('EXC/InCurrency.init ways ' + extendsFields.fieldForInCurrency)

            const indexedCrypto = {}
            let indexedCryptoLength = 0
            let item
            for (item of tradeApiConfig) {
                if (typeof item === 'undefined' || !item || typeof indexedCrypto[item[extendsFields.fieldForInCurrency]] !== 'undefined') {
                    continue
                }
                indexedCrypto[item[extendsFields.fieldForInCurrency]] = {fromDict : false}
            }
            for (item of cryptocurrencies) {
                if (typeof indexedCrypto[item.currencyCode] !== 'undefined') {
                    indexedCrypto[item.currencyCode].fromDict = item
                    indexedCryptoLength++
                }
            }

            const param = this.props.navigation.getParam('exchangeScreenParam')

            let cryptocurrencyTmp = {}

            if (typeof param !== 'undefined') {
                if ( typeof param.selectedInCurrency !== 'undefined' && typeof param.selectedInCurrency.currencyCode !== 'undefined' ) {
                    cryptocurrencyTmp = {
                        key: param.selectedInCurrency.currencyCode,
                        value: `${param.selectedInCurrency.currencyName} (${param.selectedInCurrency.currencyCode})`
                    }
                } else if ( typeof param.selectedOutCurrency !== 'undefined' && typeof param.selectedOutCurrency.currencyCode !== 'undefined' ) {
                    if (param.selectedOutCurrency.currencyCode === 'BTC') {
                        cryptocurrencyTmp = { key: 'ETH', value: 'Ethereum (ETH)' }
                    } else {
                        cryptocurrencyTmp = { key: 'BTC', value: 'Bitcoin (BTC)' }
                    }
                }
            } else if (typeof selectedInCurrency.currencyCode === 'undefined') {
                if (!ExchangeTmpConstants.CACHE_SELECTED_PREV_IN) {
                    ExchangeTmpConstants.CACHE_SELECTED_PREV_IN = this.props.exchangeStore.exchangeInCC
                }
                if (ExchangeTmpConstants.CACHE_SELECTED_PREV_IN && typeof indexedCrypto[ExchangeTmpConstants.CACHE_SELECTED_PREV_IN] !== 'undefined') {
                    const tmp = indexedCrypto[ExchangeTmpConstants.CACHE_SELECTED_PREV_IN]
                    cryptocurrencyTmp = { key: ExchangeTmpConstants.CACHE_SELECTED_PREV_IN , value: this.getValueForSelected(tmp) }
                } else {
                    cryptocurrencyTmp = { key: 'BTC', value: 'Bitcoin (BTC)' }
                }
            }
            Log.log('EXC/InCurrency.init list length ' + indexedCryptoLength)

            if (indexedCryptoLength > 0) {
                CACHE_INIT_KEY = key
            }
            this.setState({
                indexedCrypto,
                indexedCryptoLength
            }, () => {
                this.handleSelectCryptocurrency(cryptocurrencyTmp, false)
            })
        } catch (e) {
            Log.err('EXC/InCurrency.init error ' + e.message)
        }
    }

    drop = () => {
        Log.log('EXC/InCurrency.drop')
        this.setState({
            indexedCrypto : {},
            indexedCryptoLength : 0
        })
    }

    handleSelectCryptocurrency = async (cryptocurrency) => {
        Log.log('EXC/InCurrency.handleSelectCryptocurrency init ' + (cryptocurrency.key || 'no key'))
        try {
            const { selectedWallet } = this.props.mainStore
            const { accountList } = this.props.accountStore
            const { indexedCrypto } = this.state

            if (typeof indexedCrypto[cryptocurrency.key] === 'undefined'
                || !indexedCrypto[cryptocurrency.key]
                || typeof indexedCrypto[cryptocurrency.key].fromDict === 'undefined') {
                return false
            }
            const selectedInCurrency = indexedCrypto[cryptocurrency.key].fromDict
            if (!selectedInCurrency) {
                return false
            }
            const selectedAccountFromStore = accountList[selectedWallet.walletHash][selectedInCurrency.currencyCode]

            if (typeof selectedAccountFromStore === 'undefined') {
                await accountDS.discoverAccounts({ walletHash: selectedWallet.walletHash, currencyCode: [selectedInCurrency.currencyCode], source : 'FROM_EXC' }, 'FROM_EXC')
                await UpdateAccountListDaemon.updateAccountListDaemon({force: true, source : 'EXC'})
                return false
            }

            const mass = {selectedInCurrency}
            mass.selectedInAccount = selectedAccountFromStore

            ExchangeTmpConstants.CACHE_SELECTED_PREV_IN = selectedInCurrency.currencyCode
            AsyncStorage.setItem('exchange.selectedInCurrency.currencyCode', selectedInCurrency.currencyCode)

            this.props.handleSetState('mass', mass)
        } catch (e) {
            Log.err('EXC/InCurrency.handleSelectCryptocurrency error ' + e.message)
        }
    }

    getValueForSelected = (selectedInCurrency) => {
        if (selectedInCurrency.currencyCode === 'USDT')
            return `USDT - Tether OMNI`
        else if (selectedInCurrency.currencyCode === 'ETH_USDT')
            return `USDT - Tether ERC20`
        else
            return `${selectedInCurrency.currencySymbol} - ${selectedInCurrency.currencyName}`
    }

    handleOpenSelectTradeCryptocurrency = () => {
        try {
            const selectedInCurrency = this.props.selectedInCurrency
            const selectedItem = {
                key: selectedInCurrency.currencySymbol,
                value: this.getValueForSelected(selectedInCurrency)
            }

            const listForSelect = []
            let item, tmp, tmp2
            for (tmp in this.state.indexedCrypto) {
                item = this.state.indexedCrypto[tmp].fromDict
                if (!item) continue
                if (item.currencyCode === 'USDT')
                    tmp2 = { key: item.currencyCode, value: `USDT - Tether OMNI` }
                else if (item.currencyCode === 'ETH_USDT')
                    tmp2 = { key: item.currencyCode, value: `USDT - Tether ERC20` }
                else
                    tmp2 = { key: item.currencyCode, value: `${item.currencySymbol} - ${item.currencyName}` }
                listForSelect.push(tmp2)
            }

            Log.log('EXC/InCurrency.handleOpenSelectTradeCryptocurrency shown select modal', listForSelect)
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
        } catch (e) {
            Log.err('EXC/InCurrency.handleOpenSelectTradeCryptocurrency error ' + e.message)
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

    renderSelectedCryptocurrency = (selectedCryptocurrency) => {
        if (selectedCryptocurrency.currencyCode === 'USDT')
            return `OMNI`
        else if (selectedCryptocurrency.currencyCode === 'ETH_USDT')
            return `ERC20`
        else
            return selectedCryptocurrency.currencyName

    }

    handleMainRender = () => {
        const { selectedInCurrency, selectedInAccount, exchangeStore } = this.props

        let balance = ''
        if (typeof selectedInAccount !== 'undefined' && typeof selectedInAccount.balance !== 'undefined') {
            balance = strings('homeScreen.balance') + ': ' + BlocksoftPrettyNumbers.makeCut(selectedInAccount.balancePretty).justCutted + ' ' + selectedInCurrency.currencySymbol
        }

        if (typeof selectedInCurrency.currencyCode !== 'undefined') {
            let iconCode = selectedInCurrency.currencyCode
            if (iconCode === 'ETH_DAIM') {
                iconCode = 'ETH_DAI'
            }
            return (
                <View>
                    <TouchableOpacity style={[styles.select, styles.select_active]} onPress={this.handleOpenSelectTradeCryptocurrency}>
                        <CustomIcon style={styles.select__currencyIcon} name={iconCode}/>
                        <Text style={styles.select__text} numberOfLines={1}>{this.renderSelectedCryptocurrency(selectedInCurrency)}</Text>
                        <View style={styles.select__icon__wrap}>
                            <Ionicons style={styles.select__icon} name='ios-arrow-down'/>
                        </View>
                    </TouchableOpacity>

                    <View style={{ flexDirection: 'row', alignItems: 'center', paddingLeft: 15, paddingTop: 5 }}>
                        <Text style={{ color: '#999999', fontSize: 12 }}>
                            {balance}
                        </Text>
                    </View>

                </View>
            )
        }

        return (
            <View>
                <TouchableOpacity style={[styles.select, styles.select_active]} onPress={this.handleOpenSelectTradeCryptocurrency}>
                    <CustomIcon style={styles.select__currencyIcon} name={selectedInCurrency.currencyCode}/>
                    <Text style={styles.select__text} numberOfLines={1}>-</Text>
                    <View style={styles.select__icon__wrap}>
                        <Ionicons style={styles.select__icon} name='ios-arrow-down'/>
                    </View>
                </TouchableOpacity>

                <View style={{ flexDirection: 'row', alignItems: 'center', paddingLeft: 15, paddingTop: 5 }}>
                    <Text style={{ color: '#999999', fontSize: 12 }}>
                        {balance}
                    </Text>
                </View>

            </View>
        )

    }

    render() {
        this.init()
        return this.handleMainRender()
    }
}

const mapStateToProps = (state) => {
    return {
        exchangeStore: state.exchangeStore,
        mainStore: state.mainStore,
        currencyStore: state.currencyStore,
        accountStore: state.accountStore
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        dispatch
    }
}

export default connect(mapStateToProps, mapDispatchToProps, null, { forwardRef: true })(ExchangeInCurrency)


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

        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.23,
        shadowRadius: 2.62,

        elevation: 4
    },
    select_active: {
        backgroundColor: '#A168F2'
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
        fontSize: 18
    },
    select__icon: {
        height: 21,

        color: '#fff',
        fontSize: 22
    }
}
