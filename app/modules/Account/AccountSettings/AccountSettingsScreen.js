/**
 * @version 0.43
 * @author yura
 */
import React from 'react'
import { connect } from 'react-redux'

import { ScrollView, View, SafeAreaView, StyleSheet } from 'react-native'

import NavStore from '@app/components/navigation/NavStore'

import SettingsBTC from './elements/SettingsBTC'
import SettingsUSDT from './elements/SettingsUSDT'
import SettingsXVG from './elements/SettingsXVG'
import SettingsETC from './elements/SettingsETC'
import SettingsETH from './elements/SettingsETH'
import SettingsXMR from './elements/SettingsXMR'
import SettingsTRX from './elements/SettingsTRX'
import SettingsBNB from './elements/SettingsBNB'

import { strings } from '@app/services/i18n'

import { ThemeContext } from '@app/modules/theme/ThemeProvider'
import Header from '@app/components/elements/new/Header'
import MarketingAnalytics from '@app/services/Marketing/MarketingAnalytics'

class AccountSettingScreen extends React.PureComponent {
    constructor() {
        super()
        this.state = {
            devMode: false,
            mode: '',
            testerMode: '',
            headerHeight: 0,
        }
    }

    setHeaderHeight = (height) => {
        const headerHeight = Math.round(height || 0);
        this.setState(() => ({ headerHeight }))
    }

    handleBack = () => {
        NavStore.goBack()
    }

    handleClose = () => {
        NavStore.reset('HomeScreen')
    }

    render() {
        const { colors } = this.context

        const { selectedWallet, cryptoCurrency, account } = this.props

        MarketingAnalytics.setCurrentScreen('Account.AccountSettingsScreen.' + cryptoCurrency.currencyCode)

        const { headerHeight } = this.state

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
        }
        return (
            <View style={[styles.container, { backgroundColor: colors.common.background }]}>
                <Header
                    leftType="back"
                    leftAction={this.handleBack}
                    rightType="close"
                    rightAction={this.handleClose}
                    title={strings('settings.title')}
                    setHeaderHeight={this.setHeaderHeight}
                />
                <SafeAreaView style={[styles.content, {
                    backgroundColor: colors.common.background,
                    marginTop: headerHeight,
                }]}>
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollViewContent}
                        keyboardShouldPersistTaps="handled"
                    >
                        <View style={{ marginTop: 20, marginHorizontal: 20 }}>
                            {settingsComponent}
                        </View>
                    </ScrollView>

                </SafeAreaView>
            </View>
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
    container: {
        flex: 1
    },
    content: {
        flex: 1,
    },
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
