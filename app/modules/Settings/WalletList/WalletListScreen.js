/**
 * @version 0.43
 */
import React, { PureComponent } from 'react'
import { connect } from 'react-redux'
import { View, Text, StyleSheet, ScrollView } from 'react-native'

import NavStore from '@app/components/navigation/NavStore'

import { strings } from '@app/services/i18n'

import Wallet from './elements/Wallet'

import { ThemeContext } from '@app/theme/ThemeProvider'
import { HIT_SLOP } from '@app/theme/HitSlop'

import MarketingAnalytics from '@app/services/Marketing/MarketingAnalytics'
import { getIsBalanceVisible, getSettingsScreenData } from '@app/appstores/Stores/Settings/selectors'
import ScreenWrapper from '@app/components/elements/ScreenWrapper'

import { getWalletsGeneralData, getWalletsList } from '@app/appstores/Stores/Wallet/selectors'
import { getSelectedWalletData } from '@app/appstores/Stores/Main/selectors'
import BlocksoftPrettyNumbers from '@crypto/common/BlocksoftPrettyNumbers'

import BorderedButton from '@app/components/elements/new/buttons/BorderedButton'

class WalletListScreen extends PureComponent {

    state = {
        isBalanceVisible: false,
        isBalanceVisibleTriggered: false
    }

    triggerBalanceVisibility = (value) => {
        this.setState((state) => ({ isBalanceVisible: value, isBalanceVisibleTriggered: true }))
    }

    handleAddWallet = () => {
        NavStore.goNext('AddWalletScreen')
    }

    handleBack = () => {
        NavStore.goBack()
    }

    handleClose = () => {
        NavStore.goBack()
        NavStore.goBack()
    }

    renderHeader = () => {

        const {
            colors,
            GRID_SIZE
        } = this.context

        let { totalBalance, localCurrencySymbol } = this.props.walletsGeneralData

        const finalIsBalanceVisible = this.state.isBalanceVisible

        totalBalance = BlocksoftPrettyNumbers.makeCut(totalBalance).separated

        return(
            <View style={styles.headerContainer}>
                <View style={[styles.balanceContainer, { marginBottom: GRID_SIZE / 2 }]}>
                    <Text style={[styles.balanceTitle, { color: colors.common.text1 }]}>{strings('settings.walletList.totalBalance')}</Text>
                    {
                        finalIsBalanceVisible ? (
                            <Text style={[styles.balanceValue, { color: colors.common.text2 }]}>{localCurrencySymbol} {totalBalance}</Text>
                        ) : (
                            <Text style={[styles.balanceValue, styles.balanceValueHidden, { color: colors.common.text1, marginTop: 3 }]}>****</Text>
                        )
                    }
                </View>
                <View style={[styles.buttons, { marginBottom: GRID_SIZE }]}>
                    <BorderedButton
                        text={strings('settings.walletList.showBalance')}
                        onPressIn={() => this.triggerBalanceVisibility(true)}
                        onPressOut={() => this.triggerBalanceVisibility(false)}
                        containerStyles={{ marginHorizontal: GRID_SIZE / 2 }}
                        activeOpacity={0.7}
                        hitSlop={HIT_SLOP}
                    />
                    <BorderedButton
                        icon='plus'
                        text={strings('settings.walletList.addWallet')}
                        onPress={this.handleAddWallet}
                        containerStyles={{ marginHorizontal: GRID_SIZE / 2 }}
                    />
                </View>
            </View>
        )
    }

    render() {
        MarketingAnalytics.setCurrentScreen('Settings.WalletListScreen')

        const source = NavStore.getParamWrapper(this, 'source')

        const { walletsList } = this.props
        const { walletHash } =  this.props.selectedWalletData
        const { GRID_SIZE } = this.context

        return (
            <ScreenWrapper
                leftType='back'
                leftAction={this.handleBack}
                rightType='close'
                rightAction={this.handleClose}
                title={strings('settings.walletList.title')}
                ExtraView={this.renderHeader}
            >
                <ScrollView
                    bounces={false}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={[styles.scrollViewContent, { padding: GRID_SIZE }]}
                    keyboardShouldPersistTaps='handled'
                >
                    <View style={{ paddingBottom: GRID_SIZE }}>
                        {
                            walletsList.map((item, index) => {
                                return (
                                    <Wallet
                                        selectedWalletHash={walletHash}
                                        wallet={item}
                                        key={index}
                                        isBalanceVisible={this.state.isBalanceVisible}
                                        walletsLength={walletsList.length}
                                        settingsData={this.props.settingsData}
                                        source={source}
                                    />
                                )
                            })
                        }
                    </View>
                </ScrollView>
            </ScreenWrapper>
        )
    }
}

WalletListScreen.contextType = ThemeContext

const mapStateToProps = (state) => {
    return {
        selectedWalletData: getSelectedWalletData(state),
        walletsGeneralData: getWalletsGeneralData(state),
        walletsList: getWalletsList(state),
        isBalanceVisible: getIsBalanceVisible(state.settingsStore),
        settingsData: getSettingsScreenData(state)
    }
}

export default connect(mapStateToProps)(WalletListScreen)

const styles = StyleSheet.create({
    scrollViewContent: {
        flexGrow: 1
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
        textTransform: 'uppercase'
    },
    addAsset__icon: {
        marginRight: 2,
        marginTop: 1
    },
    balanceTitle: {
        fontFamily: 'Montserrat-SemiBold',
        fontSize: 18,
        lineHeight: 22
    },
    balanceValue: {
        fontFamily: 'SFUIDisplay-SemiBold',
        fontSize: 14,
        lineHeight: 20,
    },
    balanceValueHidden: {
        fontSize: 24,
        lineHeight: 25,
        marginBottom: -8
    },
    headerContainer: {

    },
    balanceContainer: {
        textAlign: 'center',
        alignItems: 'center'
    },
    buttons: {
        flexDirection: 'row',
        justifyContent: 'center'
    }
})
