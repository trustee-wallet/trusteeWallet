/**
 * @version 0.43
 */
import React, { PureComponent } from 'react'
import { connect } from 'react-redux'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'

import EntypoIcon from 'react-native-vector-icons/Entypo'

import NavStore from '@app/components/navigation/NavStore'

import { strings } from '@app/services/i18n'

import Wallet from './elements/Wallet'

import { ThemeContext } from '@app/theme/ThemeProvider'

import MarketingAnalytics from '@app/services/Marketing/MarketingAnalytics'
import { getIsBalanceVisible, getSettingsScreenData } from '@app/appstores/Stores/Settings/selectors'
import ScreenWrapper from '@app/components/elements/ScreenWrapper'

import { getWalletsGeneralData, getWalletsList } from '@app/appstores/Stores/Wallet/selectors'
import { getSelectedWalletData } from '@app/appstores/Stores/Main/selectors'
import BlocksoftPrettyNumbers from '@crypto/common/BlocksoftPrettyNumbers'

class WalletListScreen extends PureComponent {

    constructor(props) {
        super(props)
        this.state = {
            isBalanceVisible: false,
            isBalanceVisibleTriggered: false
        }
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

    render() {
        MarketingAnalytics.setCurrentScreen('Settings.WalletListScreen')

        const source = NavStore.getParamWrapper(this, 'source')

        const { walletsList } = this.props
        const { walletHash } =  this.props.selectedWalletData
        let { totalBalance, localCurrencySymbol } = this.props.walletsGeneralData
        const { colors, GRID_SIZE } = this.context

        const { isBalanceVisible, isBalanceVisibleTriggered } = this.state
        const originalVisibility = this.props.isBalanceVisible
        const finalIsBalanceVisible = isBalanceVisibleTriggered ? isBalanceVisible : originalVisibility

        totalBalance = BlocksoftPrettyNumbers.makeCut(totalBalance).separated

        return (
            <ScreenWrapper
                leftType='back'
                leftAction={this.handleBack}
                rightType='close'
                rightAction={this.handleClose}
                title={strings('settings.walletList.title')}
            >
                <ScrollView
                    bounces={false}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={[styles.scrollViewContent, { padding: GRID_SIZE }]}
                    keyboardShouldPersistTaps='handled'
                >
                    <View style={[styles.topContent, { paddingHorizontal: GRID_SIZE / 2, paddingTop: GRID_SIZE / 2, paddingBottom: GRID_SIZE }]}>
                        <TouchableOpacity
                            onPressIn={() => this.triggerBalanceVisibility(true, originalVisibility)}
                            onPressOut={() => this.triggerBalanceVisibility(false, originalVisibility)}
                            activeOpacity={0.9}
                            disabled={originalVisibility}
                            hitSlop={{ top: 20, left: 20, right: isBalanceVisible ? 60 : 20, bottom: 30 }}
                        >
                            <Text style={[styles.balanceTitle, { color: colors.common.text2 }]}>{strings('settings.walletList.totalBalance')}</Text>
                            {
                                finalIsBalanceVisible ? (
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
                            <EntypoIcon style={[styles.addAsset__icon, { color: colors.common.text3 }]} size={13} name='plus' />
                            <Text style={[styles.addAsset__text, { color: colors.common.text3 }]}>
                                {strings('settings.walletList.addWallet')}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <View style={{ paddingBottom: GRID_SIZE }}>
                        {
                            walletsList.map((item, index) => {
                                return (
                                    <Wallet
                                        selectedWalletHash={walletHash}
                                        wallet={item}
                                        key={index}
                                        isBalanceVisible={this.state.isBalanceVisible}
                                        isBalanceVisibleTriggered={this.state.isBalanceVisibleTriggered}
                                        originalVisibility={this.props.isBalanceVisible}
                                        triggerBalanceVisibility={this.triggerBalanceVisibility}
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
        fontFamily: 'SFUIDisplay-Semibold',
        fontSize: 14,
        lineHeight: 18,
        letterSpacing: 1
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
