import React, { Component } from 'react'
import { ScrollView, Text, TouchableOpacity, View } from 'react-native'

import { connect } from 'react-redux'
import { strings } from '../../../services/i18n'


class FiatTemplate extends Component {

    constructor(props){
        super(props)
        this.state = {
            fiatTemplateList: [
                {
                    title: '100',
                    value: '100',
                    key: '100'
                },
                {
                    title: '200',
                    value: '200',
                    key: '200'
                },
                {
                    title: '300',
                    value: '300',
                    key: '300'
                },
                {
                    title: strings('tradeScreen.custom').toUpperCase(),
                    value: '',
                    key: 'CUSTOM'
                },
            ]
        }
    }

    componentWillReceiveProps(nextProps) {

        const { selectedFiatCurrency, selectedPaymentSystem, selectedCryptocurrency, selectedFiatTemplate } = nextProps

        if(
            selectedFiatCurrency && typeof selectedPaymentSystem.currencyCode != 'undefined' && typeof selectedCryptocurrency.currencyCode != 'undefined' && selectedFiatTemplate && selectedFiatTemplate.value
        ){
            this.handleSetFiatTemplateFromProps(selectedFiatTemplate, selectedPaymentSystem, selectedCryptocurrency, selectedFiatCurrency)
        }

        if(!this.props.selectedPaymentSystem && selectedPaymentSystem){
            this.handleSetFiatTemplateFromProps({
                title: '200',
                value: '200',
                key: '200'
            }, selectedPaymentSystem, selectedCryptocurrency, selectedFiatTemplate)
        }
    }

    handleSetFiatTemplateFromProps = (selectedFiatTemplate, selectedPaymentSystem, selectedCryptocurrency, selectedFiatCurrency) => {

        const selectedTradeWay = this.props.handleGetTradeWay(selectedCryptocurrency, selectedPaymentSystem)

        const amount = this.props.handleConvertToPaymentCurrency('USD', selectedFiatTemplate.value)

        this.props.refAmount.calculateEquivalent(selectedTradeWay, selectedFiatCurrency, amount)

        this.props.handleSetState(
            'selectedFiatTemplate',
            selectedFiatTemplate
        )
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
        fiatRatesStore: state.fiatRatesStore,
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

        height: 44,
        paddingHorizontal: 15,
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
        fontSize: 19,
        fontFamily: 'SFUIDisplay-Regular',
        color: '#7127AC'
    },
    box__item_active: {
        color: '#fff'
    },
    box__item_custom: {
        fontSize: 12,
        fontFamily: 'SFUIDisplay-Semibold',
    }
}