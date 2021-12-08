/**
 * @version 0.50
 * @author Vadym
 */

import React from 'react'
import {
    Text,
    View,
    StyleSheet,
    TouchableOpacity, Platform
} from 'react-native'

import { connect } from 'react-redux'

import CurrencyIcon from '@app/components/elements/CurrencyIcon'
import { strings } from '@app/services/i18n'
import { getIsBalanceVisible } from '@app/appstores/Stores/Settings/selectors'
import { ThemeContext } from '@app/theme/ThemeProvider'
import BlocksoftPrettyNumbers from '@crypto/common/BlocksoftPrettyNumbers'

import Nfts from '@crypto/common/BlocksoftDictNfts'

class NftTokenValue extends React.Component {

    state = {
        isBalanceVisible: false
    }


    triggerBalanceVisibility = (value) => {
        this.setState((state) => ({ isBalanceVisible: value || state.originalVisibility }))
    }


    render() {

        const {
            walletCurrency,
            tokenQty,
            balance,
            balanceData,
            currencySymbol,
            tokenBlockchainCode
        } = this.props

        const {
            colors
        } = this.context

        const originalVisibility = this.props.isBalanceVisible
        const isBalanceVisible = this.state.isBalanceVisible || originalVisibility

        return (
            <View style={styles.currencyContainer}>
                <CurrencyIcon
                    setBackground={true}
                    currencyCode={Nfts.getCurrencyCode(walletCurrency, tokenBlockchainCode)}
                    containerStyle={{ borderWidth: 0, width: 30, height: 30 }}
                    markStyle={{ top: 30 }}
                    textContainerStyle={{ bottom: -19 }}
                    textStyle={{ backgroundColor: 'transparent' }}
                    iconStyle={{ fontSize: 18 }}
                />
                {balanceData ?
                    <TouchableOpacity
                        onPressIn={() => this.triggerBalanceVisibility(true)}
                        onPressOut={() => this.triggerBalanceVisibility(false)}
                        activeOpacity={1}
                        disabled={originalVisibility}
                        style={styles.balanceContainer}>
                        {isBalanceVisible ?
                            <>
                                <Text numberOfLines={2} style={[styles.balance, {
                                    color: colors.common.text3,
                                    fontSize: walletCurrency !== 'NFT' ? 13 : 18
                                }]}>{walletCurrency !== 'NFT' ? (BlocksoftPrettyNumbers.makeCut(balance).separated + ' ' + walletCurrency) : (walletCurrency + ' ' + strings('cashback.balanceTitle'))}</Text>
                                <Text
                                    style={[styles.balanceData, { fontSize: walletCurrency !== 'NFT' ? 10 : 14 }]}>{currencySymbol + ' ' + BlocksoftPrettyNumbers.makeCut(balanceData).separated}</Text>
                            </> :
                            <Text style={{ ...styles.accountDetail__text, color: colors.common.text1, fontSize: 24 }}>****</Text>
                        }
                    </TouchableOpacity>
                    :
                 tokenQty && tokenQty > 1 ?
                     <View style={styles.balanceContainer}>
                         <Text numberOfLines={2} style={[styles.balance, { color: colors.common.text3, fontSize: 13 }]}>{strings('nftMainScreen.tokenQty')}: {tokenQty} </Text>
                     </View>

                    :
                    <View style={styles.balanceContainer}>
                        <Text numberOfLines={2} style={[styles.balance, { color: colors.common.text3, fontSize: 13 }]}>
                            {Nfts.getCurrencyTitle(walletCurrency, tokenBlockchainCode)}
                        </Text>
                    </View>}
            </View>
        )
    }
}

NftTokenValue.contextType = ThemeContext

const mapStateToProps = (state) => {
    return {
        isBalanceVisible: getIsBalanceVisible(state.settingsStore),
    }
}

export default connect(mapStateToProps)(NftTokenValue)

const styles = StyleSheet.create({
    currencyContainer: {
        marginRight: 12,
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center'
    },
    balance: {
        fontFamily: 'SFUIDisplay-Bold',
        letterSpacing: 1.75
    },
    balanceData: {
        fontFamily: 'Montserrat-Bold',
        letterSpacing: 0.5,
        color: '#999999'
    },
    balanceContainer: {
        marginLeft: 10,
        flex: 1
    },
    accountDetail__text: {
        fontSize: 14,
        height: Platform.OS === 'ios' ? 15 : 18,
        fontFamily: 'SFUIDisplay-Semibold',
        color: '#939393'
    }
})
