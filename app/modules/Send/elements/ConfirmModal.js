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

const { width: WIDTH, height: WINDOW_HEIGHT } = Dimensions.get('window')


export class ConfirmModal extends Component {

    constructor(props) {
        super(props)
    }

    componentWillMount() {

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
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }

            MarketingEvent.checkSellSendTx(transaction)

            await transactionActions.saveTransaction(transaction)

            hideModal()

            showModal({
                type: 'INFO_MODAL',
                icon: true,
                title: strings('modal.send.success'),
                description: strings('modal.send.txSuccess')
            }, () => {
                NavStore.goBack(null)
            })

        } catch (e) {

            hideModal()

            Log.err('Send.ConfirmModal.handleSend', e)

            Keyboard.dismiss()

            showModal({
                type: 'INFO_MODAL',
                icon: false,
                title: strings('modal.send.fail'),
                description: e.message,
                error: e
            })
        }

    }

    render() {
        const { show } = this.props
        const { amount, address, account, cryptocurrency, wallet } = this.props.data.data
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

                                                <Text style={styles.content__subtext}>
                                                    { localCurrencySymbol } { equivalent }
                                                </Text>

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
                                            styleText={i18n.locale == 'ru-RU' ? { fontSize: 16 } : null}>
                                            {strings('send.confirmModal.edit')}
                                        </ButtonLine>
                                        <Button
                                            press={() => this.handleSend()}
                                            styles={styles.btn}
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
        fiatRatesStore: state.fiatRatesStore
    }
}

export default connect(mapStateToProps, {}, null, { forwardRef: true })(ConfirmModal)

const styles = {
    modal: {
        position: 'absolute',
        top: 0,
        left: 0,
        // width: WIDTH - 40,
        height: '100%',
        paddingLeft: 10,
        paddingRight: 10,
        justifyContent: 'center',
        zIndex: 10000
    },
    content: {
        flex: 1,
    },
    top: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 12
    },
    title: {
        marginBottom: 5,
        width: WIDTH < 410 ? 180 : '100%',
        fontFamily: 'SFUIDisplay-Semibold',
        fontSize: 18,
        textAlign: 'center',
        color: '#f4f4f4'
    },
    bg: {
        flex: 1,
        position: 'relative',
        alignItems: 'center',
        borderTopLeftRadius: 14,
        borderTopRightRadius: 14,
        zIndex: 100
    },
    cross: {
        position: 'absolute',
        top: 10,
        right: 10
    },
    icon: {
        width: 230,
        height: 220,
        marginTop: 10,
        marginBottom: 10
    },
    text: {
        paddingLeft: 15,
        paddingRight: 15,
        marginBottom: 10,
        fontFamily: 'SFUIDisplay-Regular',
        fontSize: 14,
        color: '#f4f4f4'
    },
    bottom: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingLeft: 15,
        paddingRight: 15,
        paddingTop: 22,
        paddingBottom: 22,
        marginTop: 'auto',
        backgroundColor: '#fff',
        borderBottomLeftRadius: 14,
        borderBottomRightRadius: 14
    },
    btn: {
        width: 122
    },
    box: {
        alignItems: 'center'
    },
    box__line: {
        width: 200,
        height: 1,
        marginBottom: 15,
        backgroundColor: '#6B3CA7'
    },
    content__title: {
        marginTop: 20,
        fontFamily: 'SFUIDisplay-Regular',
        fontSize: 19,
        textAlign: 'center',
        color: '#f4f4f4'
    },
    content__text: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center'
    },
    content__text_first: {
        marginBottom: 6,
        fontFamily: 'SFUIDisplay-Regular',
        fontSize: 36,
        color: '#f4f4f4'
    },
    content__text_last: {
        fontFamily: 'SFUIDisplay-Regular',
        fontSize: 24,
        color: '#f4f4f4'
    },
    content__subtext: {
        marginTop: -5,
        marginBottom: 15,
        fontFamily: 'SFUIDisplay-Regular',
        fontSize: 16,
        color: '#f4f4f4'
    },
    description: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        paddingLeft: 15,
        paddingRight: 15,

        alignItems: 'center'
    },
    description__text: {
        fontFamily: 'SFUIDisplay-Regular',
        fontSize: 14,
        color: '#e3e3e3'
    },
    description__line: {
        height: 22,
        width: 1,
        backgroundColor: '#864dd9'
    }
}

/*
 <Image
                            style={ styles.icon }
                            resizeMode='contain'
                            source={require('../../../assets/images/congratsIcon.png')}/>
                               <Text style={styles.content__title}>
                                { strings('send.confirmModal.amount') }
                            </Text>
 */
