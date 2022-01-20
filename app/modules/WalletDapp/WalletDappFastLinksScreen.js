/**
 * @version 0.50
 */
import React, { PureComponent } from 'react'
import {
    StyleSheet,
    ScrollView,
    View,
    ActivityIndicator,
    // RefreshControl
} from 'react-native'
import { connect } from 'react-redux'
import { FlatList } from 'react-native-gesture-handler'

import NavStore from '@app/components/navigation/NavStore'
import ScrollingList from '@app/components/elements/new/ScrollingList'
import DappListItem from './elements/DappListItem'
// import ListItem from '@app/components/elements/new/list/ListItem/Setting'

import { ThemeContext } from '@app/theme/ThemeProvider'
import MarketingAnalytics from '@app/services/Marketing/MarketingAnalytics'

import dappsBlocksoftDict from '@crypto/assets/dappsBlocksoftDict.json'
import WalletConnectNetworksDict from '@crypto/assets/WalletConnectNetworksDict.json'

import { getWalletDappData } from '@app/appstores/Stores/WalletDapp/selectors'
import { setWalletDapp } from '@app/appstores/Stores/WalletDapp/WalletDappStoreActions' // setWalletDappIncognito
import { getVisibleCurrencies } from '@app/appstores/Stores/Currency/selectors'

class WalletDappFastLinksScreen extends PureComponent {

    state = {
        selectedNetwork: 0,
        networks: [],
        dapps: [],
        localDapps: []
    }

    async componentDidMount() {
        this.loadNetworks()
        await this.loadDapps()
        await this.handlefilterDapps(0)
    }

    setDapp = async (item) => {
        setWalletDapp(item)
        NavStore.goNext('WalletDappWebViewScreen')
    }

    loadNetworks = () => {
        const networks = [{"currencyCode": "ALL", "networkTitle": "All"}]

        for (const key in WalletConnectNetworksDict) {
            const item = WalletConnectNetworksDict[key]
            networks.push(item)
        }

        this.setState({networks})
    }

    loadDapps = async () => {

        const localDapps = []

        const indexedCurrencies = {}
        for (const item of this.props.currencies) {
            indexedCurrencies[item.currencyCode] = 1
        }
        for (const key in dappsBlocksoftDict) {
            const item = dappsBlocksoftDict[key]
            if (typeof item.dappNetworks === 'undefined') {
                localDapps.push(item)
                break
            }
            for (const code of item.dappNetworks) {
                if (typeof indexedCurrencies[code] !== 'undefined') {
                    localDapps.push(item)
                    break
                }
            }

        }

        this.setState({
            dapps: localDapps
        })
    }

    handleSelectNetwork = async (index) => {
        this.setState({
            selectedNetwork: index
        })
        await this.handlefilterDapps(index)
    }

    handlefilterDapps =  async (index) => {
        const {
            networks,
            dapps
        } = this.state

        if (index === 0) {
            this.setState({
                localDapps: dapps
            })
        } else {
            const filteredDapps = dapps.filter(item => item.dappNetworks.includes(networks[index].currencyCode))
            this.setState({
                localDapps: filteredDapps
            })
        }
    }

    // handleRefresh = async () => {
    //     await this.handlefilterDapps(this.state.selectedNetwork)
    // }

    // handleIncognito = () => {
    //     setWalletDappIncognito(!this.props.walletDappData.incognito)
    // }

    renderListItem = ({ item, index }) => {

        const last = this.state.localDapps.length -1 === index

        return (
            <DappListItem
                data={item}
                last={last}
                onPress={this.setDapp}
            />
        )
    }

    renderNetworksList = () => {

        const {
            networks,
            selectedNetwork
        } = this.state

        return(
            <ScrollingList
                data={networks}
                onPress={this.handleSelectNetwork}
                active={selectedNetwork}
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

        const { localDapps } = this.state

        // const { dappCode, incognito } = this.props.walletDappData
        // const filtered = dapps.filter((item, index) => )

        return (
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollViewContent}
                keyboardShouldPersistTaps='handled'
                setHeaderHeight={this.setHeaderHeight}
            >
                {this.renderNetworksList()}
                <View>
                    <FlatList
                        data={localDapps}
                        keyExtractor={({ index }) => index}
                        horizontal={false}
                        showsVerticalScrollIndicator={false}
                        renderItem={this.renderListItem}
                        ListEmptyComponent={this.renderEmptyComponent}
                    />
                </View>
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

// <View style={{ marginTop: GRID_SIZE / 2, marginHorizontal: GRID_SIZE }}>
//     <ListItem
//         key='clean'
//         title='New session'
//         subtitle='Open, if it possible'
//         checked={incognito}
//         onPress={() => this.handleIncognito()}
//         rightContent='switch'
//         switchParams={{
//             onPress: () => this.handleIncognito(),
//             value: incognito
//         }}
//         iconType='wallet'
//         last
//     />
// </View>
WalletDappFastLinksScreen.contextType = ThemeContext

export default connect(mapStateToProps)(WalletDappFastLinksScreen)

const styles = StyleSheet.create({
    scrollViewContent: {
        flexGrow: 1
    }
})
