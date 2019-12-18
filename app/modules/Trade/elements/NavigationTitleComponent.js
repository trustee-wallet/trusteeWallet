import React, { Component } from 'react'
import { Text, TouchableOpacity, View } from 'react-native'

import ExchangeActions from '../../../appstores/Actions/ExchangeActions'

import { strings } from '../../../services/i18n'


export default class NavigationTitleComponent extends Component {

    constructor(props) {
        super(props)
    }

    handleSetTradeType = tradeTypeObj => {
        this.props.handleSetState('show', false)

        ExchangeActions.handleSetTradeType(tradeTypeObj)

        this.props.handleSetTradeWay(tradeTypeObj.tradeType)
    }

    render() {

        const { tradeType } = this.props.exchangeStore

        return (
            <View style={styles.navigationTitleComponent}>
                <TouchableOpacity
                    disabled={tradeType === 'BUY'}
                    style={styles.navigationTitleComponent__btn}
                    onPress={() => this.handleSetTradeType({ tradeType: 'BUY' })}>
                    <View style={[styles.navigationTitleComponent__btn__left, tradeType === 'BUY' ? styles.navigationTitleComponent__btn__left_active : null]}>
                        <Text style={[styles.navigationTitleComponent__text, tradeType === 'BUY' ? styles.navigationTitleComponent__textLeft_active : null]}>
                            { strings('exchange.mainData.titleBuy') }
                        </Text>
                    </View>
                </TouchableOpacity>
                <View style={styles.navigationTitleComponent__line} />
                <TouchableOpacity
                    disabled={tradeType === 'SELL'}
                    style={styles.navigationTitleComponent__btn}
                    onPress={() => this.handleSetTradeType({ tradeType: 'SELL' })}>
                    <View style={[styles.navigationTitleComponent__btn__right, tradeType === 'SELL' ? styles.navigationTitleComponent__btn__right_active : null]}>
                        <Text style={[styles.navigationTitleComponent__text, tradeType === 'SELL' ? styles.navigationTitleComponent__textRight_active : null]}>
                            { strings('exchange.mainData.titleSell') }
                        </Text>
                    </View>
                </TouchableOpacity>
            </View>
        )
    }
}

const styles = {
    navigationTitleComponent: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center'
    },
    navigationTitleComponent__btn: {
        paddingVertical: 6,
    },
    navigationTitleComponent__btn__left: {
        justifyContent: 'center',

        height: 26,

        borderLeftWidth: 1,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderBottomColor: '#7127ac',
        borderTopColor: '#7127ac',
        borderLeftColor: '#7127ac',
        borderTopLeftRadius: 7,
        borderBottomLeftRadius: 7,
    },
    navigationTitleComponent__btn__right: {
        justifyContent: 'center',

        height: 26,

        borderRightWidth: 1,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderBottomColor: '#7127ac',
        borderTopColor: '#7127ac',
        borderRightColor: '#7127ac',
        borderTopRightRadius: 7,
        borderBottomRightRadius: 7,
    },
    navigationTitleComponent__line: {
        width: 1,
        height: 26,
        backgroundColor: '#7127ac'
    },
    navigationTitleComponent__text: {
        paddingHorizontal: 5,

        fontSize: 12,
        fontFamily: 'SFUIDisplay-Regular',
        color: '#7127ac',
    },
    navigationTitleComponent__textLeft_active: {
        color: '#f4f4f4',
    },
    navigationTitleComponent__textRight_active: {
        color: '#f4f4f4',
    },
    navigationTitleComponent__btn__left_active: {
        backgroundColor: '#7127ac'
    },
    navigationTitleComponent__btn__right_active: {
        backgroundColor: '#7127ac'
    },

}