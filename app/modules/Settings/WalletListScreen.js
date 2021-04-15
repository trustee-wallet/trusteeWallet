/**
 * @version 0.9
 */
import React, { Component } from 'react'
import { connect } from 'react-redux'
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native'

import EntypoIcon from 'react-native-vector-icons/Entypo'

import NavStore from '@app/components/navigation/NavStore'

import { strings } from '@app/services/i18n'

import DaemonCache from '@app/daemons/DaemonCache'
import BlocksoftPrettyNumbers from '@crypto/common/BlocksoftPrettyNumbers'

import Wallet from './elements/Wallet'
import Header from '@app/components/elements/new/Header'

import { ThemeContext } from '@app/modules/theme/ThemeProvider'

import MarketingAnalytics from '@app/services/Marketing/MarketingAnalytics'
import { getIsBalanceVisible } from '@app/appstores/Stores/Settings/selectors'


class WalletListScreen extends React.PureComponent {

    constructor(props) {
        super(props)
        this.state = {
            totalBalance: 0,
            headerHeight: 0,
            isBalanceVisible: false,
            originalVisibility: false
        }
        this.walletsRefs = {}
    }

    componentDidMount() {
        this.getBalanceVisibility()
    }

    getBalanceVisibility = () => {
        const originalVisibility = this.props.isBalanceVisible
        this.setState(() => ({ originalVisibility, isBalanceVisible: originalVisibility }))
    }

    triggerBalanceVisibility = () => {
        if (this.state.originalVisibility) return
        this.setState(state => ({ isBalanceVisible: !state.isBalanceVisible }))
    }

    setHeaderHeight = (height) => {
        const headerHeight = Math.round(height || 0);
        this.setState(() => ({ headerHeight }))
    }

    closeAllSettings = () => {
        let i = 0
        for (const item in this.walletsRefs) {
            this.walletsRefs[`walletRef${i}`].closeSetting()
            i++
        }
    }

    handleAddWallet = () => { NavStore.goNext('AddWalletScreen') }

    handleBack = () => { NavStore.goBack() }

    handleClose = () => { NavStore.reset('HomeScreen') }

    render() {
        MarketingAnalytics.setCurrentScreen('Settings.WalletListScreen')

        const { selectedWallet, selectedBasicCurrency } = this.props.mainStore
        const { wallets } = this.props

        let totalBalance = 0
        let localCurrencySymbol = selectedBasicCurrency.symbol

        const CACHE_SUM = DaemonCache.getCache(false)
        if (CACHE_SUM) {
            totalBalance = BlocksoftPrettyNumbers.makeCut(CACHE_SUM.balance, 2, 'Settings/totalBalance').separated
            localCurrencySymbol = CACHE_SUM.basicCurrencySymbol
        }

        const { colors, GRID_SIZE } = this.context
        const { headerHeight, isBalanceVisible } = this.state

        return (
            <View style={[styles.container, { backgroundColor: colors.common.background }]}>
                <Header
                    leftType="back"
                    leftAction={this.handleBack}
                    rightType="close"
                    rightAction={this.handleClose}
                    title={strings('settings.walletList.title')}
                    setHeaderHeight={this.setHeaderHeight}
                />
                <SafeAreaView style={[styles.content, {
                    backgroundColor: colors.common.background,
                    marginTop: headerHeight,
                }]}>
                    <ScrollView
                        bounces={false}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={[styles.scrollViewContent, { padding: GRID_SIZE }]}
                        keyboardShouldPersistTaps="handled"
                    >
                        <View style={[styles.topContent, { paddingHorizontal: GRID_SIZE / 2, paddingTop: GRID_SIZE / 2, paddingBottom: GRID_SIZE }]}>
                            <TouchableOpacity
                                onPressIn={this.triggerBalanceVisibility}
                                onPressOut={this.triggerBalanceVisibility}
                                activeOpacity={0.9}
                                hitSlop={{ top: 20, left: 20, right: isBalanceVisible ? 60 : 20, bottom: 30 }}
                            >
                                <Text style={[styles.balanceTitle, { color: colors.common.text2 }]}>{strings('settings.walletList.totalBalance')}</Text>
                                {
                                    isBalanceVisible ? (
                                        <Text style={[styles.balanceValue, { color: colors.common.text1 }]}>{localCurrencySymbol} {totalBalance}</Text>
                                    ) : (
                                        <Text style={[styles.balanceValue, styles.balanceValueHidden, { color: colors.common.text1 }]}>****</Text>
                                    )
                                }
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.addAssetButton, { borderColor: colors.common.text1 }]}
                                onPress={this.handleAddWallet}
                            >
                                <EntypoIcon style={[styles.addAsset__icon, { color: colors.common.text3 }]} size={13} name="plus" />
                                <Text style={[styles.addAsset__text, { color: colors.common.text3 }]}>
                                    {strings('settings.walletList.addWallet')}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <View style={{ paddingBottom: GRID_SIZE }}>
                            {
                                wallets.map((item, index) => {
                                    return (
                                        <Wallet
                                            selectedWallet={selectedWallet}
                                            wallet={item}
                                            key={index}
                                            isBalanceVisible={isBalanceVisible}
                                        />
                                    )
                                })
                            }
                        </View>
                    </ScrollView>
                </SafeAreaView>
            </View>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        mainStore: state.mainStore,
        accountStore: state.accountStore,
        wallets: state.walletStore.wallets,
        isBalanceVisible: getIsBalanceVisible(state.settingsStore)
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        dispatch
    }
}

WalletListScreen.contextType = ThemeContext

export default connect(mapStateToProps, mapDispatchToProps, null, { forwardRef: true })(WalletListScreen)

const styles = StyleSheet.create({
    container: {
        flex: 1
    },
    content: {
        flex: 1,
    },
    scrollViewContent: {
        flexGrow: 1,
    },
    topContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    addAssetButton: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 30,
        paddingRight: 14,
        paddingLeft: 10,
        paddingVertical: 5,
        borderRadius: 6,
        borderWidth: 1.5
    },
    addAsset__text: {
        fontSize: 10,
        fontFamily: 'Montserrat-Bold',
        textTransform: 'uppercase',
    },
    addAsset__icon: {
        marginRight: 2,
        marginTop: 1,
    },
    balanceTitle: {
        fontFamily: 'SFUIDisplay-Semibold',
        fontSize: 14,
        lineHeight: 18,
        letterSpacing: 1,
    },
    balanceValue: {
        fontFamily: 'Montserrat-SemiBold',
        fontSize: 17,
        lineHeight: 17,
        marginTop: 5
    },
    balanceValueHidden: {
        fontSize: 24,
        lineHeight: 25,
        marginBottom: -8
    }
})
