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

import { BlocksoftTransfer } from '../../../../crypto/actions/BlocksoftTransfer/BlocksoftTransfer'
import BlocksoftPrettyNumbers from '../../../../crypto/common/BlocksoftPrettyNumbers'

import { strings } from '../../../services/i18n'
import Log from '../../../services/Log/Log'

import Theme from '../../../themes/Themes'
import AsyncStorage from '@react-native-community/async-storage'
import RateEquivalent from '../../../services/UI/RateEquivalent/RateEquivalent'
import BlocksoftUtils from '../../../../crypto/common/BlocksoftUtils'
import config from '../../../config/config'

let styles

const { width: WINDOW_WIDTH } = Dimensions.get('window')

class Fee extends Component {

    constructor(props) {
        super(props)
        this.state = {
            countedFees : {
                fees : [],
                feesCountedForData : false
            },

            fee: {},

            ifCustomFee: false,
            customFee: {},
            status: 'none',

            devMode: false,

            customFeeAnimation: new Animated.Value(0)
        }

        this.customFee = React.createRef()

    }

    // eslint-disable-next-line camelcase
    async UNSAFE_componentWillMount() {
        styles = Theme.getStyles().sendScreenStyles.feeStyles
        await this.init()
    }

    async init() {

        const { walletHash, walletUseUnconfirmed, walletAllowReplaceByFee, walletUseLegacy, walletIsHd } = this.props.wallet

        const { address, currencyCode, derivationPath, accountJson } = this.props.account

        const { sendData } = this.props

        let countedFees = false
        try {

            if (typeof sendData.countedFees !== 'undefined' && sendData.countedFees && sendData.countedFees.fees.length > 0) {
                countedFees = sendData.countedFees
            } else {
                const countedFeesData = {
                    currencyCode,
                    walletHash,
                    derivationPath,
                    addressFrom: address,
                    addressTo: sendData.address,
                    amount: sendData.amountRaw,
                    isTransferAll: false,
                    useOnlyConfirmed : !(walletUseUnconfirmed === 1),
                    allowReplaceByFee : walletAllowReplaceByFee === 1,
                    useLegacy : walletUseLegacy,
                    isHd : walletIsHd,
                    transactionReplaceByFee : sendData.transactionReplaceByFee,
                    transactionSpeedUp : sendData.transactionSpeedUp,
                    transactionJson : sendData.toTransactionJSON,
                    accountJson
                }
                countedFees = await BlocksoftTransfer.getFeeRate(countedFeesData)
                countedFees.feesCountedForData = countedFeesData
            }

            const devMode = await AsyncStorage.getItem('devMode')
            if (typeof countedFees.selectedFeeIndex !== 'undefined' && countedFees.selectedFeeIndex >= 0) {
                const fee = countedFees.fees[countedFees.selectedFeeIndex]
                this.setState({
                    countedFees,
                    devMode: devMode && devMode.toString() === '1',
                    fee,
                    status: 'success'
                })
                if (typeof fee.blockchainData !== 'undefined'
                    && typeof fee.blockchainData.preparedInputsOutputs !== 'undefined'
                    && typeof fee.blockchainData.preparedInputsOutputs.multiAddress !== 'undefined'
                    && typeof fee.blockchainData.preparedInputsOutputs.multiAddress[0] !== 'undefined'
                ) {
                    await this.handleSelectUpdateAmount(fee, fee.blockchainData.preparedInputsOutputs.multiAddress)
                } else if (fee.amountForTx !== sendData.amountRaw) {
                    await this.handleSelectUpdateAmount(fee, false)
                }
            }

        } catch (e) {
            if (config.debug.appErrors) {
                console.log('Send.Fee.UNSAFE_componentWillMount error', e, countedFees)
            }
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

    handleSelectUpdateAmount = async (fee, multiAddress) => {

        const { currencyCode } = this.props.account
        const { sendData, setParentState } = this.props

        const tmpData = JSON.parse(JSON.stringify(sendData))
        if (typeof fee.amountForTx === 'undefined') {
            return false
        }

        try {

            const amount = BlocksoftPrettyNumbers.setCurrencyCode(currencyCode).makePretty(fee.amountForTx)

            tmpData.amount = amount
            tmpData.amountRaw = fee.amountForTx
            tmpData.multiAddress = multiAddress


            setParentState('data', tmpData)

        } catch (e) {
            if (config.debug.appErrors) {
                console.log('Send.Fee.handleTransferAll', e.message, JSON.parse(JSON.stringify(fee)))
            }
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

    changeAmountRaw = async (amountRaw) => {
        console.log('changeAmountRaw todo')
    }

    getFee = async () => {
        return this.state.ifCustomFee ? this.getCustomFee() : this.state.fee
    }

    getCustomFee = () => {
        return this.customFee.handleGetCustomFee()
    }

    handleSelect = async (fee) => {

        const { useAllFunds, amountRaw } = this.props.sendData

        const { setParentState } = this.props

        if (useAllFunds || amountRaw !== fee.amountForTx) {

            setLoaderStatus(true)

            await this.handleSelectUpdateAmount(fee)
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

    render() {

        const { countedFees, fee, status, devMode } = this.state
        const { currencySymbol, currencyCode } = this.props.cryptoCurrency

        const { basicCurrencySymbol, feesCurrencyCode, feesCurrencySymbol, feeRates } = this.props.account

        return countedFees.fees.length ? (
            <View style={styles.wrapper}>
                <View style={styles.fee__top}>
                    <View
                        style={{ flex: 1, height: 40, paddingLeft: 15, justifyContent: 'center' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={styles.fee__title}>{strings('send.fee.title')}</Text>
                            <View style={{ marginLeft: 5, marginBottom: -5 }}>
                                <AntDesing name={'caretdown'} size={13}
                                           color="#f4f4f4" />
                            </View>
                        </View>
                    </View>

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
                                            <AntDesing name="right" size={14} color="#f4f4f4" />
                                        </View>
                                    </View>
                                    :
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <View style={{ marginRight: 3, marginTop: 1 }}>
                                            <AntDesing name="left" size={14} color="#f4f4f4" />
                                        </View>
                                        <Text style={styles.fee__title}>
                                            {strings('send.fee.customFee.fixedFeeTitle')}
                                        </Text>
                                    </View>
                            }
                        </View>

                    </TouchableOpacity>

                </View>
                <View style={styles.fee__content__wrap}>
                    <Animated.View
                        style={{ ...styles.fee__content, transform: [{ translateX: this.state.customFeeAnimation }] }}>
                        {
                            status === 'success' ? countedFees.fees.map((item, index) => {

                                let prettyFee
                                let prettyFeeSymbol = feesCurrencySymbol
                                let feeBasicCurrencySymbol = basicCurrencySymbol
                                let feeBasicAmount = 0

                                if (typeof item.feeForTxDelegated !== 'undefined') {
                                    prettyFeeSymbol = currencySymbol
                                    prettyFee = item.feeForTxCurrencyAmount
                                    feeBasicAmount = BlocksoftPrettyNumbers.makeCut(item.feeForTxBasicAmount, 5).justCutted
                                    feeBasicCurrencySymbol = item.feeForTxBasicSymbol
                                } else {
                                    prettyFee = BlocksoftPrettyNumbers.setCurrencyCode(feesCurrencyCode).makePretty(item.feeForTx)
                                    feeBasicAmount = BlocksoftPrettyNumbers.makeCut(RateEquivalent.mul({
                                        value: prettyFee,
                                        currencyCode: feesCurrencyCode,
                                        basicCurrencyRate: feeRates.basicCurrencyRate
                                    }), 5).justCutted
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
                                    devFee = BlocksoftPrettyNumbers.makeCut(BlocksoftUtils.toGwei(item.gasPrice), 2).justCutted + ' gwei/gas '
                                    if (needSpeed) {
                                        needSpeed = ' rec. ' + BlocksoftPrettyNumbers.makeCut(BlocksoftUtils.toGwei(needSpeed), 2).justCutted + ' gwei/gas'
                                    }
                                }

                                if (!needSpeed) {
                                    needSpeed = ''
                                }

                                // console.log('p ' + prettyFee + ' * ' + feeRates.basicCurrencyRate + ' => ' + feeBasicAmount )


                                const timeMsg = strings(`send.fee.time.${item.langMsg}`, { symbol: prettyFeeSymbol })
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
                                                {timeMsg && timeMsg !== '' ?
                                                    <Text style={{
                                                        ...styles.fee__item__top__text,
                                                        color: fee.langMsg === item.langMsg ? '#efa1ae' : '#f4f4f4'
                                                    }}>
                                                        {timeMsg}
                                                    </Text> : null}
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
                                        {countedFees.fees.length - 1 !== index || countedFees.showSmallFeeNotice || countedFees.showChangeAmountNotice ?
                                            <View style={styles.fee__divider} /> : null}
                                    </View>
                                )
                            }) : null
                        }
                        {
                            status === 'fail' ? <Text> Error </Text> : null
                        }
                        {
                            countedFees.showSmallFeeNotice ? <View style={styles.fee__wrap}>
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

                        {
                            countedFees.showChangeAmountNotice ? <View style={styles.fee__wrap}>
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
                                            {strings(`send.fee.changeAmountNoticeDesc`)}
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
                            feesCurrencyCode={feesCurrencyCode}
                            fee={this.state.fee}
                            countedFees={countedFees}
                            basicCurrencySymbol={basicCurrencySymbol}
                            basicCurrencyRate={feeRates.basicCurrencyRate}
                            amountForTx={this.state.amountRaw}
                            handleSelectUpdateAmount={this.handleSelectUpdateAmount}
                            useAllFunds={this.props.sendData.useAllFunds}
                        />
                    </Animated.View>
                </View>
            </View>
        ) : <View />
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
