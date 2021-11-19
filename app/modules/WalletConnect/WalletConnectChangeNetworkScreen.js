/**
 * @version 0.50
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

import { NETWORKS_SETTINGS } from './helpers'
import { getWalletConnectData } from '@app/appstores/Stores/WalletConnect/selectors'
import { AppWalletConnect } from '@app/services/Back/AppWalletConnect/AppWalletConnect'

class WalletConnectChangeNetworkScreen extends PureComponent {

    setNetwork = async (item) => {
        await AppWalletConnect.manualChangeChain(item.currencyCode)
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

        const { mainCurrencyCode } = this.props.walletConnectData

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
                        padding: GRID_SIZE,
                        paddingLeft: GRID_SIZE * 2
                    }]}
                    keyboardShouldPersistTaps='handled'
                >
                    {
                         NETWORKS_SETTINGS.map((item, index) => (
                            <ListItem
                                key={item.currencyCode}
                                checked={item.currencyCode === mainCurrencyCode}
                                title={item.networkTitle}
                                onPress={() => this.setNetwork(item)}
                                last={NETWORKS_SETTINGS.length - 1 === index}
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
