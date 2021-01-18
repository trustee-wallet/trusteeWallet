/**
 * @version 0.11
 */
import React, { Component } from 'react'
import { connect } from 'react-redux'
import { View, Text, TouchableWithoutFeedback, TouchableOpacity, Keyboard } from 'react-native'

import { strings } from '../../../services/i18n'

import Log from '../../../services/Log/Log'


class ExchangeLimits extends Component {

    constructor() {
        super()
        this.state = {
            limits: {},
            isValid: true
        }
    }

    drop = () => {
        this.setState({
            limits: {},
            isValid: true
        })
    }

    // eslint-disable-next-line camelcase
    UNSAFE_componentWillReceiveProps(nextProps) {

        const { selectedInCurrency, selectedOutCurrency, selectedPaymentSystem } = nextProps

        if (typeof selectedInCurrency.currencyCode !== 'undefined' && typeof selectedOutCurrency.currencyCode !== 'undefined' && typeof selectedPaymentSystem.paymentSystem !== 'undefined') {

            this.prepareLimits(selectedInCurrency, selectedOutCurrency, selectedPaymentSystem)
        }
    }

    prepareLimits = (selectedInCurrency, selectedOutCurrency, selectedPaymentSystem) => {
        const tradeWay = this.props.handleGetTradeWay(selectedInCurrency, selectedPaymentSystem)

        if (typeof tradeWay === 'undefined' || !tradeWay) {
            return ;
        }
        const limits = {
            minInSymbol : selectedInCurrency.currencySymbol || '',
            minOutSymbol : selectedOutCurrency.currencySymbol || '',
            minIn: tradeWay.limits.min,
            maxInSet : tradeWay.limits.max == null,
            maxIn: tradeWay.limits.max == null ? '∞' : 1 * tradeWay.limits.max.toFixed(5),
            minOut: 1 * (tradeWay.limits.min * tradeWay.exchangeRate.amount).toFixed(2),
        }

        this.setState({
            limits
        })
    }

    getMinCrypto = () => {
        return this.state.limits.minIn
    }

    handleValidateLimits = () => {

        const { refAmount } = this.props
        const { limits } = this.state

        if (typeof refAmount === 'undefined') {
            return (
                <View/>
            )
        }

        const amount = refAmount.handleGetAmountEquivalent()

        let isValid = true

        if (limits.minIn > amount.amountEquivalentInCrypto) {
            isValid = false
            Log.log('EXC/handleValidateLimits invalid 1 ', {limits, amount})
        } else if (limits.maxInSet && limits.maxIn < amount.amountEquivalentInCrypto) {
            isValid = false
            Log.log('EXC/handleValidateLimits invalid 2 ', {limits, amount})
        } else {
            Log.log('EXC/handleValidateLimits valid ', {limits, amount})
        }

        this.setState({ isValid })
        return isValid
    }

    useLimit = (amount) => {
        this.props.refAmount.handleSetState('moneyType', 'IN', () => {
            this.props.refAmount.setInputData(amount.toString())
        })
        this.setState({
            isValid: true
        })
    }

    renderLimits = () => {

        const { isValid, limits } = this.state

        if (!isValid)
            return (
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <View style={styles.container}>
                        <Text style={styles.title} numberOfLines={1}>
                            {strings('tradeScreen.limitsTitle')}
                        </Text>
                        <View style={styles.container__row}>
                            <View style={styles.container__col}>
                                <Text style={[styles.container__text1, { marginLeft: 15, marginTop: -6 }]}>
                                    {strings('exchangeScreen.min')}
                                </Text>
                                <Text style={[styles.container__text1, { marginLeft: 15, marginTop: 12 }]}>
                                    {strings('exchangeScreen.max')}
                                </Text>
                            </View>
                            <View style={styles.container__col}>
                                <TouchableOpacity style={styles.number}
                                                  onPress={() => this.useLimit(limits.minIn)}>
                                    <View style={[styles.number__content, styles.number__content_1]}>
                                        <Text style={styles.container__text2}>
                                            {`${limits.minInSymbol} ${limits.minIn}`}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.number}>
                                    <View style={[styles.number__content, styles.number__content_2]}>
                                        <Text style={styles.container__text2}>
                                            {`${limits.minInSymbol} ${limits.maxIn}`}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            )

        return <View/>
    }

    render() {
        return this.renderLimits()
    }
}

const mapStateToProps = (state) => {
    return {
        mainStore: state.mainStore,
        exchangeStore: state.exchangeStore
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        dispatch
    }
}

export default connect(mapStateToProps, mapDispatchToProps, null, { forwardRef: true })(ExchangeLimits)

const styles = {
    container: {
        marginLeft: 30,
        marginRight: 40,
        marginBottom: 20,
        backgroundColor: '#F79EBE',
        borderRadius: 10
    },
    title: {
        paddingHorizontal: 15,
        marginTop: 14,

        fontSize: 19,
        fontFamily: 'SFUIDisplay-Regular',
        color: '#fff'
    },
    container__row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    container__col: {
        justifyContent: 'center'
    },
    container__text1: {
        fontSize: 16,
        fontFamily: 'SFUIDisplay-Regular',
        color: '#FFDEEA'
    },
    container__text2: {
        fontSize: 16,
        fontFamily: 'SFUIDisplay-Semibold',
        color: '#F79EBE'
    },
    number__content: {
        padding: 10,
        paddingVertical: 5,
        marginRight: 15,
        marginLeft: 20,

        backgroundColor: '#FFDEEA',

        borderRadius: 5
    },
    number__content_1: {
        marginTop: 6
    },
    number__content_2: {
        marginTop: 6,
        marginBottom: 15
    }
}
