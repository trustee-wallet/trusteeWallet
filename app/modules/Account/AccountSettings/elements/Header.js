/**
 * @version 0.50
 * @author yura
 */

import React, { PureComponent } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { connect } from 'react-redux'

import { ThemeContext } from '@app/theme/ThemeProvider'
import { getIsBalanceVisible } from '@app/appstores/Stores/Settings/selectors'
import LetterSpacing from '@app/components/elements/LetterSpacing'
import BlocksoftPrettyNumbers from '@crypto/common/BlocksoftPrettyNumbers'
import { getSelectedAccountData } from '@app/appstores/Stores/Main/selectors'
import TouchableDebounce from '@app/components/elements/new/TouchableDebounce'

class AccountSettingsHeader extends PureComponent {

    state = {
        isBalanceVisible: false,
        originalVisibility: false,
    }

    componentDidMount() {
        this.setState({
            isBalanceVisible: this.props.isBalanceVisible,
            originalVisibility: false,
        })
    }

    triggerBalanceVisibility = (value, originalVisibility) => {
        this.setState((state) => ({ isBalanceVisible: value || originalVisibility }))
    }

    render() {
        const { colors, GRID_SIZE } = this.context

        const { isBalanceVisible, originalVisibility } = this.state
        const { color } = this.props

        const { balancePretty, basicCurrencySymbol, basicCurrencyBalance, currencyCode } = this.props.selectedAccountData
        const finalIsBalanceVisible = isBalanceVisible

        let tmp = BlocksoftPrettyNumbers.makeCut(balancePretty, 7, 'AccountScreen/renderBalance').separated
        if (typeof tmp.split === 'undefined') {
            throw new Error('AccountScreen.renderBalance split is undefined')
        }

        tmp = tmp.slice(0, 11)
        const tmps = tmp.split('.')
        let balancePrettyPrep1 = tmps[0]
        let balancePrettyPrep2 = ''
        if (typeof tmps[1] !== 'undefined' && tmps[1]) {
            balancePrettyPrep1 = tmps[0] + '.'
            balancePrettyPrep2 = tmps[1]
        }

        return (
            <View style={[styles.topContent__top, { marginHorizontal: GRID_SIZE }]}>
                <View style={[styles.topContent__title]}>
                    <TouchableDebounce
                        onPressIn={() => this.triggerBalanceVisibility(true, originalVisibility)}
                        onPressOut={() => this.triggerBalanceVisibility(false, originalVisibility)}
                        activeOpacity={1}
                        disabled={isBalanceVisible}
                        hitSlop={{ top: 10, right: finalIsBalanceVisible ? 60 : 30, bottom: 10, left: finalIsBalanceVisible ? 60 : 30 }}
                    >
                        {finalIsBalanceVisible ? (
                            <Text style={[styles.topContent__title_first, { color: colors.common.text1 }]} numberOfLines={1} >
                                {balancePrettyPrep1}
                                <Text style={[styles.topContent__title_last, { color: colors.common.text1 }]}>
                                    {balancePrettyPrep2 + ' '}
                                    <Text style={{ color: color }}>{currencyCode}</Text>
                                </Text>
                            </Text>
                        ) : (
                            <Text style={[styles.topContent__title_last, { color: colors.common.text1, marginTop: 11, paddingHorizontal: 15, fontSize: 24, lineHeight: 24 }]}>
                                ****
                            </Text>
                        )}
                    </TouchableDebounce>
                </View>
                {finalIsBalanceVisible && (
                    <LetterSpacing
                        text={basicCurrencySymbol + ' ' + basicCurrencyBalance}
                        textStyle={[styles.topContent__subtitle, { color: colors.common.text2 }]}
                        letterSpacing={.5}
                    />
                )}
            </View>
        )
    }
}

AccountSettingsHeader.contextType = ThemeContext

const mapStateToProps = (state) => {
    return {
        isBalanceVisible: getIsBalanceVisible(state.settingsStore),
        selectedAccountData: getSelectedAccountData(state)
    }
}

export default connect(mapStateToProps)(AccountSettingsHeader)

const styles = StyleSheet.create({
    topContent__top: {
        position: 'relative',
        alignItems: 'center',
        paddingBottom: 14
    },
    topContent__title: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom: 10,
        paddingTop: 8,
    },
    topContent__subtitle: {
        marginTop: -10,
        fontFamily: 'SFUIDisplay-SemiBold',
        fontSize: 14,
        textAlign: 'center'
    },
    topContent__title_first: {
        fontSize: 24,
        lineHeight: 28,

        fontFamily: 'Montserrat-SemiBold',
    },
    topContent__title_last: {
        fontSize: 20,
        fontFamily: 'Montserrat-SemiBold',
        lineHeight: 24,
        opacity: 1,
    }
})