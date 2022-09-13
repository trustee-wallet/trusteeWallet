/**
 * @version 1.0
 */
import React, { PureComponent } from 'react'
import {
    StyleSheet,
    ScrollView,
    View,
    ActivityIndicator
} from 'react-native'
import { connect } from 'react-redux'
import { FlatList } from 'react-native-gesture-handler'

import NavStore from '@app/components/navigation/NavStore'
import ScrollingList from '@app/components/elements/new/ScrollingList'
import DappListItem from './elements/DappListItem'

import { ThemeContext } from '@app/theme/ThemeProvider'
import MarketingAnalytics from '@app/services/Marketing/MarketingAnalytics'

import dappsBlocksoftDict from '@crypto/assets/dappsBlocksoftDict.json'
import tokenBlockchainBlocksoftDict from '@crypto/assets/tokenBlockchainBlocksoftDict.json'

import { getWalletDappData } from '@app/appstores/Stores/WalletDapp/selectors'
import { setWalletDapp } from '@app/appstores/Stores/WalletDapp/WalletDappStoreActions'
import { getVisibleCurrencies } from '@app/appstores/Stores/Currency/selectors'
import MarketingEvent from '@app/services/Marketing/MarketingEvent'

class WalletDappFastLinksScreen extends PureComponent {

    state = {
        selectedIndex: 0,
        networks: [{ 'currencyCode': 'ALL', 'networkTitle': 'All' }],
        dapps: [],
        localDapps: []
    }

    async componentDidMount() {
        MarketingEvent.logEvent('wallet_dapps_list', {})
        await this.loadDapps()
        await this.handleFilterDapps(0)
    }

    setDapp = async (item) => {
        setWalletDapp(item)
        MarketingEvent.logEvent('wallet_dapps_list_select', item)
        NavStore.goNext('WalletDappWebViewScreen')
    }


    loadDapps = async () => {

        const localDapps = []
        const localNetworks = {}
        const indexedCurrencies = {}
        const extendDict = tokenBlockchainBlocksoftDict
        for (const item of this.props.currencies) {
            indexedCurrencies[item.currencyCode] = 1
        }
        for (const blockchainCode in tokenBlockchainBlocksoftDict) {
            const blockchain = tokenBlockchainBlocksoftDict[blockchainCode]
            extendDict[blockchain.currencyCode] = blockchain
        }
        for (const key in dappsBlocksoftDict) {
            const item = dappsBlocksoftDict[key]
            if (typeof item.dappNetworks === 'undefined') {
                localDapps.push(item)
                break
            }

            let found = false
            for (const code of item.dappNetworks) {
                // uncomment to filter by chains/tokens if (typeof indexedCurrencies[code] === 'undefined') continue

                if (typeof item.dappCoins === 'undefined') {
                    localDapps.push(item)
                    localNetworks[code] = 1
                    break
                }
                for (const code2 of item.dappCoins) { // some dapps shown only in special networks when some tokens are selected
                    // uncomment to filter by chains/tokens if (typeof indexedCurrencies[code2] === 'undefined') continue
                    localDapps.push(item)
                    found = true
                    break
                }
                if (found) {
                    localNetworks[code] = 1
                    break
                }
            }
        }

        const networks = [{ 'currencyCode': 'ALL', 'networkTitle': 'All' }]
        for (const code in localNetworks) {
            const item = extendDict[code]
            const networkTitle = typeof item.dappsListName !== 'undefined' ? item.dappsListName : item.blockchainName
            networks.push({ currencyCode: code, networkTitle })
        }

        this.setState({
            dapps: localDapps,
            networks
        })

    }

    handleSelectIndex = async (selectedIndex) => {
        this.setState({ selectedIndex })
        await this.handleFilterDapps(selectedIndex)
    }

    handleFilterDapps = async (index) => {
        const {
            networks,
            dapps
        } = this.state

        if (index === 0) {
            this.setState({
                localDapps: dapps
            })
        } else {
            this.setState({
                localDapps: dapps.filter(item => item.dappNetworks.includes(networks[index].currencyCode))
            })
        }
    }

    renderListItem = ({ item, index }) => {

        const last = this.state.localDapps.length - 1 === index

        return (
            <DappListItem
                data={item}
                last={last}
                onPress={this.setDapp}
            />
        )
    }

    renderEmptyComponent = () => {

        const {
            colors,
            GRID_SIZE
        } = this.context

        return (
            <View style={[styles.loader, { marginTop: GRID_SIZE }]}>
                <ActivityIndicator
                    color={colors.common.text1}
                    size='large'
                />
            </View>
        )
    }

    render() {
        MarketingAnalytics.setCurrentScreen('WalletDapp.FastLinkScreen')

        const { localDapps, networks, selectedIndex } = this.state

        return (
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollViewContent}
                keyboardShouldPersistTaps='handled'
                setHeaderHeight={this.setHeaderHeight}
            >
                <ScrollingList
                    data={networks}
                    onPress={this.handleSelectIndex}
                    active={selectedIndex}
                />
                <FlatList
                    data={localDapps}
                    keyExtractor={(item) => item.dappCode.toString()}
                    showsVerticalScrollIndicator={false}
                    renderItem={this.renderListItem}
                    ListEmptyComponent={this.renderEmptyComponent}
                />
            </ScrollView>
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
