/**
 * @version 0.50
 */
import React, { PureComponent } from 'react'
import { connect } from 'react-redux'
import { StyleSheet, ScrollView } from 'react-native'

import NavStore from '@app/components/navigation/NavStore'

import { ThemeContext } from '@app/theme/ThemeProvider'
import ListItem from '@app/components/elements/new/list/ListItem/Setting'
import MarketingAnalytics from '@app/services/Marketing/MarketingAnalytics'
import ScreenWrapper from '@app/components/elements/ScreenWrapper'

import dappsBlocksoftDict from '@crypto/assets/dappsBlocksoftDict.json'
import { getWalletDappData } from '@app/appstores/Stores/WalletDapp/selectors'
import { setWalletDapp, setWalletDappIncognito } from '@app/appstores/Stores/WalletDapp/WalletDappStoreActions'
import { getVisibleCurrencies } from '@app/appstores/Stores/Currency/selectors'

class WalletDappFastLinksScreen extends PureComponent {

    setDapp = async (item) => {
        setWalletDapp(item)
        NavStore.goNext('WalletDappWebViewScreen')
    }

    handleIncognito = () => {
        setWalletDappIncognito(!this.props.walletDappData.incognito)
    }

    handleBack = () => {
        NavStore.goBack()
    }

    handleClose = () => {
        NavStore.goBack()
    }

    render() {
        MarketingAnalytics.setCurrentScreen('WalletDapp.FastLinkScreen')

        const { dappCode, incognito } = this.props.walletDappData

        const { GRID_SIZE } = this.context

        const mapping = []

        const indexedCurrencies = {}
        for (const item of this.props.currencies) {
            indexedCurrencies[item.currencyCode] = 1
        }
        for (const key in dappsBlocksoftDict) {
            const item = dappsBlocksoftDict[key]
            if (typeof item.dappNetworks === 'undefined') {
                mapping.push(item)
                break
            }
            for (const code of item.dappNetworks) {
                if (typeof indexedCurrencies[code] !== 'undefined') {
                    mapping.push(item)
                    break
                }
            }
        }
        return (
            <ScreenWrapper
                leftType='back'
                leftAction={this.handleBack}
                rightType='close'
                rightAction={this.handleClose}
                title={'Dapps'}
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
                    <ListItem
                        key='clean'
                        title='Open new session if possible'
                        checked={incognito}
                        onPress={() => this.handleIncognito()}
                        rightContent='checkbox'
                    />
                    {
                        mapping.map((item, index) => (
                            <ListItem
                                key={item.dappCode}
                                checked={item.dappCode === dappCode}
                                title={item.dappName}
                                onPress={() => this.setDapp(item)}
                                rightContent='arrow'
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
        walletDappData: getWalletDappData(state),
        currencies: getVisibleCurrencies(state)
    }
}

WalletDappFastLinksScreen.contextType = ThemeContext

export default connect(mapStateToProps)(WalletDappFastLinksScreen)

const styles = StyleSheet.create({
    scrollViewContent: {
        flexGrow: 1
    }
})
