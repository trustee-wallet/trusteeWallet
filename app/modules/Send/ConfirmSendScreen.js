import React, { Component } from 'react'
import { connect } from 'react-redux'

import { View, Text, TouchableOpacity, Keyboard, ScrollView, SafeAreaView } from 'react-native'
import { hideModal, showModal } from '../../appstores/Actions/ModalActions'
import BlocksoftDict from '../../../crypto/common/BlocksoftDict'
import BlocksoftTransfer from '../../../crypto/actions/BlocksoftTransfer/BlocksoftTransfer'
import MarketingEvent from '../../services/Marketing/MarketingEvent'
import transactionActions from '../../appstores/Actions/TransactionActions'
import i18n, { strings } from '../../services/i18n'
import NavStore from '../../components/navigation/NavStore'
import Log from '../../services/Log/Log'
import { KeyboardAwareView } from 'react-native-keyboard-aware-view'
import GradientView from '../../components/elements/GradientView'
import Cross from 'react-native-vector-icons/Entypo'
import Fee from './elements/Fee'
import ButtonLine from '../../components/elements/ButtonLine'
import Button from '../../components/elements/Button'
import utils from '../../services/utils'
import FiatRatesActions from '../../appstores/Actions/FiatRatesActions'
import Theme from '../../themes/Themes'

let styles

class ConfirmSendScreen extends Component {

    constructor(){
        super()
        this.state = {
            isSendDisabled: false,
            data: {}
        }
    }

    // eslint-disable-next-line camelcase
    UNSAFE_componentWillMount() {
        styles = Theme.getStyles().sendScreenStyles.confirmModalStyles

        const data = this.props.navigation.getParam("confirmSendScreenParam")

        this.setState({
            data
        })
    }

    handleHide = () => {
        NavStore.goBack(null)
    }

    setParentState = (field, value) => this.setState({ [field]: value })

    handleSend = async () => {

        let fee

        try {
            fee = await this.fee.getFee()
        } catch (e) {
            return false
        }

        this.setState({ isSendDisabled: true })

        const { amountRaw, address: addressTo, cryptocurrency, account, wallet, useAllFunds, memo } = this.state.data

        const { wallet_hash: walletHash } = wallet
        const { address: addressFrom, derivation_path: derivationPath } = account
        const { currencyCode } = cryptocurrency
        const extend = BlocksoftDict.getCurrencyAllSettings(currencyCode)

        // TODO: fix this
        const derivationPathTmp = derivationPath.replace(/quote/g, '\'')

        try {

            let tx = await (
                BlocksoftTransfer.setCurrencyCode(currencyCode)
                    .setWalletHash(walletHash)
                    .setDerivePath(derivationPathTmp)
                    .setAddressFrom(addressFrom)
                    .setAddressTo(addressTo)
                    .setMemo(memo)
                    .setAmount(amountRaw)
                    .setAdditional(account.account_json)
                    .setTransferAll(useAllFunds)
                    .setFee(fee)
            ).sendTx()

            const transaction = {
                currency_code: currencyCode,
                account_id: account.id,
                wallet_hash: walletHash,
                transaction_hash: tx.hash,
                transaction_status: 'new',
                address_to: addressTo,
                address_from: addressFrom,
                address_amount: amountRaw,
                transaction_fee: fee.feeForTx,
                transaction_of_trustee_wallet : 1,
                transaction_json : {memo : ''},
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                transaction_direction : 'outcome'
            }
            if (typeof  tx.correctedAmountFrom !== 'undefined') {
                transaction.address_amount = tx.correctedAmountFrom
            }

            if (typeof tx.block_hash !== 'undefined') {
                transaction.block_hash = tx.block_hash
            }
            if (typeof tx.transaction_status !== 'undefined') {
                transaction.transaction_status = tx.transaction_status
            }
            if (typeof tx.transaction_json !== 'undefined') {
                transaction.transaction_json = tx.transaction_json
            }
            if (typeof tx.timestamp !== 'undefined' && tx.timestamp) {
                transaction.created_at = new Date(tx.timestamp).toISOString()
                transaction.updated_at = new Date(tx.timestamp).toISOString()
            }

            MarketingEvent.checkSellSendTx({
                walletHash: walletHash,
                currency_code: currencyCode,
                transaction_hash: tx.hash,
                address_to: addressTo,
                address_from: addressFrom,
                address_amount: amountRaw,
            })

            transactionActions.saveTransaction(transaction)

            hideModal()

            let successMessage = strings('modal.send.txSuccess')
            if (typeof tx.successMessage != 'undefined') {
                successMessage = tx.successMessage
            }
            showModal({
                type: 'INFO_MODAL',
                icon: true,
                title: strings('modal.send.success'),
                description: successMessage
            }, () => {

                const { type } = this.props.sendStore.data

                if(type === 'TRADE_SEND'){
                    NavStore.goNext('FinishScreen', {
                        finishScreenParam: {
                            selectedCryptocurrency: this.props.sendStore.data.cryptocurrency
                        }
                    })
                } else {
                    BlocksoftTransfer.getTransferPrecache()
                    NavStore.goBack(null)
                    NavStore.goBack(null)
                }
            })

        } catch (e) {

            Log.errorTranslate(e, 'Send.ConfirmSendScreen.handleSend', typeof extend.addressCurrencyCode === "undefined" ? extend.currencySymbol : extend.addressCurrencyCode,  JSON.stringify(extend))

            Keyboard.dismiss()

            showModal({
                type: 'INFO_MODAL',
                icon: null,
                title: strings('modal.exchange.sorry'),
                description: e.message,
                error: e
            })
        }

    }


    render(){

        const { isSendDisabled } = this.state
        const { amount, address, account, cryptocurrency, wallet, type } = this.state.data
        const { currencySymbol } = cryptocurrency
        const { currency_rate_usd } = cryptocurrency
        const { localCurrencySymbol } = this.props.fiatRatesStore

        const equivalent = utils.prettierNumber(FiatRatesActions.toLocalCurrency(amount * currency_rate_usd, false), 2)

        return (
            <GradientView style={styles.bg} array={styles_.array} start={styles_.start} end={styles_.end}>
                <View style={styles.wrapper}>
                    <SafeAreaView style={{ flex: 0, backgroundColor: '#7127ab' }} />
                    <SafeAreaView style={{ flex: 1, position: "relative", backgroundColor: '#fff' }}>
                        <View style={{ position: "absolute", width: "100%", top: 0, left: 0, height: 1000, backgroundColor: "#7127ab" }} />
                        <KeyboardAwareView>
                            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.wrapper__content}>
                                <View style={styles.top}>
                                    <Text style={styles.title}>
                                        {strings('send.confirmModal.title')}
                                    </Text>
                                </View>
                                <View style={styles.box}>
                                    <View style={styles.content__text}>
                                        <Text style={styles.content__text_first}>
                                            {
                                                typeof amount.split('.')[1] != 'undefined' ? amount.split('.')[0] + '.' : amount.split('.')[0]
                                            }
                                        </Text>
                                        <Text style={styles.content__text_last}>
                                            {
                                                typeof amount.split('.')[1] != 'undefined' ? amount.split('.')[1].slice(0, 7) + ' ' + currencySymbol : ' ' + currencySymbol
                                            }
                                        </Text>
                                    </View>
                                    {
                                        type !== 'TRADE_SEND' ?
                                            <Text style={styles.content__subtext}>
                                                { localCurrencySymbol } { equivalent }
                                            </Text> : null
                                    }
                                    <View style={styles.box__line}></View>
                                </View>
                                <View style={styles.description}>
                                    <View style={styles.description__item}>
                                        <Text style={styles.description__text}>
                                            {strings('send.confirmModal.recipient')}
                                        </Text>
                                        <Text style={styles.description__text}>
                                            {address.slice(0, 10) + '...' + address.slice(address.length - 10, address.length)}
                                        </Text>
                                    </View>
                                </View>
                                <TouchableOpacity onPress={() => this.handleHide()} style={styles.cross}>
                                    <Cross name={'cross'} size={30} color={'#fff'}/>
                                </TouchableOpacity>
                                <Fee
                                    ref={ref => this.fee = ref}
                                    cryptocurrency={cryptocurrency}
                                    account={account}
                                    transfer={{ amount, address }}
                                    wallet={wallet}
                                    sendData={this.state.data}
                                    setParentState={this.setParentState}
                                />
                            </ScrollView>
                            <View style={styles.bottom}>
                                <View style={{ width: "100%", position: "relative", flexDirection: "row", justifyContent: "space-between", zIndex: 1 }}>
                                    <ButtonLine
                                        press={() => this.handleHide()}
                                        styles={styles.btn}
                                        touchableOpacityStyle={styles.btn__touchableOpacity}
                                        styleText={i18n.locale == 'ru-RU' ? { fontSize: 16 } : null}>
                                        {strings('send.confirmModal.edit')}
                                    </ButtonLine>
                                    <Button
                                        press={() => this.handleSend()}
                                        styles={styles.btn}
                                        touchableOpacityStyle={styles.btn__touchableOpacity}
                                        disabled={isSendDisabled}
                                        styleText={i18n.locale == 'ru-RU' ? { fontSize: 16 } : null}>
                                        {strings('send.confirmModal.confirm')}
                                    </Button>
                                </View>
                                <View style={{ position: "absolute", width: "100%", top: 0, left: 0, height: 1000, backgroundColor: "#fff", zIndex: 0 }} />
                            </View>
                        </KeyboardAwareView>
                    </SafeAreaView>
                </View>
            </GradientView>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        sendStore: state.sendStore,
        mainStore: state.mainStore,
        exchangeStore: state.exchangeStore,
        fiatRatesStore: state.fiatRatesStore
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        dispatch
    }
}

export default connect(mapStateToProps, mapDispatchToProps, null)(ConfirmSendScreen)

const styles_ = {
    array: ['#7127ab', '#7127ab'],
    start: { x: 0.0, y: 0.5 },
    end: { x: 1, y: 0.5 }
}
