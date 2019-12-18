import React, { Component } from 'react'
import { connect } from 'react-redux'
import { View, Text, StyleSheet, Keyboard, TouchableOpacity, WebView, Image, ScrollView, Dimensions } from 'react-native'
import Cross from 'react-native-vector-icons/Entypo'
import Modal from 'react-native-modal'

import GradientView from '../../../components/elements/GradientView'
import Button from '../../../components/elements/Button'
import ButtonLine from '../../../components/elements/ButtonLine'
import NavStore from '../../../components/navigation/NavStore'

import { hideModal, showModal } from '../../../appstores/Actions/ModalActions'
import Fee from './Fee'

import { strings } from '../../../services/i18n'
import i18n from '../../../../app/services/i18n'

import BlocksoftTransaction from '../../../../crypto/actions/BlocksoftTransaction/BlocksoftTransaction'
import transactionActions from '../../../appstores/Actions/TransactionActions'

import Log from '../../../services/Log/Log'
import MarketingEvent from '../../../services/Marketing/MarketingEvent'

import { KeyboardAwareView } from 'react-native-keyboard-aware-view'
import FiatRatesActions from '../../../appstores/Actions/FiatRatesActions'

const { height: WINDOW_HEIGHT } = Dimensions.get('window')

import Theme from '../../../themes/Themes'
import BlocksoftDict from '../../../../crypto/common/BlocksoftDict'
let styles


export class ConfirmModal extends Component {

    constructor(props) {
        super(props)
    }

    componentWillMount() {
        styles = Theme.getStyles().sendScreenStyles.confirmModalStyles
    }

    handleHide = () => {
        hideModal()
    }

    handleSend = async () => {

        let fee

        try {
            fee = await this.fee.getFee()
        } catch (e) {
            return false
        }


        const { amountRaw, address: addressTo, cryptocurrency, account, wallet, useAllFunds } = this.props.data.data

        const { wallet_hash: walletHash } = wallet
        const { address: addressFrom, derivation_path: derivationPath } = account
        const { currencyCode } = cryptocurrency
        const extend = BlocksoftDict.getCurrencyAllSettings(currencyCode)

        //TODO: fix this
        const derivationPathTmp = derivationPath.replace(/quote/g, '\'')

        try {

            let tx = await (
                BlocksoftTransaction.setCurrencyCode(currencyCode)
                    .setWalletHash(walletHash)
                    .setDerivePath(derivationPathTmp)
                    .setAddressFrom(addressFrom)
                    .setAddressTo(addressTo)
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

            showModal({
                type: 'INFO_MODAL',
                icon: true,
                title: strings('modal.send.success'),
                description: strings('modal.send.txSuccess')
            }, () => {

                const { type } = this.props.sendStore.data

                if(type === 'TRADE_SEND'){
                    NavStore.goNext('FinishScreen', {
                        finishScreenParam: {
                            selectedCryptocurrency: this.props.sendStore.data.cryptocurrency
                        }
                    })
                } else {
                    NavStore.goBack(null)
                }
            })

        } catch (e) {

            hideModal()

            Log.err('Send.ConfirmModal.handleSend ' + e.message)

            Keyboard.dismiss()

            showModal({
                type: 'INFO_MODAL',
                icon: false,
                title: strings('modal.send.fail'),
                description: typeof e.code != 'undefined' ? strings(`send.errors.${e.message}`, { symbol: typeof extend.addressCurrencyCode == "undefined" ? extend.currencySymbol : extend.addressCurrencyCode }) : e.message,
                error: e
            })
        }

    }

    render() {
        const { show } = this.props
        const { amount, address, account, cryptocurrency, wallet, type } = this.props.data.data
        const { currencySymbol } = cryptocurrency
        const { currency_rate_usd } = cryptocurrency
        const { localCurrencySymbol } = this.props.fiatRatesStore

        const equivalent = FiatRatesActions.toLocalCurrency(amount * currency_rate_usd)

        return (
            <Modal style={styles.modal} hasBackdrop={false} isVisible={show}>

                <View style={styles.content}>
                    <KeyboardAwareView>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <View style={{
                                justifyContent: 'center',
                                minHeight: WINDOW_HEIGHT - 140}}>
                                <View style={{
                                    backgroundColor: '#fff',
                                    borderRadius: 14,
                                    shadowColor: '#000',
                                    shadowOffset: {
                                        width: 0,
                                        height: 2
                                    },
                                    shadowOpacity: 0.23,
                                    shadowRadius: 2.62,

                                    elevation: 4 }
                                }>
                                    <GradientView style={styles.bg} array={styles_.array} start={styles_.start} end={styles_.end}>
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
                                            sendData={this.props.data.data}
                                        />
                                    </GradientView>
                                    <View style={styles.bottom}>
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
                                            styleText={i18n.locale == 'ru-RU' ? { fontSize: 16 } : null}>
                                            {strings('send.confirmModal.confirm')}
                                        </Button>
                                    </View>
                                </View>
                            </View>
                        </ScrollView>
                    </KeyboardAwareView>
                </View>

            </Modal>
        )
    }
}

const styles_ = {
    array: ['#43156d', '#7127ab'],
    start: { x: 0.0, y: 0.5 },
    end: { x: 1, y: 0.5 }
}


const mapStateToProps = (state) => {
    return {
        sendStore: state.sendStore,
        fiatRatesStore: state.fiatRatesStore
    }
}

export default connect(mapStateToProps, {}, null, { forwardRef: true })(ConfirmModal)
