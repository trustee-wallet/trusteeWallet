/**
 * @version 0.9
 */
import React, { Component } from 'react'

import { connect } from 'react-redux'

import { Dimensions, Text, TouchableOpacity, View, Animated, Keyboard, ScrollView } from 'react-native'

import AntDesing from 'react-native-vector-icons/AntDesign'

import GradientView from '../../../components/elements/GradientView'

import CustomFee from './customfee/CustomFee'

import { setLoaderStatus } from '../../../appstores/Stores/Main/MainStoreActions'
import { showModal } from '../../../appstores/Stores/Modal/ModalActions'

import BlocksoftTransfer from '../../../../crypto/actions/BlocksoftTransfer/BlocksoftTransfer'
import BlocksoftPrettyNumbers from '../../../../crypto/common/BlocksoftPrettyNumbers'

import { strings } from '../../../services/i18n'
import Log from '../../../services/Log/Log'

import Theme from '../../../themes/Themes'
import prettyNumber from '../../../services/UI/PrettyNumber/PrettyNumber'

let styles

const { width: WINDOW_WIDTH } = Dimensions.get('window')


class Fee extends Component {

    constructor(props) {
        super(props)
        this.state = {
            feeList: [],
            fee: {},
            customFee: {},
            estimate: 0,
            status: 'none',

            ifCustomFee: false,
            ifShowFee: false,
            customFeeAnimation: new Animated.Value(0)
        }

        this.customFee = React.createRef()

    }

    // eslint-disable-next-line camelcase
    async UNSAFE_componentWillMount() {

        styles = Theme.getStyles().sendScreenStyles.feeStyles

        // setLoaderStatus(true)

        // maybe from ratesService as its already cached
        const { walletHash } = this.props.wallet

        const { address, currencyCode, derivationPath } = this.props.account

        const { sendData } = this.props

        const derivationPathTmp = derivationPath.replace(/quote/g, '\'')

        try {

            const addressTo = sendData.address ? sendData.address : address
            let fees
            if (sendData.useAllFunds) {
                fees = await (
                    BlocksoftTransfer.setCurrencyCode(currencyCode)
                        .setWalletHash(walletHash)
                        .setDerivePath(derivationPathTmp)
                        .setAddressFrom(address)
                        .setAddressTo(addressTo)
                        .setMemo(sendData.memo)
                        .setAmount(sendData.amountRaw)
                        .setTransferAll(true)
                ).getFeeRate()
            } else {

                fees = await (
                    BlocksoftTransfer.setCurrencyCode(currencyCode)
                        .setWalletHash(walletHash)
                        .setDerivePath(derivationPathTmp)
                        .setAddressFrom(address)
                        .setAddressTo(addressTo)
                        .setMemo(sendData.memo)
                        .setAmount(sendData.amountRaw)
                ).getFeeRate()
            }

            Log.log('Send.Fee.UNSAFE_componentWillMount fees', fees)

            if (fees) {

                this.props.setParentState('feeList', fees)

                this.setState({
                    feeList: fees,
                    fee: fees[fees.length - 1],
                    status: 'success'
                })
            }

        } catch (e) {
            Log.errorTranslate(e, 'Send.Fee.UNSAFE_componentWillMount', currencyCode)

            this.setState({
                status: 'fail'
            })

            showModal({
                type: 'INFO_MODAL',
                icon: null,
                title: strings('modal.exchange.sorry'),
                description: e.message
            })
        }

        setLoaderStatus(false)
    }

    handleTransferAll = async (fee) => {

        const {
            address,
            currencyCode
        } = this.props.account

        const { sendData, setParentState } = this.props

        const tmpData = JSON.parse(JSON.stringify(sendData))

        try {

            const amountRaw = await (
                BlocksoftTransfer
                    .setCurrencyCode(currencyCode)
                    .setAddressFrom(address)
                    .setFee(fee)
            ).getTransferAllBalance()

            const amount = BlocksoftPrettyNumbers.setCurrencyCode(currencyCode).makePretty(amountRaw)

            tmpData.amount = amount
            tmpData.amountRaw = amountRaw


            setParentState('data', tmpData)

        } catch (e) {
            Log.errorTranslate(e, 'Send.Fee.handleTransferAll', currencyCode)

            Keyboard.dismiss()

            showModal({
                type: 'INFO_MODAL',
                icon: null,
                title: strings('modal.exchange.sorry'),
                description: e.message
            })
        }

    }

    getFee = async () => {
        return this.state.ifCustomFee ? this.getCustomFee() : this.state.fee
    }

    getCustomFee = () => {
        return this.customFee.handleGetCustomFee()
    }

    handleSelect = async (fee) => {

        const { useAllFunds } = this.props.sendData

        if (useAllFunds) {

            setLoaderStatus(true)

            await this.handleTransferAll(fee)

            setLoaderStatus(false)
        }

        this.setState({
            fee
        })
    }

    toggleCustomFee = () => {

        const { ifCustomFee } = this.state

        const position = !ifCustomFee ? -WINDOW_WIDTH : 0

        this.state.customFeeAnimation.setValue(!ifCustomFee ? 0 : -WINDOW_WIDTH)
        Animated.timing(this.state.customFeeAnimation, { toValue: position, duration: 99 }).start()

        this.setState({ ifCustomFee: !ifCustomFee })
    }

    toggleShowFee = () => {
        this.setState({
            ifShowFee: !this.state.ifShowFee
        })
    }

    render() {

        const { feeList, fee, status } = this.state
        const { currencySymbol, currencyCode } = this.props.cryptoCurrency

        const { basicCurrencySymbol, feesCurrencyCode, feesCurrencySymbol, feeRates } = this.props.account

        return feeList.length ? (
            <View style={styles.wrapper}>
                <View style={styles.fee__top}>
                    <TouchableOpacity
                        style={{ flex: 1, height: 40, paddingLeft: 15, justifyContent: 'center' }}
                        onPress={() => this.toggleShowFee()}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={styles.fee__title}>{strings('send.fee.title')}</Text>
                            <View style={{ marginLeft: 5, marginBottom: this.state.ifShowFee ? -5 : 0 }}>
                                <AntDesing name={this.state.ifShowFee ? 'caretup' : 'caretdown'} size={13} color="#f4f4f4"/>
                            </View>
                        </View>
                    </TouchableOpacity>
                    {
                        this.state.ifShowFee ?
                            <TouchableOpacity
                                style={{ height: 40, paddingRight: 15, justifyContent: 'center' }}
                                onPress={() => this.toggleCustomFee()}>
                                <View>
                                    {
                                        !this.state.ifCustomFee ?
                                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                <Text style={styles.fee__title}>
                                                    {strings('send.fee.customFee.customFeeTitle')}
                                                </Text>
                                                <View style={{ marginLeft: 3, marginTop: 1 }}>
                                                    <AntDesing name="right" size={14} color="#f4f4f4"/>
                                                </View>
                                            </View>
                                            :
                                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                <View style={{ marginRight: 3, marginTop: 1 }}>
                                                    <AntDesing name="left" size={14} color="#f4f4f4"/>
                                                </View>
                                                <Text style={styles.fee__title}>
                                                    {strings('send.fee.customFee.fixedFeeTitle')}
                                                </Text>
                                            </View>
                                    }
                                </View>

                            </TouchableOpacity> : null
                    }

                </View>
                <View style={!this.state.ifShowFee ? styles.fee__content__wrap_hidden : styles.fee__content__wrap}>
                    <Animated.View style={{ ...styles.fee__content, transform: [{ translateX: this.state.customFeeAnimation }] }}>
                        {
                            status === 'success' ? feeList.map((item, index) => {

                                let prettyFee
                                let prettyFeeSymbol = feesCurrencySymbol
                                let feeBasicCurrencySymbol = basicCurrencySymbol
                                let feeBasicAmount = 0

                                if (typeof item.feeForTxDelegated !== 'undefined') {
                                    prettyFeeSymbol = currencySymbol
                                    prettyFee = item.feeForTxCurrencyAmount
                                    feeBasicAmount = prettyNumber(item.feeForTxBasicAmount, 2)
                                    feeBasicCurrencySymbol = item.feeForTxBasicSymbol
                                } else {
                                    prettyFee = BlocksoftPrettyNumbers.setCurrencyCode(feesCurrencyCode).makePretty(item.feeForTx)
                                    feeBasicAmount = prettyNumber(prettyFee * feeRates.basicCurrencyRate, 2)
                                }

                                return (
                                    <View style={styles.fee__wrap} key={index}>
                                        <TouchableOpacity
                                            onPress={() => this.handleSelect(item)}
                                            disabled={fee.langMsg === item.langMsg}
                                            style={styles.fee__item}>
                                            <GradientView
                                                style={styles.fee__circle}
                                                array={fee.langMsg === item.langMsg ? stylesActive.array : styles_.array}
                                                start={styles_.start}
                                                end={styles_.end}>
                                            </GradientView>
                                            <View style={styles.fee__item__content}>
                                                <View style={styles.fee__item__top}>
                                                    <Text style={{ ...styles.fee__item__title, color: fee.langMsg === item.langMsg ? '#efa1ae' : '#f4f4f4' }}>
                                                        {strings(`send.fee.text.${item.langMsg}`, { symbol: prettyFeeSymbol })}
                                                    </Text>
                                                </View>
                                                <Text style={{ ...styles.fee__item__top__text, color: fee.langMsg === item.langMsg ? '#efa1ae' : '#f4f4f4' }}>
                                                    {strings(`send.fee.time.${item.langMsg}`, { symbol: prettyFeeSymbol })}
                                                </Text>
                                                <Text style={{ ...styles.fee__item__top__text, color: fee.langMsg === item.langMsg ? '#efa1ae' : '#e3e3e3' }}>
                                                    {prettyFee} {prettyFeeSymbol} ({feeBasicCurrencySymbol} {feeBasicAmount} )
                                                </Text>
                                            </View>
                                        </TouchableOpacity>
                                        {feeList.length - 1 !== index ? <View style={styles.fee__divider}/> : null}
                                    </View>
                                )
                            }) : null
                        }
                        {
                            status == 'fail' ? <Text> Error </Text> : null
                        }
                    </Animated.View>
                    <Animated.View style={{ ...styles.fee__content, transform: [{ translateX: this.state.customFeeAnimation }] }}>
                        <CustomFee
                            ref={ref => this.customFee = ref}
                            currencyCode={currencyCode}
                            fee={this.state.fee}
                            handleTransferAll={this.handleTransferAll}
                            useAllFunds={this.props.sendData.useAllFunds}/>
                    </Animated.View>
                </View>
            </View>
        ) : <View/>
    }
}

const mapStateToProps = (state) => {
    return {
        daemonStore: state.daemonStore
    }
}

export default connect(mapStateToProps, {}, null, { forwardRef: true })(Fee)

const styles_ = {
    array: ['#300f4d', '#300f4d'],
    start: { x: 0.0, y: 0.5 },
    end: { x: 1, y: 0.5 }
}

const stylesActive = {
    array: ['#b95f94', '#eba0ae'],
    start: { x: 0.0, y: 0.5 },
    end: { x: 1, y: 0.5 }
}
