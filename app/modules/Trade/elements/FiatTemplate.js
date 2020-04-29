/**
 * @version todo
 * @misha to review
 */
import React, { Component } from 'react'
import { Dimensions, ScrollView, Text, TouchableOpacity } from 'react-native'

import { connect } from 'react-redux'
import { strings } from '../../../services/i18n'

const { width: SCREEN_WIDTH } = Dimensions.get("window")

const fiatTemplateList = [
    {
        title: '100',
        value: '100',
        key: 1
    },
    {
        title: '200',
        value: '200',
        key: 2
    },
    {
        title: '300',
        value: '300',
        key: 3
    },
    {
        title: strings('tradeScreen.custom').toUpperCase(),
        value: '',
        key: 4
    },
]

const fiatTemplateListQIWI = [
    {
        title: '500',
        value: '500',
        key: 1
    },
    {
        title: '700',
        value: '700',
        key: 2
    },
    {
        title: '900',
        value: '900',
        key: 3
    },
    {
        title: strings('tradeScreen.custom').toUpperCase(),
        value: '',
        key: 4
    },
]

class FiatTemplate extends Component {

    constructor(props){
        super(props)
        this.state = {
            fiatTemplateList: fiatTemplateList
        }
    }

    // eslint-disable-next-line camelcase
    UNSAFE_componentWillReceiveProps(nextProps) {

        const { selectedFiatCurrency, selectedPaymentSystem, selectedCryptocurrency, selectedFiatTemplate } = nextProps

        if(selectedFiatCurrency && typeof selectedFiatCurrency.cc !== 'undefined' && typeof selectedPaymentSystem.currencyCode != 'undefined' && typeof selectedCryptocurrency.currencyCode != 'undefined' && selectedFiatTemplate && selectedFiatTemplate.value){
            this.handleSetFiatTemplateFromProps(selectedFiatTemplate, selectedPaymentSystem, selectedCryptocurrency, selectedFiatCurrency)
        } else if(selectedFiatCurrency && typeof selectedPaymentSystem.currencyCode != 'undefined' && typeof selectedCryptocurrency.currencyCode != 'undefined' && selectedFiatTemplate && !selectedFiatTemplate.value) {
            if(selectedPaymentSystem.paymentSystem === "QIWI"){
                this.setState({
                    fiatTemplateList: fiatTemplateListQIWI
                })
            } else {
                this.setState({
                    fiatTemplateList: fiatTemplateList
                })
            }
        }

        if(!this.props.selectedPaymentSystem && selectedPaymentSystem && typeof selectedFiatCurrency.cc !== 'undefined'){

            if(selectedPaymentSystem.paymentSystem === "QIWI"){
                this.setState({
                    fiatTemplateList: fiatTemplateListQIWI
                }, () => {

                    const selectedFT = this.state.fiatTemplateList.find(item => item.key === 4)

                    this.handleSetFiatTemplateFromProps({
                        ...selectedFT
                    }, selectedPaymentSystem, selectedCryptocurrency, selectedFiatCurrency)
                })
            } else {
                this.setState({
                    fiatTemplateList: fiatTemplateList
                }, () => {

                    const selectedFT = this.state.fiatTemplateList.find(item => item.key === 4)

                    this.handleSetFiatTemplateFromProps({
                        ...selectedFT
                    }, selectedPaymentSystem, selectedCryptocurrency, selectedFiatCurrency)
                })
            }
        }
    }

    handleSetFiatTemplateFromProps = (selectedFiatTemplate, selectedPaymentSystem, selectedCryptocurrency, selectedFiatCurrency) => {

        if(selectedPaymentSystem.paymentSystem === "QIWI"){

            this.setState({
                fiatTemplateList: fiatTemplateListQIWI
            }, () => {

                const selectedFT = this.state.fiatTemplateList.find(item => item.key === selectedFiatTemplate.key)

                const selectedTradeWay = this.props.handleGetTradeWay(selectedCryptocurrency, selectedPaymentSystem)

                const amount = this.props.handleConvertToPaymentCurrency('USD', selectedFT.value)

                this.props.refAmount.calculateEquivalent(selectedTradeWay, selectedFiatCurrency, amount)

                this.props.handleSetState(
                    'selectedFiatTemplate',
                    selectedFT
                )
            })
        } else {
            this.setState({
                fiatTemplateList: fiatTemplateList
            }, () => {

                const selectedFT = this.state.fiatTemplateList.find(item => item.key === selectedFiatTemplate.key)

                const selectedTradeWay = this.props.handleGetTradeWay(selectedCryptocurrency, selectedPaymentSystem)

                const amount = this.props.handleConvertToPaymentCurrency('USD', selectedFT.value)

                this.props.refAmount.calculateEquivalent(selectedTradeWay, selectedFiatCurrency, amount)

                this.props.handleSetState(
                    'selectedFiatTemplate',
                    selectedFT
                )
            })
        }
    }

    handleSetFiatTemplate = (selectedFiatTemplate) => {

        const { selectedCryptocurrency, selectedFiatCurrency, selectedPaymentSystem } = this.props

        const selectedTradeWay = this.props.handleGetTradeWay(selectedCryptocurrency, selectedPaymentSystem)

        const amount = this.props.handleConvertToPaymentCurrency('USD', selectedFiatTemplate.value)

        this.props.refAmount.handleSetState('moneyType', 'FIAT', () => {
            this.props.refAmount.calculateEquivalent(selectedTradeWay, selectedFiatCurrency, amount)

            this.props.handleSetState(
                'selectedFiatTemplate',
                selectedFiatTemplate
            )
        })
    }


    render() {

        const { fiatTemplateList } = this.state
        const { selectedFiatTemplate, selectedPaymentSystem } = this.props

        const isSelPaySys = typeof selectedPaymentSystem.paymentSystem != 'undefined'

        return (
            <ScrollView horizontal={true}
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ width: '100%', flexDirection: 'row', justifyContent: 'space-between' }}>
                {
                    fiatTemplateList.map((item, index) => {
                        return (
                            <TouchableOpacity disabled={!isSelPaySys} key={index} style={[styles.box, item.key === selectedFiatTemplate.key ? styles.box_active : null, !index ? styles.box_marginFirst : index === fiatTemplateList.length - 1 ? styles.box_marginLast : null, !isSelPaySys ? styles.box_disabled : null, ]}
                                              onPress={() => this.handleSetFiatTemplate(item)}>
                                <Text style={[styles.box__item, item.key === selectedFiatTemplate.key ? styles.box__item_active : null, index === fiatTemplateList.length - 1 ? styles.box__item_custom : null]}>
                                    { index === fiatTemplateList.length - 1 ? null : '$' } { item.title }
                                </Text>
                            </TouchableOpacity>
                        )
                    })
                }
            </ScrollView>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        state
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        dispatch
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(FiatTemplate)

const styles = {
    box: {
        justifyContent: 'center',

        height: SCREEN_WIDTH < 370 ? 36 : 44,
        paddingHorizontal: SCREEN_WIDTH < 370 ? 8: 15,
        marginHorizontal: 4,

        backgroundColor: '#F9F2FF',
        borderRadius: 10
    },
    box_active: {
        backgroundColor: '#A168F2',
    },
    box_marginFirst: {
        marginLeft: 15,
    },
    box_marginLast: {
        marginRight: 15,
    },
    box_disabled: {
        opacity: 0.5
    },
    box__item: {
        fontSize: SCREEN_WIDTH < 370 ? 16 : 19,
        fontFamily: 'SFUIDisplay-Regular',
        color: '#7127AC'
    },
    box__item_active: {
        color: '#fff'
    },
    box__item_custom: {
        fontSize: SCREEN_WIDTH < 370 ? 10 : 12,
        fontFamily: 'SFUIDisplay-Semibold',
    }
}
