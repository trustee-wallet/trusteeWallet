
import React from 'react'
import {
    View,
    Text,
    ScrollView,
    SafeAreaView,
    StyleSheet
} from 'react-native'



import NavStore from '../../components/navigation/NavStore'

import { strings } from '../../services/i18n'

import { setFlowType, setMnemonicLength, setWalletName } from '../../appstores/Stores/CreateWallet/CreateWalletActions'

import { ThemeContext } from '../../modules/theme/ThemeProvider'
import Header from '../../components/elements/new/Header'
import ListItem from '../../components/elements/new/list/ListItem/Setting'
import MarketingAnalytics from '../../services/Marketing/MarketingAnalytics'
import DaemonCache from '../../daemons/DaemonCache'
import MarketingEvent from '../../services/Marketing/MarketingEvent'


class AddWalletScreen extends React.Component {
    state = {
        headerHeight: 0,
    }

    setHeaderHeight = (height) => {
        const headerHeight = Math.round(height || 0);
        this.setState(() => ({ headerHeight }))
    }

    handleImport = () => {
        let number = DaemonCache.CACHE_WALLET_COUNT + 1
        number = number ? number.toString() : '1'
        MarketingEvent.logEvent('gx_view_create_import_screen_tap_import', {number, source : 'AddWalletScreen'}, 'GX')
        setFlowType({
            flowType: 'IMPORT_WALLET'
        })
        setWalletName({ walletName: '' })
        NavStore.goNext('EnterMnemonicPhrase', { flowSubtype: 'importAnother' })
    }

    handleCreate = () => {
        let number = DaemonCache.CACHE_WALLET_COUNT + 1
        number = number ? number.toString() : '1'
        MarketingEvent.logEvent('gx_view_create_import_screen_tap_create', {number, source : 'AddWalletScreen'}, 'GX')
        setFlowType({ flowType: 'CREATE_NEW_WALLET' })
        setWalletName({ walletName: '' })
        setMnemonicLength({ mnemonicLength: 128 })
        NavStore.goNext('BackupStep0Screen', { flowSubtype: 'createAnother' })
    }

    handleBack = () => { NavStore.goBack() }

    handleClose = () => { NavStore.reset('DashboardStack') }

    render() {
        MarketingAnalytics.setCurrentScreen('WalletManagment.AddWallet')

        const { colors, GRID_SIZE } = this.context
        const { headerHeight } = this.state

        return (
            <View style={[styles.container, { backgroundColor: colors.common.background }]}>
                <Header
                    leftType="back"
                    leftAction={this.handleBack}
                    rightType="close"
                    rightAction={this.handleClose}
                    title={strings('settings.walletManagement.addWallet.title')}
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
                        <View style={{ padding: GRID_SIZE }}>
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
                </SafeAreaView>
            </View>
        )
    }
}

AddWalletScreen.contextType = ThemeContext

export default AddWalletScreen

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
})
