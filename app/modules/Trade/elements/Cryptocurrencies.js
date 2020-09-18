/**
 * @version 0.11
 */
import React, { Component } from 'react'
import { View, Text, TouchableOpacity } from 'react-native'

import AsyncStorage from '@react-native-community/async-storage'

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
import TmpConstants from './TmpConstants'
import UpdateAccountListDaemon from '../../../daemons/view/UpdateAccountListDaemon'


let CACHE_INIT_KEY = ''


class Cryptocurrencies extends Component {

    constructor(props) {
        super(props)
        this.state = {
            indexedCrypto: {},
            indexedCryptoLength: 0
        }
    }

    // eslint-disable-next-line camelcase
    UNSAFE_componentWillReceiveProps(nextProps) {
        if (this.props.selectedCryptocurrency.currencyCode !== nextProps.selectedCryptocurrency.currencyCode) {
            this.handleSelectCryptocurrency({ key: nextProps.selectedCryptocurrency.currencyCode }, false)
        }
    }

    init = () => {
        const key = 'onlyOne'
        if (CACHE_INIT_KEY === key && this.state.indexedCryptoLength > 0) {
            return
        }

        if (typeof this.props.exchangeStore.tradeApiConfig.exchangeWays === 'undefined') {
            return
        }

        try {

            const cryptocurrencies = this.props.currencyStore.cryptoCurrencies

            const { selectedCryptocurrency, extendsFields } = this.props
            const tradeApiConfig = this.props.exchangeStore.tradeApiConfig.exchangeWays


            Log.log('TRADE/CryptoCurrency.init ways ' + extendsFields.fieldForCryptocurrency)

            const indexedCrypto = {}
            let indexedCryptoLength = 0
            let item
            for (item of tradeApiConfig) {
                if (typeof indexedCrypto[item[extendsFields.fieldForCryptocurrency]] !== 'undefined') {
                    continue
                }
                indexedCrypto[item[extendsFields.fieldForCryptocurrency]] = { fromDict: false }
            }
            for (item of cryptocurrencies) {
                if (typeof indexedCrypto[item.currencyCode] !== 'undefined') {
                    indexedCrypto[item.currencyCode].fromDict = item
                    indexedCryptoLength++
                }
            }

            const param = this.props.navigation.getParam('exchangeScreenParam')

            let cryptocurrencyTmp = {}

            if (typeof param !== 'undefined' && typeof param.selectedCryptocurrency !== 'undefined' && typeof param.selectedCryptocurrency.currencyCode !== 'undefined') {
                cryptocurrencyTmp = {
                    key: param.selectedCryptocurrency.currencyCode,
                    value: `${param.selectedCryptocurrency.currencyName} (${param.selectedCryptocurrency.currencyCode})`
                }
            } else if (typeof selectedCryptocurrency.currencyCode === 'undefined') {
                if (!TmpConstants.CACHE_SELECTED_PREV_CRYPTO) {
                    if (this.props.exchangeStore.tradePrevCC && typeof indexedCrypto[this.props.exchangeStore.tradePrevCC] !== 'undefined') {
                        TmpConstants.CACHE_SELECTED_PREV_CRYPTO = { key: this.props.exchangeStore.tradePrevCC, value: this.getValueForSelected(indexedCrypto[this.props.exchangeStore.tradePrevCC] ) }
                    } else {
                        TmpConstants.CACHE_SELECTED_PREV_CRYPTO = { key: 'BTC', value: 'Bitcoin (BTC)' }
                    }
                }
                cryptocurrencyTmp = TmpConstants.CACHE_SELECTED_PREV_CRYPTO
            }

            Log.log('TRADE/CryptoCurrency.init list length ' + indexedCryptoLength)

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
            Log.err('TRADE/CryptoCurrency.init error ' + e.message)
        }
    }

    drop = () => {
        Log.log('TRADE/CryptoCurrency.drop')
        this.setState({
            indexedCrypto: {},
            indexedCryptoLength: 0
        })
    }

    handleSelectCryptocurrency = async (cryptocurrency, isReInit) => {
        Log.log('TRADE/OutCurrency.handleSelectCryptocurrency init ' + (cryptocurrency.key || 'no key') + (isReInit ? ' isReInit' : ' noReInit'))
        try {
            const { selectedWallet } = this.props.mainStore
            const { tradeType } = this.props.exchangeStore
            let { accountList } = this.props.accountStore
            const { indexedCrypto } = this.state

            if (typeof indexedCrypto[cryptocurrency.key] === 'undefined'
                || !indexedCrypto[cryptocurrency.key]
                || typeof indexedCrypto[cryptocurrency.key].fromDict === 'undefined') {
                return false
            }

            const selectedCryptocurrency = indexedCrypto[cryptocurrency.key].fromDict
            if (!selectedCryptocurrency) {
                return false
            }

            let selectedAccountFromStore = false
            if (typeof accountList !== 'undefined' && typeof accountList[selectedWallet.walletHash] !== 'undefined' && typeof accountList[selectedWallet.walletHash][selectedCryptocurrency.currencyCode] !== 'undefined') {
                selectedAccountFromStore =  accountList[selectedWallet.walletHash][selectedCryptocurrency.currencyCode]
            } else {
                await accountDS.discoverAccounts({ walletHash: selectedWallet.walletHash, currencyCode: [selectedCryptocurrency.currencyCode], source : 'FROM_TRADE' }, 'FROM_TRADE')
                accountList = await UpdateAccountListDaemon.updateAccountListDaemon({force: true, source : 'TRADE'})
                if (typeof accountList !== 'undefined' && typeof accountList[selectedWallet.walletHash] !== 'undefined' && typeof accountList[selectedWallet.walletHash][selectedCryptocurrency.currencyCode] !== 'undefined') {
                    selectedAccountFromStore =  accountList[selectedWallet.walletHash][selectedCryptocurrency.currencyCode]
                } else {
                    throw new Error('something wrong with regeneration of the store for ' + selectedWallet.walletHash + ' trade ' + selectedCryptocurrency.currencyCode)
                }
            }



            const mass = {selectedCryptocurrency}
            if (selectedCryptocurrency.currencyCode === 'BTC') {
                const btcLegacyOrSegWit = await settingsActions.getSetting('btc_legacy_or_segwit')
                const btcShowTwoAddress = await settingsActions.getSetting('btcShowTwoAddress')
                let showType = 'segwit'
                if ((btcShowTwoAddress === false || btcShowTwoAddress === '0') && btcLegacyOrSegWit === 'legacy') {
                    showType = 'legacy'
                }
                console.log('showType', showType)
                if (typeof selectedAccountFromStore.segwit !== 'undefined'
                    && typeof selectedAccountFromStore.legacy !== 'undefined' ) {
                    const tmp = this.state.uniqueParams || {}
                    mass.uniqueParams = {
                        ...tmp,
                        segwitOutDestination: selectedAccountFromStore.segwit
                    }
                    if (showType !== 'segwit') {
                        delete mass.uniqueParams.segwitOutDestination
                    }
                    mass.selectedAccount = {
                        ...selectedAccountFromStore,
                        address: selectedAccountFromStore.legacy,
                        showAddress : showType === 'segwit' ? selectedAccountFromStore.segwit : selectedAccountFromStore.legacy
                    }
                } else {
                    const selectedAccountFromDB = await accountDS.getAccountData({
                        walletHash: selectedWallet.walletHash,
                        currencyCode: selectedCryptocurrency.currencyCode,
                        splitSegwit: true
                    })
                    if (typeof selectedAccountFromDB.segwit[0] !== 'undefined') {
                        const tmp = this.state.uniqueParams || {}
                        mass.uniqueParams = {
                            ...tmp,
                            segwitOutDestination: selectedAccountFromDB.segwit[0].address
                        }
                    }
                    mass.selectedAccount = {
                        ...selectedAccountFromStore,
                        derivationPath: selectedAccountFromDB.legacy[0].derivationPath,
                        address: selectedAccountFromDB.legacy[0].address
                    }
                }
            } else {
                mass.selectedAccount = selectedAccountFromStore
                if (typeof this.state !== 'undefined' && typeof this.state.uniqueParams !== 'undefined') {
                    delete this.state.uniqueParams.segwitOutDestination
                }
            }

            // TODO: romove kostil
            if (isReInit) {
                this.props.handleSetState('selectedPaymentSystem', '')
                this.props.refFiatCurrencies.reInit(selectedCryptocurrency)
            }
            // TODO: ***************************

            if (tradeType === 'BUY') {
                checkTransferHasError({
                    currencyCode: selectedCryptocurrency.currencyCode,
                    currencySymbol: selectedCryptocurrency.currencySymbol,
                    address: mass.selectedAccount.address
                })
            }

            AsyncStorage.setItem('trade.selectedCryptocurrency.currencyCode', selectedCryptocurrency.currencyCode)
            this.props.handleSetState('mass', mass)
        } catch (e) {
            Log.err('TRADE/CryptoCurrency.handleSelectCryptocurrency error ' + e.message)
        }
    }

    getValueForSelected = (selectedCryptocurrency) => {
        if (selectedCryptocurrency.currencyCode === 'USDT')
            return `USDT - Tether OMNI`
        else if (selectedCryptocurrency.currencyCode === 'ETH_USDT')
            return `USDT - Tether ERC20`
        else
            return `${selectedCryptocurrency.currencySymbol} - ${selectedCryptocurrency.currencyName}`
    }

    handleOpenSelectTradeCryptocurrency = () => {
        try {
            const selectedCryptocurrency = this.props.selectedCryptocurrency
            const selectedItem = {
                key: selectedCryptocurrency.currencySymbol,
                value: this.getValueForSelected(selectedCryptocurrency)
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

            Log.log('TRADE/Cryptocurrency.handleOpenSelectTradeCryptocurrency shown select modal', listForSelect)
            showModal({
                type: 'SELECT_MODAL',
                data: {
                    title: strings('tradeScreen.selectCrypto'),
                    listForSelect,
                    selectedItem
                }
            }, (selectedItem) => {
                TmpConstants.CACHE_SELECTED_PREV_CRYPTO = selectedItem
                this.handleSelectCryptocurrency(selectedItem, true)
            })
        } catch (e) {
            Log.err('TRADE/Cryptocurrencies.handleOpenSelectTradeCryptocurrency error ' + e.message)
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
        const { selectedCryptocurrency, selectedAccount, exchangeStore } = this.props

        if (typeof selectedCryptocurrency.currencyCode !== 'undefined' && typeof selectedAccount !== 'undefined' && typeof selectedAccount.balance !== 'undefined') {
            const iconCode = selectedCryptocurrency.currencyCode
            // if (iconCode === 'ETH_DAIM') {
            //     iconCode = 'ETH_DAI'
            // }
            return (
                <View>
                    <TouchableOpacity style={[styles.select, styles.select_active]}
                                      onPress={this.handleOpenSelectTradeCryptocurrency}>
                        <CustomIcon style={styles.select__currencyIcon} name={iconCode}/>
                        <Text style={styles.select__text}
                              numberOfLines={1}>{this.renderSelectedCryptocurrency(selectedCryptocurrency)}</Text>
                        <View style={styles.select__icon__wrap}>
                            <Ionicons style={styles.select__icon} name='ios-arrow-down'/>
                        </View>
                    </TouchableOpacity>
                    {
                        exchangeStore.tradeType === 'SELL' ?
                            <View
                                style={{ flexDirection: 'row', alignItems: 'center', paddingLeft: 15, paddingTop: 5 }}>
                                <Text style={{ color: '#999999', fontSize: 12 }}>
                                    {strings('homeScreen.balance')}: {BlocksoftPrettyNumbers.makeCut(selectedAccount.balancePretty).justCutted} {selectedCryptocurrency.currencySymbol}
                                </Text>
                            </View> : null
                    }
                </View>
            )
        }

        return (
            <TouchableOpacity style={styles.select} onPress={this.handleOpenSelectTradeCryptocurrency}>
                <CustomIcon name={selectedCryptocurrency.currencyCode}/>
                <Text style={styles.select__text}>{strings('tradeScreen.crypto')}</Text>
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
