/**
 * @version 0.52
 * @author yura
 */
import React from 'react'
import { connect } from 'react-redux'

import { ScrollView, View, StyleSheet, } from 'react-native'

import NavStore from '@app/components/navigation/NavStore'

import SettingsBTC from './elements/SettingsBTC'
import SettingsUSDT from './elements/SettingsUSDT'
import SettingsXVG from './elements/SettingsXVG'
import SettingsETC from './elements/SettingsETC'
import SettingsETH from './elements/SettingsETH'
import SettingsXMR from './elements/SettingsXMR'
import SettingsBNB from './elements/SettingsBNB'
import SettingsSOL from './elements/SettingsSOL'
import SettingsONE from './elements/SettingsONE'

import { strings } from '@app/services/i18n'

import { ThemeContext } from '@app/theme/ThemeProvider'
import MarketingAnalytics from '@app/services/Marketing/MarketingAnalytics'
import ScreenWrapper from '@app/components/elements/ScreenWrapper'
import AccountSettingsHeader from './elements/Header'
import SettingsBNBSmart from '@app/modules/Account/AccountSettings/elements/SettingsBNBSmart'

class AccountSettingScreen extends React.PureComponent {

    handleBack = () => {
        NavStore.goBack()
    }

    handleClose = () => {
        NavStore.goBack()
        NavStore.goBack()
    }

    renderSettingsComponent = () => {

        const { selectedWallet, account, cryptoCurrency } = this.props

        switch (account.currencyCode) {
            case 'BTC':
                return (
                    <SettingsBTC
                        containerStyle={{ overflow: 'hidden' }}
                        wallet={selectedWallet}
                    />
                )
            case 'USDT':
                return (
                    <SettingsUSDT
                        containerStyle={{ overflow: 'hidden' }}
                        wallet={selectedWallet}
                        account={account}
                    />
                )
            case 'XVG':
                return (
                    <SettingsXVG
                        containerStyle={{ overflow: 'hidden' }}
                        wallet={selectedWallet}
                        account={account}
                    />
                )
            case 'ETC':
                return (
                    <SettingsETC
                        containerStyle={{ overflow: 'hidden' }}
                        wallet={selectedWallet}
                        account={account}
                    />
                )
            case 'ETH':
                return (
                    <SettingsETH
                        containerStyle={{ overflow: 'hidden' }}
                        wallet={selectedWallet}
                        account={account}
                    />
                )
            case 'XMR':
                return (
                    <SettingsXMR
                        containerStyle={{ overflow: 'hidden' }}
                        wallet={selectedWallet}
                        account={account}
                    />
                )
            case 'BNB':
                return (
                    <SettingsBNB
                        containerStyle={{ overflow: 'hidden' }}
                        wallet={selectedWallet}
                        account={account}
                    />
                )
            case 'BNB_SMART':
                return (
                    <SettingsBNBSmart
                        containerStyle={{ overflow: 'hidden' }}
                        wallet={selectedWallet}
                        account={account}
                    />
                )
            case 'SOL':
                return (
                    <SettingsSOL
                        containerStyle={{ overflow: 'hidden' }}
                        wallet={selectedWallet}
                        account={account}
                        cryptoCurrency={cryptoCurrency}
                    />
                )
            case 'ONE':
                return (
                    <SettingsONE
                        containerStyle={{ overflow: 'hidden' }}
                        wallet={selectedWallet}
                        account={account}
                        cryptoCurrency={cryptoCurrency}
                    />
                )
            default:
                return null
        }

    }

    renderHeader = () => {

        const { isLight } = this.context
        const { cryptoCurrency } = this.props

        return (
            <AccountSettingsHeader
                color={isLight ? cryptoCurrency.mainColor : cryptoCurrency.darkColor}
            />
        )
    }

    render() {

        const { cryptoCurrency } = this.props

        const { GRID_SIZE } = this.context

        MarketingAnalytics.setCurrentScreen('Account.AccountSettingsScreen.' + cryptoCurrency.currencyCode)

        return (
            <ScreenWrapper
                leftType='back'
                leftAction={this.handleBack}
                rightType='close'
                rightAction={this.handleClose}
                title={strings('settings.title')}
            >
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollViewContent}
                    keyboardShouldPersistTaps='handled'
                >
                    <View style={{ paddingTop: GRID_SIZE, marginHorizontal: GRID_SIZE }}>
                        {this.renderSettingsComponent()}
                    </View>
                </ScrollView>

            </ScreenWrapper>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        selectedWallet: state.mainStore.selectedWallet,
        cryptoCurrency: state.mainStore.selectedCryptoCurrency,
        account: state.mainStore.selectedAccount,
    }
}

AccountSettingScreen.contextType = ThemeContext

export default connect(mapStateToProps)(AccountSettingScreen)

const styles = StyleSheet.create({
    scrollViewContent: {
        flexGrow: 1,
    }
})
