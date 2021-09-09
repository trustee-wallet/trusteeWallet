/**
 * @version 0.50
 * @author Vadym
 */

import React from 'react'
import {
    View,
    FlatList,
    Dimensions,
    RefreshControl,
    ActivityIndicator
} from 'react-native'
import { connect } from 'react-redux'

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
import { NftActions } from '@app/appstores/Stores/Nfts/NftsActions'

import config from '@app/config/config'
import Log from '@app/services/Log/Log'
import { getNftsData } from '@app/appstores/Stores/Nfts/selectors'

const { width: WINDOW_WIDTH } = Dimensions.get('window')

class NftMainScreen extends React.PureComponent {

    state = {
        refreshing: false,
        loading: true,
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
        ]
    }


    async componentDidMount() {
        await this.handleRefresh(false)

        this.setState({
            loading: false
        })
    }

    handleRefresh = async (force = true) => {
        try {
            const { address } = this.props.nftsData
            await NftActions.getDataByAddress(address, force)
        } catch (e) {
            if (config.debug.appErrors) {
                console.log('NftMainScreen.handleRefresh error ' + e.message)
            }
            Log.log('NftMainScreen.handleRefresh error ' + e.message)
        }
    }

    handleRefreshContent = async () => {
        this.setState({
            refreshing: true
        })

        await this.handleRefresh(true)

        this.setState({
            refreshing: false
        })
    }

    handleBack = () => {
        NavStore.goBack()
    }

    handleClose = () => {
        NavStore.reset('TabBar')
    }

    renderHeaderInfo = () => {
        return <HeaderInfo usdTotalPretty={this.props.nftsData.nfts.usdTotal}/>
    }

    renderTabs = () => <Tabs
        tabs={this.state.tabs}
        changeTab={this.handleChangeTab}
        containerStyle={{ paddingVertical: this.context.GRID_SIZE, width: '60%', alignSelf: 'center' }}
    />

    handleCollection = (nftCollection) => {
        NavStore.goNext('NftCollectionView', {nftCollection})
    }

    handleToken = (nftItem) => {
        NavStore.goNext('NftDetailedInfo', {nftItem})
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
                onPress={() => this.handleToken(item.data)}
            />
        )
    }

    renderFlatListCollections = ({ item }) => {
        return (
            <FlatListCollections
                data={item}
                onPress={() => this.handleCollection(item)}
            />
        )
    }

    renderFlatList = () => {

        const {
            numColumns,
            tabs,
            loading
        } = this.state

        const { colors, GRID_SIZE } = this.context

        const flatListCollectionsData = this.props.nftsData.nfts.collections
        const flatListData = []
        for (const asset of this.props.nftsData.nfts.assets) {
            flatListData.push({
                data : asset,
                img: asset.img,
                title: asset.title,
                subTitle: asset.subTitle,
                ExtraViewData: () => {
                    return (
                        <NftTokenValue
                            walletCurrency={asset.cryptoCurrencySymbol}
                            balance={asset.cryptoValue}
                            balanceData={asset.usdValue} // @vadym its very bad names of fields
                            currencySymbol='$'
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
                        contentContainerStyle={{ paddingVertical: this.context.GRID_SIZE }}
                        renderItem={this.renderFlatListItem}
                        horizontal={false}
                        numColumns={numColumns}
                        ListHeaderComponent={this.renderTabs}
                        keyExtractor={(item, index) => index.toString() + item.data.title}
                        refreshControl={
                            <RefreshControl
                                refreshing={this.state.refreshing}
                                onRefresh={this.handleRefreshContent}
                                tintColor={colors.common.refreshControlIndicator}
                                colors={[colors.common.refreshControlIndicator]}
                                progressBackgroundColor={colors.common.refreshControlBg}
                                progressViewOffset={-20}
                            />
                        }
                        ListEmptyComponent={() => {
                            if (loading) {
                                return (
                                    <ActivityIndicator
                                        size='large'
                                        style={{
                                            backgroundColor: 'transparent',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            paddingTop: GRID_SIZE
                                        }}
                                        color={this.context.colors.common.text2}
                                    />
                                )
                            } else {
                                return null
                            }
                        }}
                    />
                )}
                {tabs[1].active && (
                    <FlatList
                        data={flatListCollectionsData}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingVertical: this.context.GRID_SIZE }}
                        renderItem={this.renderFlatListCollections}
                        ListHeaderComponent={this.renderTabs}
                        keyExtractor={({ index }) => index}
                        refreshControl={
                            <RefreshControl
                                refreshing={this.state.refreshing}
                                onRefresh={this.handleRefreshContent}
                                tintColor={colors.common.refreshControlIndicator}
                                colors={[colors.common.refreshControlIndicator]}
                                progressBackgroundColor={colors.common.refreshControlBg}
                                progressViewOffset={-20}
                            />
                        }
                        ListEmptyComponent={() => {
                            if (loading) {
                                return (
                                    <ActivityIndicator
                                        size='large'
                                        style={{
                                            backgroundColor: 'transparent',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            paddingTop: GRID_SIZE
                                        }}
                                        color={this.context.colors.common.text2}
                                    />
                                )
                            } else {
                                return null
                            }
                        }}
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
        cryptoCurrency: getSelectedCryptoCurrencyData(state),
        nftsData : getNftsData(state)
    }
}

export default connect(mapStateToProps)(NftMainScreen)

