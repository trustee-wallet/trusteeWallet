/**
 * @version 0.41
 */
import React from 'react'
import { View, Text, TouchableOpacity, Platform, StyleSheet } from 'react-native'

import BlocksoftPrettyNumbers from '@crypto/common/BlocksoftPrettyNumbers'
import Log from '@app/services/Log/Log'

import { ThemeContext } from '@app/theme/ThemeProvider'
import CurrencyIcon from '@app/components/elements/CurrencyIcon'
import LetterSpacing from '@app/components/elements/LetterSpacing'

class HeaderAccountDetails extends React.PureComponent {

    constructor(props) {
        super(props)
        this.state = {
            isBalanceVisible : false
        }
    }

    triggerBalanceVisibility = (value) => {
        this.setState((state) => ({ isBalanceVisible: value || state.originalVisibility }))
    }

    render() {
        const { colors, GRID_SIZE } = this.context
        const originalVisibility = this.props.ExtraViewParams.isBalanceVisible
        const isBalanceVisible = this.state.isBalanceVisible || originalVisibility
        const { currencySymbol, currencyName, currencyCode, balanceTotalPretty, basicCurrencyBalanceTotal, basicCurrencySymbol } = this.props.ExtraViewParams.sendScreenStoreDict


        const amountPrep = BlocksoftPrettyNumbers.makeCut(balanceTotalPretty).separated
        let sumPrep = amountPrep + ' ' + currencySymbol
        try {
            sumPrep += ' / ~' + basicCurrencySymbol + ' ' + basicCurrencyBalanceTotal
        } catch (e) {
            Log.err('Send.SendScreen renderAccountDetail error ' + e.message)
        }

        return (
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingBottom: GRID_SIZE }}>
                <View>
                    <CurrencyIcon currencyCode={currencyCode} />
                </View>
                <View style={styles.accountDetail__content}>
                    <View style={{}}>
                        <Text style={{...styles.accountDetail__title, color: colors.common.text1 }} numberOfLines={1}>
                            {currencyName}
                        </Text>
                        <TouchableOpacity
                            onPressIn={() => this.triggerBalanceVisibility(true)}
                            onPressOut={() => this.triggerBalanceVisibility(false)}
                            activeOpacity={1}
                            disabled={originalVisibility}
                            hitSlop={{ top: 10, right: isBalanceVisible? 60 : 30, bottom: 10, left: isBalanceVisible? 60 : 30 }}
                        >
                            {isBalanceVisible ?
                                <LetterSpacing text={sumPrep} textStyle={styles.accountDetail__text} letterSpacing={1} /> :
                                <Text style={{ ...styles.accountDetail__text, color: colors.common.text1, fontSize: 24 }}>****</Text>
                            }
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        )
    }
}

HeaderAccountDetails.contextType = ThemeContext

export default HeaderAccountDetails

const styles = StyleSheet.create({
    accountDetail: {
        marginLeft: 31
    },
    accountDetail__content: {
        flexDirection: 'row',

        marginLeft: 16
    },
    accountDetail__title: {
        fontFamily: 'Montserrat-Bold',
        fontSize: 18
    },
    accountDetail__text: {
        fontSize: 14,
        height: Platform.OS === 'ios' ? 15 : 18,
        fontFamily: 'SFUIDisplay-Semibold',
        color: '#939393'
    }
})
