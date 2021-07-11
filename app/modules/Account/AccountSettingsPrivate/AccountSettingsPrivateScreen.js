/**
 * @version 0.50
 */
import React from 'react'
import { connect } from 'react-redux'

import { ScrollView, View, StyleSheet } from 'react-native'

import NavStore from '@app/components/navigation/NavStore'

import SettingsPrivateXMR from './elements/SettingsPrivateXMR'
import { strings } from '@app/services/i18n'

import { ThemeContext } from '@app/theme/ThemeProvider'
import MarketingAnalytics from '@app/services/Marketing/MarketingAnalytics'
import ScreenWrapper from '@app/components/elements/ScreenWrapper'

import { getSelectedAccountData, getSelectedWalletData } from '@app/appstores/Stores/Main/selectors'
import { getWalletsGeneralData } from '@app/appstores/Stores/Wallet/selectors'
import { getSettingsScreenData } from '@app/appstores/Stores/Settings/selectors'

class AccountSettingsPrivateScreen extends React.PureComponent {
    handleBack = () => {
        NavStore.goBack()
    }

    handleClose = () => {
        NavStore.goBack()
        NavStore.goBack()
        NavStore.goBack()
    }

    render() {

        const { selectedWalletData, selectedAccountData, settingsData } = this.props

        MarketingAnalytics.setCurrentScreen('Account.AccountSettingsPrivateScreen.' + selectedAccountData.currencyCode)

        let settingsComponent = null
        if (selectedAccountData.currencyCode === 'XMR') {
            settingsComponent =
                <SettingsPrivateXMR containerStyle={{ overflow: 'hidden' }}
                    selectedWalletData={selectedWalletData} selectedAccountData={selectedAccountData} settingsData={settingsData}/>
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
        selectedWalletData: getSelectedWalletData(state),
        selectedAccountData: getSelectedAccountData(state),
        settingsData: getSettingsScreenData(state),
    }
}

AccountSettingsPrivateScreen.contextType = ThemeContext

export default connect(mapStateToProps, {})(AccountSettingsPrivateScreen)

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
