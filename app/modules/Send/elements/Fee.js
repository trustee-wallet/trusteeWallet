import React, { Component } from 'react'

import { connect } from 'react-redux'

import {
    Dimensions,
    Text,
    TouchableOpacity,
    View,
    Animated,
    Keyboard,
    ScrollView
} from 'react-native'

import AntDesing from 'react-native-vector-icons/AntDesign'

import GradientView from '../../../components/elements/GradientView'

import CustomFee from './customfee/CustomFee'

import { setLoaderStatus } from '../../../appstores/Actions/MainStoreActions'
import { showModal } from '../../../appstores/Actions/ModalActions'

import BlocksoftTransfer from '../../../../crypto/actions/BlocksoftTransfer/BlocksoftTransfer'
import BlocksoftPrettyNumbers from '../../../../crypto/common/BlocksoftPrettyNumbers'

import { strings } from '../../../services/i18n'
import Log from '../../../services/Log/Log'

import FiatRatesActions from '../../../appstores/Actions/FiatRatesActions'

import Theme from '../../../themes/Themes'
import utils from '../../../services/utils'
let styles

const { width: WINDOW_WIDTH } = Dimensions.get('window')


class Fee extends Component {

    constructor(props) {
        super(props)
        this.state = {
            rateBTC: 0,
            rateETH : 0,
            feeList: [],
            fee: {},
            customFee: {},
            estimate: 0,
            status: 'none',

            ifCustomFee: false,
            ifShowFee: false,
            customFeeAnimation: new Animated.Value(0),
        }

        this.customFee = React.createRef()

    }

    // eslint-disable-next-line camelcase
    async UNSAFE_componentWillMount() {

        styles = Theme.getStyles().sendScreenStyles.feeStyles

        // setLoaderStatus(true)

        // maybe from ratesService as its already cached
        let rateBTC = 0
        let rateETH = 0
        if (typeof this.props.daemonStore.currencyRateDaemonData !== 'undefined'
            && typeof this.props.daemonStore.currencyRateDaemonData.rates !== 'undefined'
            && typeof this.props.daemonStore.currencyRateDaemonData.rates.allData !== 'undefined'
            && typeof this.props.daemonStore.currencyRateDaemonData.rates.allData['BTC'] !== 'undefined') {
            if (this.props.daemonStore.currencyRateDaemonData.rates.allData['BTC']) {
                rateBTC = this.props.daemonStore.currencyRateDaemonData.rates.allData['BTC']
            }
            if (this.props.daemonStore.currencyRateDaemonData.rates.allData['ETH']) {
                rateETH = this.props.daemonStore.currencyRateDaemonData.rates.allData['ETH']
            }
        }


        this.setState({
            rateBTC,
            rateETH
        })

        const {
            wallet_hash: walletHash
        } = this.props.wallet

        const {
            address,
            currency_code: currencyCode,
            derivation_path: derivationPath
        } = this.props.account

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
                icon: false,
                title: 'Error',
                description: e.message
            })
        }

        setLoaderStatus(false)
    }

    handleTransferAll = async (fee) => {

        const {
            address,
            currency_code: currencyCode
        } = this.props.account

        const { sendData, setParentState } = this.props

        const tmpData = JSON.parse(JSON.stringify(sendData))

        try {

            let amountRaw = await (
                BlocksoftTransfer
                    .setCurrencyCode(currencyCode)
                    .setAddressFrom(address)
                    .setFee(fee)
            ).getTransferAllBalance()

            const amount = BlocksoftPrettyNumbers.setCurrencyCode(currencyCode).makePrettie(amountRaw)

            tmpData.amount = amount
            tmpData.amountRaw = amountRaw


            setParentState("data", tmpData)

        } catch (e) {
            Log.errorTranslate(e, 'Send.Fee.handleTransferAll', currencyCode)

            Keyboard.dismiss()

            showModal({
                type: 'INFO_MODAL',
                icon: false,
                title: 'Error',
                description: e.message
            })
        }

    }

    getFee = async () => {
        return this.state.ifCustomFee ? await this.getCustomFee() : this.state.fee
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
        Animated.timing( this.state.customFeeAnimation, { toValue: position, duration: 99}).start();

        this.setState({ ifCustomFee: !ifCustomFee })
    }

    toggleShowFee = () => {
        this.setState({
            ifShowFee: !this.state.ifShowFee
        })
    }

    render() {

        const { feeList, fee, status } = this.state
        const { currencySymbol, currency_rate_usd, currencyCode } = this.props.cryptocurrency
        const { localCurrencySymbol, localCurrencyRate } = this.props.fiatRatesStore

        let feeSymbol = currencySymbol
        let feeCurrencyCode = currencyCode
        let feeRate = currency_rate_usd
        if (this.props.cryptocurrency.feesCurrencyCode) {
            feeSymbol = this.props.cryptocurrency.feesCurrencyCode
            feeCurrencyCode = this.props.cryptocurrency.feesCurrencyCode
            if ( typeof(this.state['rate' +  feeCurrencyCode]) !== 'undefined' ) { // rateBTC, rateETH etc
                feeRate = this.state['rate' +  feeCurrencyCode]
            } else {
                feeRate = 0
            }
        }

        return (
            <View style={styles.wrapper}>
                <View style={styles.fee__top}>
                    <TouchableOpacity
                        style={{ flex: 1, height: 40, paddingLeft: 15, justifyContent: 'center' }}
                        onPress={() => this.toggleShowFee()}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={styles.fee__title}>{strings('send.fee.title')}</Text>
                            <View style={{ marginLeft: 5, marginBottom: this.state.ifShowFee ? -5 : 0 }}>
                                <AntDesing name={this.state.ifShowFee ? 'caretup' : 'caretdown'} size={13} color="#f4f4f4" />
                            </View>
                        </View>
                    </TouchableOpacity>
                    {
                        this.state.ifShowFee ?
                            <TouchableOpacity
                                style={{height: 40, paddingRight: 15, justifyContent: 'center' }}
                                onPress={() => this.toggleCustomFee()}>
                                <View>
                                    {
                                        !this.state.ifCustomFee ?
                                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                <Text style={styles.fee__title}>
                                                    { strings('send.fee.customFee.customFeeTitle') }
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
                                                    { strings('send.fee.customFee.fixedFeeTitle') }
                                                </Text>
                                            </View>
                                    }
                                </View>

                            </TouchableOpacity> : null
                    }

                </View>
                <View style={!this.state.ifShowFee ? styles.fee__content__wrap_hidden : styles.fee__content__wrap}>
                    <Animated.View style={{...styles.fee__content, transform: [{ translateX: this.state.customFeeAnimation }]}}>
                        {
                            status === 'success' ? feeList.map((item, index) => {

                                let prettieFee
                                let prettieFeeLocalCurrency = false
                                let prettieFeeSymbol = feeSymbol

                                let feeInUsd
                                if (typeof item.feeForTxDelegated !== 'undefined') {
                                    prettieFee = BlocksoftPrettyNumbers.setCurrencyCode(currencyCode).makePrettie(item.feeForTxDelegated)
                                    feeInUsd = item.feeForTxUsd
                                    prettieFeeSymbol = currencySymbol
                                    if (localCurrencyRate === 1 && currencyCode === 'ETH_UAX') {
                                        prettieFeeLocalCurrency = prettieFee
                                    }
                                } else {
                                    prettieFee = BlocksoftPrettyNumbers.setCurrencyCode(feeCurrencyCode).makePrettie(item.feeForTx)
                                    feeInUsd = prettieFee * feeRate
                                }

                                if (prettieFeeLocalCurrency === false) {
                                    // dont replace here on general plz
                                    prettieFeeLocalCurrency = FiatRatesActions.toLocalCurrency(feeInUsd, false)
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
                                                        {strings(`send.fee.text.${item.langMsg}`, { symbol: prettieFeeSymbol})}
                                                    </Text>
                                                </View>
                                                <Text style={{ ...styles.fee__item__top__text, color: fee.langMsg === item.langMsg ? '#efa1ae' : '#f4f4f4' }}>
                                                    {strings(`send.fee.time.${item.langMsg}`, { symbol: prettieFeeSymbol })}
                                                </Text>
                                                <Text style={{ ...styles.fee__item__top__text, color: fee.langMsg === item.langMsg ? '#efa1ae' : '#e3e3e3' }}>
                                                    {prettieFee} {prettieFeeSymbol} ({ localCurrencySymbol } { utils.prettierNumber(prettieFeeLocalCurrency, 2) } )
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
                    <Animated.View style={{...styles.fee__content, transform: [{ translateX: this.state.customFeeAnimation }]}}>
                        <CustomFee
                            ref={ref => this.customFee = ref}
                            currencyCode={currencyCode}
                            fee={this.state.fee}
                            handleTransferAll={this.handleTransferAll}
                            useAllFunds={this.props.sendData.useAllFunds}/>
                    </Animated.View>
                </View>
            </View>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        daemonStore: state.daemonStore,
        fiatRatesStore: state.fiatRatesStore
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
