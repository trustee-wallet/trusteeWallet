/**
 * @version 0.50
 */
import React, { PureComponent } from 'react'
import { View, ScrollView, StyleSheet } from 'react-native'

import NavStore from '@app/components/navigation/NavStore'

import { strings } from '@app/services/i18n'

import { setFlowType, setMnemonicLength, setWalletName } from '@app/appstores/Stores/CreateWallet/CreateWalletActions'

import { ThemeContext } from '@app/theme/ThemeProvider'
import ListItem from '@app/components/elements/new/list/ListItem/Setting'

import MarketingAnalytics from '@app/services/Marketing/MarketingAnalytics'
import MarketingEvent from '@app/services/Marketing/MarketingEvent'
import ScreenWrapper from '@app/components/elements/ScreenWrapper'

import trusteeAsyncStorage from '@appV2/services/trusteeAsyncStorage/trusteeAsyncStorage'
class AddWalletScreen extends PureComponent {

    state = {
        devMode: trusteeAsyncStorage.getDevMode()
    }

    handleImport = () => {
        const walletNumber = (MarketingEvent.DATA.LOG_WALLETS_COUNT * 1 + 1).toString()
        MarketingEvent.logEvent('gx_view_create_import_screen_tap_import', { walletNumber, source: 'WalletAddScreen' }, 'GX')
        setFlowType({ flowType: 'IMPORT_WALLET', source: 'WalletAddScreen', walletNumber })
        setWalletName({ walletName: '' })
        NavStore.goNext('EnterMnemonicPhrase', { flowSubtype: 'importAnother' })
    }

    handleBackupSearchWallet = () => {
        NavStore.goNext('BackupSearchWallet')
    }

    handleCreate = () => {
        const walletNumber = (MarketingEvent.DATA.LOG_WALLETS_COUNT * 1 + 1).toString()
        MarketingEvent.logEvent('gx_view_create_import_screen_tap_create', { walletNumber, source: 'WalletAddScreen' }, 'GX')
        setFlowType({ flowType: 'CREATE_NEW_WALLET', source: 'WalletAddScreen', walletNumber })
        setWalletName({ walletName: '' })
        setMnemonicLength({ mnemonicLength: 128 })
        NavStore.goNext('BackupStep0Screen', { flowSubtype: 'createAnother' })
    }

    handleBack = () => {
        NavStore.goBack()
    }

    handleClose = () => {
        NavStore.goBack()
        NavStore.goBack()
        NavStore.goBack()
    }

    render() {
        MarketingAnalytics.setCurrentScreen('WalletManagement.AddWallet')

        const { GRID_SIZE } = this.context

        return (
            <ScreenWrapper
                leftType="back"
                leftAction={this.handleBack}
                rightType="close"
                rightAction={this.handleClose}
                title={strings('settings.walletManagement.addWallet.title')}
            >
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollViewContent}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={{ padding: GRID_SIZE }}>
                        {this.state.devMode && (
                            <ListItem
                                title={'Restore Removed wallet'}
                                subtitle={'only dev mode'}
                                iconType="config"
                                onPress={this.handleBackupSearchWallet}
                                rightContent="arrow"
                            />
                        )}
                        <ListItem
                            title={strings('settings.walletManagement.addWallet.importTitle')}
                            subtitle={strings('settings.walletManagement.addWallet.importSubtitle')}
                            iconType="importWallet"
                            onPress={this.handleImport}
                            rightContent="arrow"
                        />
                        <ListItem
                            title={strings('settings.walletManagement.addWallet.createTitle')}
                            iconType="wallet"
                            onPress={this.handleCreate}
                            rightContent="arrow"
                            last
                        />
                    </View>
                </ScrollView>
            </ScreenWrapper>
        )
    }
}

AddWalletScreen.contextType = ThemeContext

export default AddWalletScreen

const styles = StyleSheet.create({
    scrollViewContent: {
        flexGrow: 1,
    },
})
