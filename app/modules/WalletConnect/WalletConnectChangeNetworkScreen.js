/**
 * @version 1.0
 */
import React, { PureComponent } from 'react'
import { connect } from 'react-redux'
import { StyleSheet, ScrollView } from 'react-native'

import NavStore from '@app/components/navigation/NavStore'

import { strings } from '@app/services/i18n'

import { ThemeContext } from '@app/theme/ThemeProvider'

import ListItem from '@app/components/elements/new/list/ListItem/SubSetting'
import MarketingAnalytics from '@app/services/Marketing/MarketingAnalytics'
import ScreenWrapper from '@app/components/elements/ScreenWrapper'


import { NETWORKS_SETTINGS } from '@app/appstores/Stores/WalletConnect/settings'

import { getWalletConnectData } from '@app/appstores/Stores/WalletConnect/selectors'
import walletConnectActions from '@app/appstores/Stores/WalletConnect/WalletConnectStoreActions'

class WalletConnectChangeNetworkScreen extends PureComponent {

    setNetwork = async (item) => {
        await walletConnectActions.getAndSetWalletConnectAccountNetwork(false, item.currencyCode, 'WalletConnectChangeNetworkScreen')
        this.handleClose()
    }

    handleBack = () => {
        NavStore.goBack()
    }

    handleClose = () => {
        NavStore.goBack()
    }

    render() {
        MarketingAnalytics.setCurrentScreen('WalletConnect.changeNetworkScreen')

        const { accountCurrencyCode } = this.props.walletConnectData

        const { GRID_SIZE } = this.context

        return (
            <ScreenWrapper
                leftType='back'
                leftAction={this.handleBack}
                rightType='close'
                rightAction={this.handleClose}
                title={strings('settings.walletConnect.changeNetwork')}
                setHeaderHeight={this.setHeaderHeight}
            >
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={[styles.scrollViewContent, {
                        padding: GRID_SIZE
                    }]}
                    keyboardShouldPersistTaps='handled'
                >
                    {
                        NETWORKS_SETTINGS.map((item, index) => (
                            <ListItem
                                key={item.currencyCode}
                                checked={item.currencyCode === accountCurrencyCode}
                                title={item.networkTitle}
                                onPress={() => this.setNetwork(item)}
                                last={NETWORKS_SETTINGS.length - 1 === index}
                                iconType={item.currencyCode.toLowerCase()}
                                containerStyle={{ paddingVertical: GRID_SIZE / 3 }}
                            />
                        ))
                    }
                </ScrollView>
            </ScreenWrapper>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        walletConnectData: getWalletConnectData(state)
    }
}

WalletConnectChangeNetworkScreen.contextType = ThemeContext

export default connect(mapStateToProps)(WalletConnectChangeNetworkScreen)

const styles = StyleSheet.create({
    scrollViewContent: {
        flexGrow: 1
    }
})
