/**
 * @version 0.43
 * @author yura
 */
import React from 'react'
import { connect } from 'react-redux'

import { ScrollView, View, StyleSheet } from 'react-native'

import NavStore from '@app/components/navigation/NavStore'

import SettingsBTC from './elements/SettingsBTC'
import SettingsUSDT from './elements/SettingsUSDT'
import SettingsXVG from './elements/SettingsXVG'
import SettingsETC from './elements/SettingsETC'
import SettingsETH from './elements/SettingsETH'
import SettingsXMR from './elements/SettingsXMR'
import SettingsTRX from './elements/SettingsTRX'
import SettingsBNB from './elements/SettingsBNB'
import SettingsSOL from '@app/modules/Account/AccountSettings/elements/SettingsSOL'

import { strings } from '@app/services/i18n'

import { ThemeContext } from '@app/theme/ThemeProvider'
import MarketingAnalytics from '@app/services/Marketing/MarketingAnalytics'
import ScreenWrapper from '@app/components/elements/ScreenWrapper'

class AccountSettingScreen extends React.PureComponent {
    constructor() {
        super()
        this.state = {
            devMode: false,
            mode: '',
            testerMode: '',
        }
    }

    handleBack = () => {
        NavStore.goBack()
    }

    handleClose = () => {
        NavStore.goBack()
        NavStore.goBack()
    }

    render() {

        const { selectedWallet, cryptoCurrency, account } = this.props

        MarketingAnalytics.setCurrentScreen('Account.AccountSettingsScreen.' + cryptoCurrency.currencyCode)

        let settingsComponent = null
        if (account.currencyCode === 'BTC') {
            settingsComponent =
                <SettingsBTC containerStyle={{ overflow: 'hidden' }}
                    wallet={selectedWallet} />
        } else if (account.currencyCode === 'USDT') {
            settingsComponent =
                <SettingsUSDT containerStyle={{ overflow: 'hidden' }}
                    wallet={selectedWallet} account={account} />
        } else if (account.currencyCode === 'XVG') {
            settingsComponent =
                <SettingsXVG containerStyle={{ overflow: 'hidden' }}
                    wallet={selectedWallet} account={account} />
        } else if (account.currencyCode === 'ETC') {
            settingsComponent =
                <SettingsETC containerStyle={{ overflow: 'hidden' }}
                    wallet={selectedWallet} account={account} />
        } else if (account.currencyCode === 'ETH') {
            settingsComponent =
                <SettingsETH containerStyle={{ overflow: 'hidden' }} />
        } else if (account.currencyCode === 'XMR') {
            settingsComponent =
                <SettingsXMR containerStyle={{ overflow: 'hidden' }}
                    wallet={selectedWallet} account={account} />
        } else if (account.currencyCode === 'TRX') {
            settingsComponent =
                <SettingsTRX containerStyle={{ overflow: 'hidden' }}
                    wallet={selectedWallet} account={account} />
        } else if (account.currencyCode === 'BNB') {
            settingsComponent =
                <SettingsBNB containerStyle={{ overflow: 'hidden' }}
                    wallet={selectedWallet} account={account} />
        } else if (account.currencyCode === 'SOL') {
            settingsComponent =
                <SettingsSOL containerStyle={{ overflow: 'hidden' }}
                             wallet={selectedWallet} account={account} />
        }
        return (
            <ScreenWrapper
                leftType="back"
                leftAction={this.handleBack}
                rightType="close"
                rightAction={this.handleClose}
                title={strings('settings.title')}
            >
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollViewContent}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={{ marginTop: 20, marginHorizontal: 20 }}>
                        {settingsComponent}
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

export default connect(mapStateToProps, {})(AccountSettingScreen)

const styles = StyleSheet.create({
    scrollViewContent: {
        flexGrow: 1,
    },
    blockTitle: {
        fontFamily: 'Montserrat-Bold',
        fontSize: 12,
        lineHeight: 14,
        letterSpacing: 1.5,
        textTransform: 'uppercase',
    },
})
