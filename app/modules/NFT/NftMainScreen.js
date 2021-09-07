/**
 * @version 0.50
 * @author Vadym
 */

import React from 'react'
import {
    View,
    FlatList,
    Dimensions
} from 'react-native'

import ScreenWrapper from '@app/components/elements/ScreenWrapper'
import { strings } from '@app/services/i18n'
import NavStore from '@app/components/navigation/NavStore'
import HeaderInfo from '@app/modules/NFT/elements/HeaderInfo'
import Tabs from '@app/components/elements/new/Tabs'
import { ThemeContext } from '@app/theme/ThemeProvider'
import FlatListItem from '@app/modules/NFT/elements/FlatListItem'
import NftTokenValue from '@app/modules/NFT/elements/NftTokenValue'
import FlatListCollections from '@app/modules/NFT/elements/FlatListCollections'
import { getSelectedCryptoCurrencyData, getSelectedWalletData } from '@app/appstores/Stores/Main/selectors'
import { connect } from 'react-redux'
import store from '@app/store'
import BlocksoftTokenNfts from '@crypto/actions/BlocksoftTokenNfts/BlocksoftTokenNfts'
import config from '@app/config/config'
import Log from '@app/services/Log/Log'

const { width: WINDOW_WIDTH } = Dimensions.get('window')

class NftMainScreen extends React.PureComponent {

    state = {

        numColumns: WINDOW_WIDTH >= (182 * 3) + this.context.GRID_SIZE * 4 ? 3 : 2,

        tabs: [
            {
                title: strings('nftMainScreen.all'),
                index: 0,
                active: true
            },
            {
                title: strings('nftMainScreen.collections'),
                index: 1,
                active: false
            }
        ],

        data: {
            assets: [],
            collections : [],
            usdTotalPretty : ''
        }
    }


    async componentDidMount() {
        return this.handleRefresh()
    }

    handleRefresh = async () => {
        try {
            const { walletHash } = this.props.wallet
            const { tokenBlockchainCode } = this.props.cryptoCurrency
            const basicAccounts = store.getState().accountStore.accountList
            let address = ''
            if (typeof basicAccounts[walletHash] !== 'undefined') {
                if (typeof basicAccounts[walletHash][tokenBlockchainCode] !== 'undefined') {
                    address = basicAccounts[walletHash][tokenBlockchainCode].address
                } else if (tokenBlockchainCode !== 'TRX') {
                    address = basicAccounts[walletHash]['ETH'].address
                }
            }
            const newData = await BlocksoftTokenNfts.getList({ tokenBlockchainCode, address })
            if (newData) {
                this.setState({ data: newData })
            }
        } catch (e) {
            if (config.debug.appErrors) {
                console.log('NftMainScreen.handleRefresh error ' + e.message)
            }
            Log.log('NftMainScreen.handleRefresh error ' + e.message)
        }
    }

    handleBack = () => {
        NavStore.goBack()
    }

    handleClose = () => {
        NavStore.reset('TabBar')
    }

    renderHeaderInfo = () => {
        return <HeaderInfo usdTotalPretty={this.state.data.usdTotalPretty}/>
    }

    renderTabs = () => <Tabs
        tabs={this.state.tabs}
        changeTab={this.handleChangeTab}
        containerStyle={{ paddingVertical: this.context.GRID_SIZE, width: '60%', alignSelf: 'center' }}
    />

    handleCollection = () => {
        NavStore.goNext('NftCollectionView')
    }

    handleToken = () => {
        NavStore.goNext('NftDetailedInfo')
    }

    renderFlatListItem = ({ item, index }) => {

        const {
            numColumns
        } = this.state

        return (
            <FlatListItem
                numColumns={numColumns}
                data={item}
                margin={index % numColumns === 0}
                onPress={this.handleToken}
            />
        )
    }

    renderFlatListCollections = ({ item }) => {
        return (
            <FlatListCollections
                data={item}
                onPress={this.handleCollection}
            />
        )
    }

    renderFlatList = () => {

        const {
            numColumns,
            tabs,
            data
        } = this.state

        const flatListCollectionsData = data.collections
        const flatListData = []
        for (const asset of data.assets) {
            flatListData.push({
                img: asset.img,
                title: asset.title,
                subTitle: asset.subTitle,
                ExtraViewData: () => {
                    return (
                        <NftTokenValue
                            walletCurrency={asset.cryptoCurrencySymbol}
                            balance={asset.cryptoValuePretty}
                            balanceData={asset.usdValuePretty} // @vadym its very bad names of fields
                            currencySymbol={'$'}
                        />
                    )
                }
            })
        }

        return (
            <View style={{ flex: 1 }}>
                {tabs[0].active && (
                    <FlatList
                        data={flatListData}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingTop: this.context.GRID_SIZE }}
                        renderItem={this.renderFlatListItem}
                        horizontal={false}
                        numColumns={numColumns}
                        ListHeaderComponent={this.renderTabs}
                        keyExtractor={({ index }) => index}
                    />
                )}
                {tabs[1].active && (
                    <FlatList
                        data={flatListCollectionsData}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingTop: this.context.GRID_SIZE }}
                        renderItem={this.renderFlatListCollections}
                        ListHeaderComponent={this.renderTabs}
                        keyExtractor={({ index }) => index}
                    />
                )}

            </View>
        )
    }

    handleChangeTab = (newTab) => {
        const newTabs = this.state.tabs.map(tab => ({
            ...tab,
            active: tab.index === newTab.index
        }))
        this.setState(() => ({ tabs: newTabs }))
    }

    render() {

        const { currencyName } = this.props.cryptoCurrency
        return (
            <ScreenWrapper
                title={currencyName}
                leftType='back'
                leftAction={this.handleBack}
                rightType='close'
                rightAction={this.handleClose}
                ExtraView={this.renderHeaderInfo}
            >
                {this.renderFlatList()}
            </ScreenWrapper>
        )
    }
}

NftMainScreen.contextType = ThemeContext

const mapStateToProps = (state) => {
    return {
        wallet: getSelectedWalletData(state),
        cryptoCurrency: getSelectedCryptoCurrencyData(state)
    }
}

export default connect(mapStateToProps)(NftMainScreen)

