/**
 * @version 0.1
 * @author yura
 */
import React, { Component } from 'react'

import { connect } from 'react-redux'

import { View, ScrollView, Text, } from 'react-native'

import firebase from 'react-native-firebase'

import NavStore from '../../components/navigation/NavStore'

import { setLoaderStatus } from '../../appstores/Stores/Main/MainStoreActions'

import { strings } from '../../services/i18n'

import BlocksoftPrettyNumbers from '../../../crypto/common/BlocksoftPrettyNumbers'
import BlocksoftDict from '../../../crypto/common/BlocksoftDict'

import Log from '../../services/Log/Log'

import LetterSpacing from '../../components/elements/LetterSpacing'
import RateEquivalent from '../../services/UI/RateEquivalent/RateEquivalent'

import UpdateOneByOneDaemon from '../../daemons/back/UpdateOneByOneDaemon'

import TwoButtons from '../../components/elements/new/buttons/TwoButtons'
import Header from '../../components/elements/new/Header'

import { ThemeContext } from '../../modules/theme/ThemeProvider'

import store from '../../store'
import _ from 'lodash'
import BlocksoftPrettyStrings from '../../../crypto/common/BlocksoftPrettyStrings'

import UIDict from '../../services/UIDict/UIDict'

import CheckData from './elements/CheckData'
import CustomIcon from '../../components/elements/CustomIcon'

class ReceiptScreen extends Component {
    constructor(props) {
        super(props)
        this.state = {
            headerHeight: 0,
            isSendDisabled: false,
            data: {},
            feeList: null,
            selectedFee: false,
            selectedCustomFee: false,
            needPasswordConfirm: false,
            fioRequestDetails: null
        }
    }

    // eslint-disable-next-line camelcase
    async UNSAFE_componentWillMount() {

        const data = this.props.navigation.getParam('ReceiptScreen')

        if (data.currencyCode) {
            const newData = this.getData(data)
            this.setState({
                data: newData
            })

        } else {
            if (typeof data.walletUseUnconfirmed === 'undefined') {
                const { selectedWallet } = store.getState().mainStore
                if (typeof data.wallet.walletHash !== 'undefined' && data.wallet.walletHash) {
                    data.wallet = { ...selectedWallet, walletHash: data.wallet.walletHash }
                } else {
                    data.wallet = { ...selectedWallet }
                }
            }
            this.setState({
                data
            })
        }

        this._onFocusListener = this.props.navigation.addListener('didFocus', (payload) => {

            const settings = this.props.settingsStore.data

            if (+settings.lock_screen_status) {
                this.setState({
                    needPasswordConfirm: true
                })
            }
        })

        setLoaderStatus(false)
    }

    getData(data) {
        const { address, amount, memo, useAllFunds, toTransactionJSON, type, currencyCode, countedFees } = data

        const { selectedWallet } = store.getState().mainStore

        const { cryptoCurrencies } = store.getState().currencyStore
        const cryptoCurrencyNew = _.find(cryptoCurrencies, { currencyCode: currencyCode })

        const { accountList } = store.getState().accountStore
        const account = accountList[selectedWallet.walletHash][currencyCode]

        const amountRaw = BlocksoftPrettyNumbers.setCurrencyCode(currencyCode).makeUnPretty(amount)
        if (typeof amountRaw === 'undefined') {
            Log.err('SendScreen.handleSendTransaction ' + currencyCode + ' not ok amountRaw ')
        }

        const newData = {
            memo,
            amount,
            amountRaw,
            address,
            wallet: selectedWallet,
            cryptoCurrency: cryptoCurrencyNew,
            account,
            useAllFunds,
            toTransactionJSON,
            type,
            countedFees
        }
        return newData
    }


    setHeaderHeight = (height) => {
        const headerHeight = Math.round(height || 0);
        this.setState(() => ({ headerHeight }))
    }

    closeAction = () => {
        NavStore.goBack()
    }

    openAdvancedSettings = () => {
        NavStore.goNext('SendAdvancedScreen', {
            fee: {
                countedFees: this.state.data.countedFees,
                selectedFee: {}
            }
        })
    }

    handleSend = async () => {


        // todo 
        // after send trx
        // if (type === 'TRADE_SEND') {
        //     NavStore.goNext('TransactionScreen', {
        //         transaction: {}
        //     })
        // }
    }

    minerFee = (countedFees) => {
        let fee

        if (typeof countedFees.selectedFeeIndex !== 'undefined' && countedFees.selectedFeeIndex >= 0) {
            fee = countedFees.fees[countedFees.selectedFeeIndex]
        }

        const { basicCurrencySymbol, feesCurrencyCode, feesCurrencySymbol, feeRates } = this.props.account

        let prettyFee
        let prettyFeeSymbol = feesCurrencySymbol
        let feeBasicCurrencySymbol = basicCurrencySymbol
        let feeBasicAmount = 0

        // fee.hasOwnProperty('feeForTxDelegated') &&
        if (typeof fee.feeForTxDelegated !== 'undefined') {
            prettyFeeSymbol = currencySymbol
            prettyFee = fee.feeForTxCurrencyAmount
            feeBasicAmount = BlocksoftPrettyNumbers.makeCut(fee.feeForTxBasicAmount, 5).justCutted
            feeBasicCurrencySymbol = fee.feeForTxBasicSymbol
        } else {
            prettyFee = BlocksoftPrettyNumbers.setCurrencyCode(feesCurrencyCode).makePretty(fee.feeForTx)
            feeBasicAmount = BlocksoftPrettyNumbers.makeCut(RateEquivalent.mul({
                value: prettyFee,
                currencyCode: feesCurrencyCode,
                basicCurrencyRate: feeRates.basicCurrencyRate
            }), 5).justCutted
            prettyFee = BlocksoftPrettyNumbers.makeCut(prettyFee, 5).justCutted
        }

        let fiatFee
        if (Number(feeBasicAmount) < 0.01) {
            fiatFee = `> ${feeBasicCurrencySymbol} 0.01`
        } else {
            fiatFee = `${feeBasicCurrencySymbol} ${feeBasicAmount}`
        }

        // `${feeBasicCurrencySymbol} ${feeBasicAmount}`
        return (
            <CheckData
                name={strings('send.receiptScreen.minerFee')}
                value={`${prettyFee} ${prettyFeeSymbol}`}
                subvalue={fiatFee}
            />
        )
    }

    render() {
        UpdateOneByOneDaemon.pause()

        const { colors, GRID_SIZE } = this.context

        const {
            headerHeight
        } = this.state

        let { amount, address, account, cryptoCurrency, type, multiAddress } = this.state.data

        const { currencySymbol } = cryptoCurrency
        const basicCurrencySymbol = account.basicCurrencySymbol

        const dict = new UIDict(cryptoCurrency.currencyCode)
        const color = dict.settings.colors.mainColor

        const equivalent = BlocksoftPrettyNumbers.makeCut(RateEquivalent.mul({
            value: amount,
            currencyCode: account.currencyCode,
            basicCurrencyRate: account.basicCurrencyRate
        }), 2).justCutted
        let extendCurrencyCode = BlocksoftDict.getCurrencyAllSettings(cryptoCurrency.currencyCode)
        extendCurrencyCode = typeof extendCurrencyCode.addressCurrencyCode === 'undefined' ? extendCurrencyCode.currencySymbol : extendCurrencyCode.addressCurrencyCode

        let multiShow = false
        if (typeof multiAddress !== 'undefined' && multiAddress) {
            address = multiAddress[0]
            multiShow = multiAddress
        }

        return (
            <View style={{ flex: 1, backgroundColor: colors.common.background }}>
                <Header
                    leftType='back'
                    leftAction={this.closeAction}
                    rightType="close"
                    rightAction={this.closeAction}
                    title={strings('send.receiptScreen.title')}
                    setHeaderHeight={this.setHeaderHeight}
                />
                <ScrollView
                    ref={(ref) => {
                        this.scrollView = ref
                    }}
                    keyboardShouldPersistTaps={'handled'}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ flexGrow: 1, justifyContent: 'space-between', padding: GRID_SIZE, paddingBottom: GRID_SIZE * 2 }}
                    style={{ marginTop: headerHeight }}
                >
                    <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }} >
                            <Text style={styles.title}>{strings('send.receiptScreen.totalSend')}</Text>
                            <Text style={{ ...styles.value, color: color }} >{`${amount} ${currencySymbol}`}</Text>
                            {
                                type !== 'TRADE_SEND' ?
                                    <LetterSpacing
                                        text={`${basicCurrencySymbol} ${equivalent}`}
                                        numberOfLines={1}
                                        textStyle={styles.notEquivalent}
                                        letterSpacing={1} />

                                    : null
                            }
                            <View style={styles.line} />
                        </View>
                        <View style={{ marginTop: 12 }}>
                            <CheckData
                                name={strings('send.receiptScreen.rate', {currencyCode: currencySymbol})}
                                value={`${account.basicCurrencySymbol} ${account.basicCurrencyRate}`}
                            />
                            {multiShow ?
                                multiShow.map((item, index) => {
                                    return (
                                        <CheckData
                                            name={`${strings('send.receiptScreen.recepient')} ${index + 1}`}
                                            value={BlocksoftPrettyStrings.makeCut(item, 6)}
                                        />
                                    )
                                })
                                :
                                <CheckData
                                    name={strings('send.receiptScreen.destinationAddress')}
                                    value={BlocksoftPrettyStrings.makeCut(address, 6)}
                                />}
                            {this.state.data.countedFees && this.minerFee(this.state.data.countedFees)}
                            <View style={{ paddingHorizontal: GRID_SIZE, flexDirection: 'row', marginTop: 44 }}>
                                <CustomIcon name="shield" size={28} style={{ color: '#5C5C5C' }} />
                                <Text style={styles.info}>{strings('send.receiptScreen.trusteeInfo')}</Text>
                            </View>
                        </View>
                    </View>
                    <TwoButtons
                        mainButton={{
                            onPress: () => this.handleSend(),
                            title: strings('send.receiptScreen.send')
                        }}
                        secondaryButton={{
                            type: 'settings',
                            onPress: this.openAdvancedSettings,
                        }}
                    />
                </ScrollView>
            </View>
        )

    }
}

ReceiptScreen.contextType = ThemeContext

const mapStateToProps = (state) => {
    return {
        sendStore: state.sendStore,
        mainStore: state.mainStore,
        wallet: state.mainStore.selectedWallet,
        account: state.mainStore.selectedAccount,
        exchangeStore: state.exchangeStore,
        settingsStore: state.settingsStore
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        dispatch
    }
}

export default connect(mapStateToProps, mapDispatchToProps, null)(ReceiptScreen)

const styles = {
    title: {
        fontFamily: 'Montserrat-Medium',
        fontSize: 18,
        lineHeight: 24,
        color: '#5C5C5C',
    },
    value: {
        fontFamily: 'Montserrat-Bold',
        fontSize: 20,
        lineHeight: 24,
        paddingBottom: 4,
        paddingTop: 8
    },
    notEquivalent: {
        fontFamily: 'SFUIDisplay-Semibold',
        fontSize: 14,
        lineHeight: 18,

        color: '#999999'
    },
    line: {
        borderBottomWidth: 1,
        borderBottomColor: '#DADADA',
        height: 24,
        width: '70%',
    },
    info: {
        paddingHorizontal: 12,
        fontFamily: 'SFUIDisplay-Semibold',
        fontSize: 14,
        lineHeight: 18,
        color: '#5C5C5C',
        letterSpacing: 1,
        textAlign: 'left'
    }
}