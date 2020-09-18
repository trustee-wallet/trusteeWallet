/**
 * @version 0.11
 */
import React, { Component } from 'react'
import { View, Text, TouchableOpacity } from 'react-native'

import { connect } from 'react-redux'

import Ionicons from 'react-native-vector-icons/Ionicons'

import CustomIcon from '../../../components/elements/CustomIcon.js'

import accountDS from '../../../appstores/DataSource/Account/Account'
import settingsActions from '../../../appstores/Stores/Settings/SettingsActions'
import { showModal } from '../../../appstores/Stores/Modal/ModalActions'

import { strings } from '../../../services/i18n'
import Log from '../../../services/Log/Log'
import NavStore from '../../../components/navigation/NavStore'

import checkTransferHasError from '../../../services/UI/CheckTransferHasError/CheckTransferHasError'

import BlocksoftPrettyNumbers from '../../../../crypto/common/BlocksoftPrettyNumbers'
import UpdateAccountListDaemon from '../../../daemons/view/UpdateAccountListDaemon'
import AsyncStorage from '@react-native-community/async-storage'
import ExchangeTmpConstants from './ExchangeTmpConstants'

let CACHE_INIT_KEY = ''

class ExchangeOutCurrency extends Component {

    constructor(props) {
        super(props)
        this.state = {
            indexedCrypto : {},
            indexedCryptoLength : 0
        }
    }

    // eslint-disable-next-line camelcase
    UNSAFE_componentWillReceiveProps(nextProps) {
        if (typeof nextProps.selectedOutCurrency === 'undefined' || typeof nextProps.selectedOutCurrency.currencyCode === 'undefined') {
            return false
        }
        if (this.props.selectedOutCurrency.currencyCode !== nextProps.selectedOutCurrency.currencyCode) {
            this.handleSelectCryptocurrency({ key: nextProps.selectedOutCurrency.currencyCode }, false)
        }
    }

    init = () => {
        const key = 'onlyOne'
        if (CACHE_INIT_KEY === key && this.state.indexedCryptoLength > 0) {
            return ;
        }

        try {
            const cryptocurrencies = this.props.currencyStore.cryptoCurrencies
            const { selectedOutCurrency, extendsFields } = this.props
            const tradeApiConfig = this.props.exchangeStore.exchangeApiConfig

            Log.log('EXC/OutCurrency.init ways ' + extendsFields.fieldForOutCurrency)

            const indexedCrypto = {}
            let indexedCryptoLength = 0
            let item
            for (item of tradeApiConfig) {
                if (typeof indexedCrypto[item[extendsFields.fieldForOutCurrency]] !== 'undefined') {
                    continue
                }
                indexedCrypto[item[extendsFields.fieldForOutCurrency]] = {fromDict : false}
            }
            for (item of cryptocurrencies) {
                if (typeof indexedCrypto[item.currencyCode] !== 'undefined') {
                    indexedCrypto[item.currencyCode].fromDict = item
                    indexedCryptoLength++
                }
            }

            const param = this.props.navigation.getParam('exchangeScreenParam')

            let cryptocurrencyTmp = {}

            if (typeof param !== 'undefined' && typeof param.selectedOutCurrency !== 'undefined' && typeof param.selectedOutCurrency.currencyCode !== 'undefined') {
                cryptocurrencyTmp = {
                    key: param.selectedOutCurrency.currencyCode,
                    value: `${param.selectedOutCurrency.currencyName} (${param.selectedOutCurrency.currencyCode})`
                }
            } else if (typeof selectedOutCurrency.currencyCode === 'undefined') {
                if (!ExchangeTmpConstants.CACHE_SELECTED_PREV_OUT) {
                    ExchangeTmpConstants.CACHE_SELECTED_PREV_OUT = this.props.exchangeStore.exchangeOutCC
                }
                if (ExchangeTmpConstants.CACHE_SELECTED_PREV_OUT && typeof indexedCrypto[ExchangeTmpConstants.CACHE_SELECTED_PREV_OUT] !== 'undefined') {
                    const tmp = indexedCrypto[ExchangeTmpConstants.CACHE_SELECTED_PREV_OUT]
                    cryptocurrencyTmp = { key: ExchangeTmpConstants.CACHE_SELECTED_PREV_OUT , value: this.getValueForSelected(tmp) }
                } else {
                    cryptocurrencyTmp = { key: 'ETH', value: 'Ethereum (ETH)' }
                }
            }

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
            Log.err('EXC/OutCurrency.init error ' + e.message)
        }
    }

    drop = () => {
        Log.log('EXC/OutCurrency.drop')
        this.setState({
            indexedCrypto : {},
            indexedCryptoLength : 0
        })
    }

    handleSelectCryptocurrency = async (cryptocurrency) => {
        Log.log('EXC/OutCurrency.handleSelectCryptocurrency init ' + (cryptocurrency.key || 'no key'))
        try {
            const { selectedWallet } = this.props.mainStore
            let { accountList } = this.props.accountStore
            const { indexedCrypto } = this.state

            if (typeof indexedCrypto[cryptocurrency.key] === 'undefined'
                || !indexedCrypto[cryptocurrency.key]
                || typeof indexedCrypto[cryptocurrency.key].fromDict === 'undefined') {
                return false
            }

            const selectedOutCurrency = indexedCrypto[cryptocurrency.key].fromDict
            if (!selectedOutCurrency) {
                return false
            }

            let selectedAccountFromStore = false
            if (typeof accountList !== 'undefined' && typeof accountList[selectedWallet.walletHash] !== 'undefined' && typeof accountList[selectedWallet.walletHash][selectedOutCurrency.currencyCode] !== 'undefined') {
                selectedAccountFromStore =  accountList[selectedWallet.walletHash][selectedOutCurrency.currencyCode]
            } else {
                await accountDS.discoverAccounts({ walletHash: selectedWallet.walletHash, currencyCode: [selectedOutCurrency.currencyCode], source : 'FROM_EXC' }, 'FROM_EXC')
                accountList = await UpdateAccountListDaemon.updateAccountListDaemon({force: true, source : 'EXC'})
                if (typeof accountList !== 'undefined' && typeof accountList[selectedWallet.walletHash] !== 'undefined' && typeof accountList[selectedWallet.walletHash][selectedOutCurrency.currencyCode] !== 'undefined') {
                    selectedAccountFromStore =  accountList[selectedWallet.walletHash][selectedOutCurrency.currencyCode]
                } else {
                    throw new Error('something wrong with regeneration of the store for ' + selectedWallet.walletHash + ' out ' + selectedOutCurrency.currencyCode)
                }
            }


            const mass = {selectedOutCurrency}
            if (selectedOutCurrency.currencyCode === 'BTC') {
                const btcLegacyOrSegWit = await settingsActions.getSetting('btc_legacy_or_segwit')
                const btcShowTwoAddress = await settingsActions.getSetting('btcShowTwoAddress')
                let showType = 'segwit'
                if (btcShowTwoAddress === false && btcLegacyOrSegWit === 'legacy') {
                    showType = 'legacy'
                }
                if (typeof selectedAccountFromStore.segwit !== 'undefined'
                    && typeof selectedAccountFromStore.legacy !== 'undefined' ) {
                    const tmp = this.state.uniqueParams || {}
                    mass.uniqueParams = {
                        ...tmp,
                        segwitOutDestination: selectedAccountFromStore.segwit
                    }
                    mass.selectedOutAccount = {
                        ...selectedAccountFromStore,
                        address: showType === 'segwit' ? selectedAccountFromStore.segwit : selectedAccountFromStore.legacy
                    }
                } else {
                    const selectedAccountFromDB = await accountDS.getAccountData({
                        walletHash: selectedWallet.walletHash,
                        currencyCode: selectedOutCurrency.currencyCode,
                        splitSegwit: true
                    })
                    if (typeof selectedAccountFromDB.segwit[0] !== 'undefined') {
                        const tmp = this.state.uniqueParams || {}
                        mass.uniqueParams = {
                            ...tmp,
                            segwitOutDestination: selectedAccountFromDB.segwit[0].address
                        }
                    }
                    mass.selectedOutAccount = {
                        ...selectedAccountFromStore,
                        derivationPath: selectedAccountFromDB.legacy[0].derivationPath,
                        address: selectedAccountFromDB.legacy[0].address
                    }
                }
            } else {
                mass.selectedOutAccount = selectedAccountFromStore
                if (typeof this.state !== 'undefined' && typeof this.state.uniqueParams !== 'undefined') {
                    delete this.state.uniqueParams.segwitOutDestination
                }
            }

            checkTransferHasError({
                currencyCode: selectedOutCurrency.currencyCode,
                currencySymbol: selectedOutCurrency.currencySymbol,
                address: mass.selectedOutAccount.address,
                amount: mass.selectedOutAccount.balance
            })

            ExchangeTmpConstants.CACHE_SELECTED_PREV_OUT = selectedOutCurrency.currencyCode
            AsyncStorage.setItem('exchange.selectedOutCurrency.currencyCode', selectedOutCurrency.currencyCode)

            this.props.handleSetState('mass', mass)
        } catch (e) {
            Log.err('EXC/OutCurrency.handleSelectCryptocurrency error ' + e.message)
        }
    }

    getValueForSelected = (selectedOutCurrency) => {
        if (selectedOutCurrency.currencyCode === 'USDT')
            return `USDT - Tether OMNI`
        else if (selectedOutCurrency.currencyCode === 'ETH_USDT')
            return `USDT - Tether ERC20`
        else
            return `${selectedOutCurrency.currencySymbol} - ${selectedOutCurrency.currencyName}`
    }

    handleOpenSelectTradeCryptocurrency = () => {
        try {
            const selectedOutCurrency = this.props.selectedOutCurrency
            const selectedItem = {
                key: selectedOutCurrency.currencySymbol,
                value: this.getValueForSelected(selectedOutCurrency)
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

            Log.log('EXC/OutCurrency.handleOpenSelectTradeCryptocurrency shown select modal', listForSelect)
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
            Log.err('EXC/OutCurrency.handleOpenSelectTradeCryptocurrency error ' + e.message)
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
        const { selectedOutCurrency, selectedOutAccount, exchangeStore } = this.props

        let balance = ''
        if (typeof selectedOutAccount !== 'undefined' && typeof selectedOutAccount.balance !== 'undefined') {
            balance = strings('homeScreen.balance') + ': ' + BlocksoftPrettyNumbers.makeCut(selectedOutAccount.balancePretty).justCutted + ' ' + selectedOutCurrency.currencySymbol
        }

        if (typeof selectedOutCurrency.currencyCode !== 'undefined') {
            const iconCode = selectedOutCurrency.currencyCode
            // if (iconCode === 'ETH_DAIM') {
            //     iconCode = 'ETH_DAI'
            // }
            return (
                <View>
                    <TouchableOpacity style={[styles.select, styles.select_active]}
                                      onPress={this.handleOpenSelectTradeCryptocurrency}>
                        <CustomIcon style={styles.select__currencyIcon} name={iconCode}/>
                        <Text style={styles.select__text}
                              numberOfLines={1}>{this.renderSelectedCryptocurrency(selectedOutCurrency)}</Text>
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
                <TouchableOpacity style={[styles.select, styles.select_active]}
                                  onPress={this.handleOpenSelectTradeCryptocurrency}>
                    <CustomIcon style={styles.select__currencyIcon} name={selectedOutCurrency.currencyCode}/>
                    <Text style={styles.select__text}
                          numberOfLines={1}>-</Text>
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

export default connect(mapStateToProps, mapDispatchToProps, null, { forwardRef: true })(ExchangeOutCurrency)


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
