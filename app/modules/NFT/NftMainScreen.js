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
    ActivityIndicator,
    Text,
    TouchableOpacity,
    StyleSheet,
    Platform
} from 'react-native'
import { connect } from 'react-redux'

import ScreenWrapper from '@app/components/elements/ScreenWrapper'
import { strings } from '@app/services/i18n'
import NavStore from '@app/components/navigation/NavStore'

import Tabs from '@app/components/elements/new/Tabs'
import { ThemeContext } from '@app/theme/ThemeProvider'
import FlatListItem from '@app/modules/NFT/elements/FlatListItem'
import NftTokenValue from '@app/modules/NFT/elements/NftTokenValue'
import FlatListCollections from '@app/modules/NFT/elements/FlatListCollections'

import { getSelectedCryptoCurrencyData, getSelectedWalletData } from '@app/appstores/Stores/Main/selectors'
import { NftActions } from '@app/appstores/Stores/Nfts/NftsActions'
import { NftCustomAssetsActions } from '@app/appstores/Stores/NftCustomAssets/NftCustomAssetsActions'

import config from '@app/config/config'
import Log from '@app/services/Log/Log'
import { getNftsData } from '@app/appstores/Stores/Nfts/selectors'


import { getIsBalanceVisible } from '@app/appstores/Stores/Settings/selectors'

import CurrencyIcon from '@app/components/elements/CurrencyIcon'
import LetterSpacing from '@app/components/elements/LetterSpacing'
import BorderedButton from '@app/components/elements/new/buttons/BorderedButton'
import NftReceiveComponent from './elements/NftReceiveComponent'

const { width: WINDOW_WIDTH } = Dimensions.get('window')

class NftMainScreen extends React.PureComponent {

    state = {
        refreshing: false,
        isBalanceVisible: false,
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
        await NftCustomAssetsActions.loadCustomAssets()
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

    triggerBalanceVisibility = (value) => {
        this.setState((state) => ({ isBalanceVisible: value || state.originalVisibility }))
    }

    handleReceive = () => {
        NavStore.goNext('NftReceive')
    }

    renderHeaderInfo = () => {

        const {
            GRID_SIZE, colors
        } = this.context

        const originalVisibility = this.props.isBalanceVisible
        const isBalanceVisible = this.state.isBalanceVisible || originalVisibility

        return (
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: GRID_SIZE }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', }}>
                    <View>
                        <CurrencyIcon currencyCode='NFT_ETH' />
                    </View>
                    <View style={styles.accountDetail__content}>
                        <View style={{}}>
                            <Text style={{ ...styles.accountDetail__title, color: colors.common.text1 }} numberOfLines={1}>
                                NFT
                            </Text>
                            <TouchableOpacity
                                onPressIn={() => this.triggerBalanceVisibility(true)}
                                onPressOut={() => this.triggerBalanceVisibility(false)}
                                activeOpacity={1}
                                disabled={originalVisibility}
                                hitSlop={{ top: 10, right: isBalanceVisible ? 60 : 30, bottom: 10, left: isBalanceVisible ? 60 : 30 }}
                            >
                                {isBalanceVisible ?
                                    <LetterSpacing text={'$ ' + this.props.nftsData.nfts.usdTotal} textStyle={styles.accountDetail__text} letterSpacing={1} /> :
                                    <Text style={{ ...styles.accountDetail__text, color: colors.common.text1, fontSize: 24 }}>****</Text>
                                }
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
                <View style={{ marginTop: GRID_SIZE / 2 }}>
                    <BorderedButton
                        icon='plus'
                        text={strings('nftMainScreen.receive')}
                        onPress={this.handleReceive}
                    />
                </View>
            </View>
        )
    }

    renderTabs = () => {
        if (!this.props.nftsData.nfts.assets.length) return null

        return (
            <Tabs
                tabs={this.state.tabs}
                changeTab={this.handleChangeTab}
                containerStyle={{ paddingVertical: this.context.GRID_SIZE, width: '60%', alignSelf: 'center' }}
            />
        )
    }

    handleCollection = (nftCollection) => {
        NavStore.goNext('NftCollectionView', { nftCollection })
    }

    handleToken = (nftItem) => {
        NavStore.goNext('NftDetailedInfo', { nftItem })
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
        } = this.state

        const { colors, GRID_SIZE } = this.context

        const flatListCollectionsData = this.props.nftsData.nfts.collections
        const flatListData = []
        for (const asset of this.props.nftsData.nfts.assets) {
            flatListData.push({
                data: asset,
                img: asset.img,
                title: asset.title,
                subTitle: asset.subTitle,
                ExtraViewData: () => {
                    return (
                        <NftTokenValue
                            walletCurrency={asset.cryptoCurrencySymbol}
                            tokenBlockchainCode={asset.tokenBlockchainCode}
                            balance={asset.cryptoValue}
                            balanceData={asset.usdValue}
                            currencySymbol='$'
                        />
                    )
                }
            })
        }

        if (!this.props.nftsData.loaded) {
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
                        ListEmptyComponent={<NftReceiveComponent />}
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
                        ListEmptyComponent={<NftReceiveComponent />}
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
        // const { currencyName } = this.props.cryptoCurrency
        return (
            <ScreenWrapper
                title={'NFT'}
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
        nftsData: getNftsData(state),
        isBalanceVisible: getIsBalanceVisible(state.settingsStore)
    }
}

export default connect(mapStateToProps)(NftMainScreen)

const styles = StyleSheet.create({
    accountDetail: {
        marginLeft: 31
    },
    accountDetail__content: {
        flexDirection: 'row',

        marginLeft: 16
    },
    accountDetail__title: {
        fontFamily: 'Montserrat-Bold',
        fontSize: 18
    },
    accountDetail__text: {
        fontSize: 14,
        height: Platform.OS === 'ios' ? 15 : 18,
        fontFamily: 'SFUIDisplay-Semibold',
        color: '#939393'
    }
})

