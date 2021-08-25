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
        ]
    }


    handleRefresh = () => {
        // TODO refresh
    }

    handleBack = () => {
        NavStore.goBack()
    }

    handleClose = () => {
        NavStore.reset('TabBar')
    }

    renderHeaderInfo = () => <HeaderInfo />

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
       return(
           <FlatListCollections
               data={item}
               onPress={this.handleCollection}
           />
       )
    }

    renderFlatList = () => {

        const {
            numColumns,
            tabs
        } = this.state

        const flatListCollectionsData = [
            {
                img: 'https://reactjs.org/logo-og.png',
                title: 'Cryptokitties',
                numberAssets: 5,
                walletCurrency: 'BTC'
            },
            {
                img: 'https://personal.psu.edu/xqz5228/jpg.jpg',
                title: 'Cryptokitties',
                numberAssets: 5,
                walletCurrency: 'ETH'
            },
            {
                img: 'https://i.gifer.com/XOsX.gif',
                title: 'Cryptokitties',
                numberAssets: 5,
                walletCurrency: 'MATIC'
            },
            {
                img: 'https://i.gifer.com/XOsX.gif',
                title: 'Cryptokitties',
                numberAssets: 5,
                walletCurrency: 'TRX'
            }
        ]

        const flatListData = [
            {
                img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Bitcoin.svg/128px-Bitcoin.svg.png',
                title: 'Eiffel 65 - Blue',
                subTitle: '# 732613',
                ExtraViewData: () => {
                    return (
                        <NftTokenValue
                            walletCurrency={'BTC'}
                            balance={1246666643}
                            balanceData={53674}
                            currencySymbol={'$'}
                        />
                    )
                }
            },
            {
                img: 'https://i.gifer.com/XOsX.gif',
                title: 'Eiffel 65 - Bluevb bvbn nbvbn v',
                subTitle: '# 732613',
                ExtraViewData: () => {
                    return (
                        <NftTokenValue
                            walletCurrency={'ETH'}
                            balance={12443}
                            balanceData={53674}
                            currencySymbol={'$'}
                        />
                    )
                }
            },
            {
                img: 'https://reactjs.org/logo-og.png',
                title: 'Eiffel 65 - Blue',
                subTitle: '# 732613',
                ExtraViewData: () => {
                    return (
                        <NftTokenValue
                            walletCurrency={'TRX'}
                            balance={'12443'}
                            balanceData={'53674'}
                            currencySymbol={'$'}
                        />
                    )
                }
            },
            {
                img: 'https://reactjs.org/logo-og.png',
                title: 'Eiffel 65 - Blue',
                subTitle: '# 732613',
                ExtraViewData: () => {
                    return (
                        <NftTokenValue
                            walletCurrency={'MATIC'}
                            balance={'12443'}
                            balanceData={'53674'}
                            currencySymbol={'$'}
                        />
                    )
                }
            }
        ]
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

        return (
            <ScreenWrapper
                title={strings('nftMainScreen.title')}
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

export default NftMainScreen
