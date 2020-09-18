/**
 * @version 0.11
 */
import React, { Component } from 'react'
import { Text, TouchableOpacity, View } from 'react-native'

import { strings } from '../../../services/i18n'


export default class ExchangeNavigationTitleComponent extends Component {


    handleSetRevert() {
        this.props.handleSetRevert()
    }

    render() {
        const { selectedInCurrency, selectedOutCurrency } = this.props
        let tmp1 = '?'
        let tmp2 = '?'
        if (selectedOutCurrency && typeof selectedOutCurrency.currencySymbol !== 'undefined') {
            tmp1 = selectedOutCurrency.currencySymbol
        }
        if (selectedInCurrency && typeof selectedInCurrency.currencySymbol !== 'undefined') {
            tmp2 = selectedInCurrency.currencySymbol
        }

        const revertPrep = tmp1 + '-' + tmp2
        const nowPrep = tmp2 + '-' + tmp1

        if (revertPrep === '?-?') {
            return null
        }

        return (
            <View style={styles.navigationTitleComponent}>
                <TouchableOpacity
                    disabled={true}
                    style={styles.navigationTitleComponent__btn}
                    onPress={() => this.handleSetRevert()}>
                    <View
                        style={[styles.navigationTitleComponent__btn__left, styles.navigationTitleComponent__btn__left_active]}>
                        <Text
                            style={[styles.navigationTitleComponent__text, styles.navigationTitleComponent__textLeft_active]}>
                            {nowPrep}
                        </Text>
                    </View>
                </TouchableOpacity>
                <View style={styles.navigationTitleComponent__line}/>
                <TouchableOpacity
                    style={styles.navigationTitleComponent__btn}
                    onPress={() => this.handleSetRevert()}>
                    <View style={[styles.navigationTitleComponent__btn__right]}>
                        <Text style={[styles.navigationTitleComponent__text]}>
                            {revertPrep}
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
        paddingVertical: 6
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
        borderBottomLeftRadius: 7
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
        borderBottomRightRadius: 7
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
        color: '#7127ac'
    },
    navigationTitleComponent__textLeft_active: {
        color: '#f4f4f4'
    },
    navigationTitleComponent__textRight_active: {
        color: '#f4f4f4'
    },
    navigationTitleComponent__btn__left_active: {
        backgroundColor: '#7127ac'
    },
    navigationTitleComponent__btn__right_active: {
        backgroundColor: '#7127ac'
    }

}
