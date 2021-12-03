/**
 * @version 0.50
 * to take balance from store for version up
 */
import React, { Component } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'

import GradientView from '@app/components/elements/GradientView'
import CustomIcon from '@app/components/elements/CustomIcon'
import NavStore from '@app/components/navigation/NavStore'

import cryptoWalletActions from '@app/appstores/Actions/CryptoWalletActions'

import DaemonCache from '@app/daemons/DaemonCache'
import BlocksoftPrettyNumbers from '@crypto/common/BlocksoftPrettyNumbers'

import { ThemeContext } from '@app/theme/ThemeProvider'
import { setBseLink } from '@app/appstores/Stores/Main/MainStoreActions'
import { NftActions } from '@app/appstores/Stores/Nfts/NftsActions'

class Wallet extends Component {

    constructor(props) {
        super(props)
        this.state = {
            isShowSettings: false
        }
    }

    handleSelectWallet = async () => {
        await cryptoWalletActions.setSelectedWallet(this.props.wallet.walletHash, 'handleSelectWallet')
        setBseLink(null)
        if (this.props.source === 'HomeScreen') {
            NavStore.goBack()
        }
        await NftActions.init(false, this.props.wallet.walletHash) // wallet hash here helps as address else used from old wallet sometimes
    }

    handleOpenAdvanced = () => {
        NavStore.goNext('AdvancedWalletScreen')
    }

    getBalanceData = () => {
        const { wallet } = this.props
        const CACHE_SUM = DaemonCache.getCache(wallet.walletHash)

        let walletBalance = 0
        let currencySymbol = ''
        if (CACHE_SUM) {
            walletBalance = CACHE_SUM.balance
            currencySymbol = CACHE_SUM.basicCurrencySymbol
        }

        let tmp = walletBalance.toString().split('.')
        let beforeDecimal = BlocksoftPrettyNumbers.makeCut(tmp[0]).separated
        let afterDecimal = ''
        if (typeof tmp[1] !== 'undefined') {
            afterDecimal = '.' + tmp[1].substr(0, 2)
        }

        return { currencySymbol, beforeDecimal, afterDecimal }
    }

    render() {
        const { selectedWalletHash, wallet } = this.props

        const { isBalanceVisible } = this.props

        const isSelected = wallet.walletHash === selectedWalletHash
        const isBackedUp = wallet.walletIsBackedUp

        const balanceData = this.getBalanceData()

        const { colors, GRID_SIZE } = this.context

        return (
            <TouchableOpacity
                onPress={this.handleSelectWallet}
                style={[styles.bgContainer, isSelected && styles.activeContainer, { marginVertical: GRID_SIZE / 2, borderColor: colors.walletManagment.walletItemBorderColor }]}
                disabled={isSelected}>
                <GradientView
                    array={isSelected ? colors.walletManagment.walletItemBgActive : colors.walletManagment.walletItemBg}
                    start={{ x: 1, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.container}
                >
                    <View style={[styles.balanceContainer, !isBackedUp && { flex: 1 }]}>
                        <Text style={[styles.walletName, { color: colors.common.text3 }]} numberOfLines={1}>{wallet.walletName}</Text>
                        {isBalanceVisible ? (
                            <View style={{ flexDirection: 'row', alignItems: 'flex-end', flex: 1 }}>
                                <Text style={[styles.balanceCurrencySymbol, { color: colors.common.text1 }]}>{balanceData.currencySymbol}</Text>
                                <Text style={[styles.balanceBeforeDecimal, { color: colors.common.text1 }]}>{balanceData.beforeDecimal}</Text>
                                <Text style={[styles.balanceAfterDecimal, { color: colors.common.text1 }]}>{balanceData.afterDecimal}</Text>
                            </View>
                        ) : (
                            <Text style={[styles.balanceHidden, { color: colors.common.text1 }]}>****</Text>
                        )}
                    </View>
                    <View style={styles.settings}>
                        {isSelected && <TouchableOpacity
                            style={styles.advancedButton}
                            hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
                            activeOpacity={0.8}
                            onPress={this.handleOpenAdvanced}
                            disabled={!isSelected}
                        >
                            <CustomIcon name='coinSettings' size={20} color={colors.common.text1} />
                        </TouchableOpacity>}
                        {!isBackedUp && (
                            <View style={styles.backupIcon}>
                                <CustomIcon name='warning' size={24} color={colors.walletManagment.walletItemBorderColor} />
                            </View>
                        )}
                    </View>
                </GradientView>
            </TouchableOpacity>
        )
    }
}

Wallet.contextType = ThemeContext

export default Wallet

const styles = StyleSheet.create({
    bgContainer: {
        borderRadius: 16,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 10,
        shadowOffset: {
            width: 0,
            height: 5
        },
        elevation: 10,
    },
    activeContainer: {
        shadowOpacity: 0,
        elevation: 0,
        borderWidth: 2,
    },
    container: {
        borderRadius: 16,
        flex: 1,
        paddingHorizontal: 16,
        paddingVertical: 19,
        flexDirection: 'row'
    },
    balanceContainer: {
        flex: 1.8,
        paddingRight: 5,
    },
    walletName: {
        fontFamily: 'SFUIDisplay-Semibold',
        fontSize: 14,
        lineHeight: 18,
        letterSpacing: 1,
        marginBottom: 5,
    },
    balanceCurrencySymbol: {
        fontFamily: 'Montserrat-SemiBold',
        fontSize: 18,
        lineHeight: 20,
        marginBottom: 2,
        marginRight: 4
    },
    balanceBeforeDecimal: {
        fontFamily: 'Montserrat-SemiBold',
        fontSize: 24,
        lineHeight: 24,
    },
    balanceAfterDecimal: {
        fontFamily: 'Montserrat-Bold',
        fontSize: 16,
        lineHeight: 24,
    },
    balanceHidden: {
        fontFamily: 'Montserrat-SemiBold',
        fontSize: 24,
        lineHeight: 24,
        marginTop: 4,
        marginBottom: -4,
    },
    backupIcon: {
        paddingTop: 4,
        flex: 1,
        justifyContent: 'flex-end'
    },
    settings: {
        justifyContent: 'space-between',
        alignItems: 'center'
    }
})
