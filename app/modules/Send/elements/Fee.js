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
import AsyncStorage from '@react-native-community/async-storage'
import RateEquivalent from '../../../services/UI/RateEquivalent/RateEquivalent'
import BlocksoftUtils from '../../../../crypto/common/BlocksoftUtils'

let styles

const { width: WINDOW_WIDTH } = Dimensions.get('window')

let CACHE_MULTI = false

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
            ifShowFee: true,
            devMode: false,
            customFeeAnimation: new Animated.Value(0)
        }

        this.customFee = React.createRef()

    }

    // eslint-disable-next-line camelcase
    async UNSAFE_componentWillMount() {
        styles = Theme.getStyles().sendScreenStyles.feeStyles
        CACHE_MULTI = 1
        await this.init(false)
    }

    async init(multiply, amountRaw = false) {
        // setLoaderStatus(true)

        // maybe from ratesService as its already cached
        const { walletHash } = this.props.wallet

        const { address, currencyCode, derivationPath } = this.props.account

        const { sendData } = this.props

        const derivationPathTmp = derivationPath.replace(/quote/g, '\'')

        let feesAmountRaw = sendData.amountRaw
        if (typeof amountRaw !== 'undefined' && amountRaw) {
            feesAmountRaw = amountRaw
        }
        try {

            const addressTo = sendData.address ? sendData.address : address
            let fees
            let showFees = multiply

            if (typeof sendData.transactionReplaceByFee !== 'undefined') {
                try {
                    fees = await (
                        BlocksoftTransfer.setCurrencyCode(currencyCode)
                            .setWalletHash(walletHash)
                            .setDerivePath(derivationPathTmp)
                            .setAddressFrom(address)
                            .setAddressTo(addressTo)
                            .setMemo(sendData.memo)
                            .setAmount(feesAmountRaw)
                            .setTxHash(sendData.transactionReplaceByFee)
                            .setAdditional(sendData.toTransactionJSON)
                            .setMultiply(multiply || 0)
                    ).getFeeRate()
                } catch (e) {
                    if (e.message.indexOf('SERVER_RESPONSE') === -1) {
                        e.message += ' while getFeeRate RBF ' + currencyCode + ' address ' + address + ' amountRaw ' + sendData.amountRaw
                    }
                    throw e
                }
                showFees = true
            } else if (typeof sendData.transactionSpeedUp !== 'undefined') {
                try {
                    fees = await (
                        BlocksoftTransfer.setCurrencyCode(currencyCode)
                            .setWalletHash(walletHash)
                            .setDerivePath(derivationPathTmp)
                            .setAddressFrom(address)
                            .setAddressTo(addressTo)
                            .setMemo(sendData.memo)
                            .setAmount(feesAmountRaw)
                            .setTxInput(sendData.transactionSpeedUp)
                            .setMultiply(multiply || 0)
                    ).getFeeRate()
                } catch (e) {
                    if (e.message.indexOf('SERVER_RESPONSE') === -1) {
                        e.message += ' while SpeedUp getFeeRate ' + currencyCode + ' address ' + address + ' amountRaw ' + sendData.amountRaw
                    }
                    throw e
                }
                showFees = true
            } else if (sendData.useAllFunds) {
                try {
                    fees = await (
                        BlocksoftTransfer.setCurrencyCode(currencyCode)
                            .setWalletHash(walletHash)
                            .setDerivePath(derivationPathTmp)
                            .setAddressFrom(address)
                            .setAddressTo(addressTo)
                            .setMemo(sendData.memo)
                            .setAmount(feesAmountRaw)
                            .setTransferAll(true)
                            .setMultiply(multiply || 0)
                    ).getFeeRate()
                } catch (e) {
                    if (e.message.indexOf('SERVER_') === -1) {
                        e.message += ' while SendAll getFeeRate ' + currencyCode + ' address ' + address + ' amountRaw ' + sendData.amountRaw
                    }
                    throw e
                }
            } else {
                try {
                    fees = await (
                        BlocksoftTransfer.setCurrencyCode(currencyCode)
                            .setWalletHash(walletHash)
                            .setDerivePath(derivationPathTmp)
                            .setAddressFrom(address)
                            .setAddressTo(addressTo)
                            .setMemo(sendData.memo)
                            .setAmount(feesAmountRaw)
                            .setMultiply(multiply || 0)
                    ).getFeeRate()
                } catch (e) {
                    if (e.message.indexOf('SERVER_') === -1) {
                        e.message += ' while Send getFeeRate ' + currencyCode + ' address ' + address + ' amountRaw ' + sendData.amountRaw
                    }
                    throw e
                }
            }


            Log.log('Send.Fee.UNSAFE_componentWillMount fees', fees)

            if (fees) {
                let lastFee = fees[fees.length - 1]
                if (sendData.useAllFunds && fees.length > 1 && lastFee && lastFee.langMsg.indexOf('corrected') !== -1) {
                    lastFee = fees[fees.length - 2]
                    showFees = true
                }

                if (!showFees) {
                    if (lastFee && lastFee.langMsg.indexOf('_speed_blocks_2') === -1 && lastFee.langMsg.indexOf('_speed_fast') === -1) {
                        showFees = true
                    }
                }

                // if (showFees) {
                //     this.setState({
                //         ifShowFee: true
                //     })
                // }

                if (!fees || fees === null) {
                    fees = false
                }
                this.props.setParentState('feeList', fees)

                const devMode = await AsyncStorage.getItem('devMode')
                this.setState({
                    feeList: fees,
                    devMode: devMode && devMode.toString() === '1',
                    fee: lastFee,
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
                    .setTransferAll(true)
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

    multiplyFee = async () => {
        const {
            currencyCode
        } = this.props.account
        const x = currencyCode === 'DOGE' ? 5 : 2
        if (currencyCode === 'DOGE' && CACHE_MULTI === 1) {
            CACHE_MULTI = 25
        } else {
            CACHE_MULTI = CACHE_MULTI * x
        }
        return this.init(CACHE_MULTI)
    }

    changeAmountRaw = async (amountRaw) => {
        return this.init(false, amountRaw)
    }

    getFee = async () => {
        return this.state.ifCustomFee ? this.getCustomFee() : this.state.fee
    }

    getCustomFee = () => {
        return this.customFee.handleGetCustomFee()
    }

    handleSelect = async (fee) => {

        const { useAllFunds } = this.props.sendData

        const { setParentState } = this.props

        if (useAllFunds) {

            setLoaderStatus(true)

            await this.handleTransferAll(fee)
            setParentState('selectedFee', fee)

            setLoaderStatus(false)
        } else {
            setParentState('selectedFee', fee)
        }

        this.setState({
            fee
        })
    }

    handleSelectLongPress = async (fee) => {
        showModal({
            type: 'INFO_MODAL',
            icon: 'INFO',
            title: 'SYSTEM_LOG',
            description: JSON.stringify(fee)
        })
    }

    toggleCustomFee = () => {

        const { ifCustomFee } = this.state
        const { setParentState } = this.props

        const position = !ifCustomFee ? -WINDOW_WIDTH : 0

        this.state.customFeeAnimation.setValue(!ifCustomFee ? 0 : -WINDOW_WIDTH)
        Animated.timing(this.state.customFeeAnimation, { toValue: position, duration: 99 }).start()

        setParentState('selectedCustomFee', !ifCustomFee)

        this.setState({ ifCustomFee: !ifCustomFee })
    }

    // toggleShowFee = () => {
    //     this.setState({
    //         ifShowFee: !this.state.ifShowFee
    //     })
    // }

    render() {

        const { feeList, fee, status, devMode } = this.state
        const { currencySymbol, currencyCode } = this.props.cryptoCurrency

        const { basicCurrencySymbol, feesCurrencyCode, feesCurrencySymbol, feeRates } = this.props.account

        let showSmallFeeNotice = false
        if (feeList && feeList.length > 0) {
            showSmallFeeNotice = typeof feeList[feeList.length - 1].showSmallFeeNotice !== 'undefined'
        }
        return feeList.length ? (
            <View style={styles.wrapper}>
                <View style={styles.fee__top}>
                    <View
                        style={{ flex: 1, height: 40, paddingLeft: 15, justifyContent: 'center' }}>
                        {/* onPress={() => this.toggleShowFee()}> */}
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={styles.fee__title}>{strings('send.fee.title')}</Text>
                            <View style={{ marginLeft: 5, marginBottom: -5 }}>
                                {/* <AntDesing name={this.state.ifShowFee ? 'caretup' : 'caretdown'} size={13} */}
                                <AntDesing name={'caretdown'} size={13}
                                           color="#f4f4f4"/>
                            </View>
                        </View>
                    </View>
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
                    <Animated.View
                        style={{ ...styles.fee__content, transform: [{ translateX: this.state.customFeeAnimation }] }}>
                        {
                            status === 'success' ? feeList.map((item, index) => {

                                let prettyFee
                                let prettyFeeSymbol = feesCurrencySymbol
                                let feeBasicCurrencySymbol = basicCurrencySymbol
                                let feeBasicAmount = 0

                                if (typeof item.feeForTxDelegated !== 'undefined') {
                                    prettyFeeSymbol = currencySymbol
                                    prettyFee = item.feeForTxCurrencyAmount
                                    feeBasicAmount = BlocksoftPrettyNumbers.makeCut(item.feeForTxBasicAmount, 2).justCutted
                                    feeBasicCurrencySymbol = item.feeForTxBasicSymbol
                                } else {
                                    prettyFee = BlocksoftPrettyNumbers.setCurrencyCode(feesCurrencyCode).makePretty(item.feeForTx)
                                    feeBasicAmount = BlocksoftPrettyNumbers.makeCut(RateEquivalent.mul({
                                        value: prettyFee,
                                        currencyCode: feesCurrencyCode,
                                        basicCurrencyRate: feeRates.basicCurrencyRate
                                    }), 2).justCutted
                                    prettyFee = BlocksoftPrettyNumbers.makeCut(prettyFee, 5).justCutted
                                }
                                let devFee = false
                                let needSpeed = item.needSpeed || false
                                if (typeof item.feeForByte !== 'undefined') {
                                    devFee = item.feeForByte + ' sat/B '
                                    if (needSpeed) {
                                        needSpeed = ' rec. ' + needSpeed + ' sat/B'
                                    }
                                } else if (typeof item.gasPrice !== 'undefined') {
                                    devFee = BlocksoftPrettyNumbers.makeCut(BlocksoftUtils.toGwei(item.gasPrice),2).justCutted + ' gwei/gas '
                                    if (needSpeed) {
                                        needSpeed = ' rec. ' + BlocksoftPrettyNumbers.makeCut(BlocksoftUtils.toGwei(needSpeed), 2).justCutted + ' gwei/gas'
                                    }
                                }

                                if (!needSpeed) {
                                    needSpeed = ''
                                }

                                // console.log('p ' + prettyFee + ' * ' + feeRates.basicCurrencyRate + ' => ' + feeBasicAmount )


                                return (
                                    <View style={styles.fee__wrap} key={index}>
                                        <TouchableOpacity
                                            onPress={() => this.handleSelect(item)}
                                            onLongPress={() => this.handleSelectLongPress(item)} delayLongPress={5000}
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
                                                    <Text style={{
                                                        ...styles.fee__item__title,
                                                        color: fee.langMsg === item.langMsg ? '#efa1ae' : '#f4f4f4'
                                                    }}>
                                                        {strings(`send.fee.text.${item.langMsg}`, { symbol: prettyFeeSymbol })}
                                                    </Text>
                                                </View>
                                                <Text style={{
                                                    ...styles.fee__item__top__text,
                                                    color: fee.langMsg === item.langMsg ? '#efa1ae' : '#f4f4f4'
                                                }}>
                                                    {strings(`send.fee.time.${item.langMsg}`, { symbol: prettyFeeSymbol })}
                                                </Text>
                                                <Text style={{
                                                    ...styles.fee__item__top__text,
                                                    color: fee.langMsg === item.langMsg ? '#efa1ae' : '#e3e3e3'
                                                }}>
                                                    {prettyFee} {prettyFeeSymbol} ({feeBasicCurrencySymbol} {feeBasicAmount})
                                                    {devFee ?
                                                        (' ' + devFee + (devMode ? needSpeed : ''))
                                                        : ''}
                                                </Text>
                                            </View>
                                        </TouchableOpacity>
                                        {feeList.length - 1 !== index || showSmallFeeNotice ?
                                            <View style={styles.fee__divider}/> : null}
                                    </View>
                                )
                            }) : null
                        }
                        {
                            status === 'fail' ? <Text> Error </Text> : null
                        }
                        {
                            showSmallFeeNotice ? <View style={styles.fee__wrap}>
                                <TouchableOpacity
                                    disabled={true}
                                    style={styles.fee__item}
                                >
                                    <GradientView
                                        style={styles.fee__circle}
                                        array={styles_.array}
                                        start={styles_.start}
                                        end={styles_.end}>
                                    </GradientView>
                                    <View style={styles.fee__item__content}>
                                        <View style={styles.fee__item__top}>
                                            <Text style={{
                                                ...styles.fee__item__title,
                                                color: '#f4f4f4'
                                            }}>
                                                {strings(`send.fee.smallFeeNoticeTitle`)}
                                            </Text>
                                        </View>

                                        <Text style={{
                                            ...styles.fee__item__top__text,
                                            color: '#f4f4f4'
                                        }}>
                                            {strings(`send.fee.smallFeeNoticeDesc`)}
                                        </Text>

                                    </View>
                                </TouchableOpacity>
                            </View> : null
                        }
                    </Animated.View>
                    <Animated.View
                        style={{ ...styles.fee__content, transform: [{ translateX: this.state.customFeeAnimation }] }}>
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
