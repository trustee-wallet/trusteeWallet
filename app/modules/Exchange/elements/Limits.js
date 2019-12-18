import React, { Component } from 'react'
import { connect } from 'react-redux'

import { View, Text, TouchableWithoutFeedback, TouchableOpacity, Keyboard } from 'react-native'

import { strings } from '../../../services/i18n'


class Limits extends Component {

    constructor(){
        super()
        this.state = {
            limits: {},
            isValid: true
        }
    }

    componentWillReceiveProps(nextProps) {

        const { selectedInCryptocurrency, selectedOutCryptocurrency, selectedFiatTemplate, selectedPaymentSystem } = nextProps

        if(typeof selectedInCryptocurrency.currencyCode != 'undefined' && typeof selectedOutCryptocurrency.currencyCode != 'undefined' && typeof selectedPaymentSystem.paymentSystem != 'undefined'){

            this.prepareLimits(
                selectedInCryptocurrency,
                selectedOutCryptocurrency,
                selectedPaymentSystem
            )
        }

        if(selectedFiatTemplate && selectedFiatTemplate.value){
            this.setState({ isValid: true })
        }
    }

    prepareLimits = (selectedInCryptocurrency, selectedOutCryptocurrency) => {


        const tradeWay = this.props.handleGetExchangeWay(selectedInCryptocurrency, selectedOutCryptocurrency)

        if(typeof tradeWay != 'undefined'){
            this.setState({
                limits: {
                    min: tradeWay.limits.min,
                    max: tradeWay.limits.max,
                }
            })
        }
    }

    handleValidateLimits = () => {

        const { refAmount } = this.props
        const { limits } = this.state

        if(typeof refAmount == 'undefined'){
            return (
                <View />
            )
        }

        const amount = refAmount.handleGetAmountEquivalent()

        let isValid = true

        if(limits.min > amount.amountEquivalent.inAmount){
            isValid = false
        }

        this.setState({ isValid })
        return isValid
    }

    useLimit = amount => {
        this.props.refAmount.handleSetState('calculateWay', 'IN', () => {
            this.props.refAmount.setInputData(amount.toString())
        })
        this.setState({
            isValid: true
        })
    }

    renderLimits = () => {

        const { isValid, limits } = this.state
        const { selectedInCryptocurrency } = this.props

        if(!isValid)
            return (
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                        <View style={styles.container}>
                            <Text style={styles.title} numberOfLines={1}>
                                { strings('tradeScreen.limitsTitle') }
                            </Text>
                            <View style={styles.container__row}>
                                <View style={styles.container__col}>
                                    <Text style={[styles.container__text1, { marginLeft: 15, marginTop: -6 }]}>
                                        { strings('exchangeScreen.min') }
                                    </Text>
                                    <Text style={[styles.container__text1, { marginLeft: 15, marginTop: 12 }]}>
                                        { strings('exchangeScreen.max') }
                                    </Text>
                                </View>
                                <View style={[styles.container__col, { alignItems: 'flex-end' }]}>
                                    <TouchableOpacity style={styles.number} onPress={() => this.useLimit(limits.min)}>
                                        <View style={[styles.number__content, styles.number__content_1]}>
                                            <Text style={[styles.container__text2, { textAlign: 'right' }]}>
                                                { `${1 * limits.min.toFixed(5)} ${selectedInCryptocurrency.currencySymbol}` }
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                    <TouchableOpacity disabled={true} style={styles.number} onPress={() => this.useLimit(limits.max)}>
                                        <View style={[styles.number__content, styles.number__content_2]}>
                                            <Text style={[styles.container__text2, { textAlign: 'right' }]}>
                                                { `${limits.max == null ? '∞' : 1 * limits.max.toFixed(5)} ${selectedInCryptocurrency.currencySymbol}` }
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                </View>
                            </View>
                    </View>
                </TouchableWithoutFeedback>
            )

        return <View />
    }

    render(){
        return this.renderLimits()
    }
}

const mapStateToProps = (state) => {
    return {
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

export default connect(mapStateToProps, mapDispatchToProps, null, { forwardRef: true })(Limits)

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
        color: "#fff"
    },
    container__row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    container__col: {
        justifyContent: 'center'
    },
    container__text1: {
        fontSize: 16,
        fontFamily: 'SFUIDisplay-Regular',
        color: '#FFDEEA',
    },
    container__text2: {
        fontSize: 16,
        fontFamily: 'SFUIDisplay-Semibold',
        color: '#F79EBE',
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
    },
}