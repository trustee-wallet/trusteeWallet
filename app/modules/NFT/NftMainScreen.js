/**
 * @version 0.50
 * @author Vadym
 */

import React from 'react'
import {
    View,
    FlatList,
} from 'react-native'

import ScreenWrapper from '@app/components/elements/ScreenWrapper'
import { strings } from '@app/services/i18n'
import NavStore from '@app/components/navigation/NavStore'
import HeaderInfo from '@app/modules/NFT/elements/HeaderInfo'
import Tabs from '@app/components/elements/new/Tabs'
import { ThemeContext } from '@app/theme/ThemeProvider'
import FlatListItem from '@app/modules/NFT/elements/FlatListItem'
import NftTokenValue from '@app/modules/NFT/elements/NftTokenValue'

class NftMainScreen extends React.PureComponent {

    state = {
        tabs: [
            {
                title: strings('nft.all'),
                index: 0,
                active: true
            },
            {
                title: strings('nft.collections'),
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
        containerStyle={{ marginBottom: this.context.GRID_SIZE, flexDirection: 'row', justifyContent: 'space-around' }}
    />

    renderFlatListItem = ({ item, index }) => {
        return (
            <FlatListItem
                data={item}
                margin={index % 2 === 0}
            />
        )
    }

    renderFlatList = () => {
        const flatListData = [
            {
                img: 'https://www.google.com/url?sa=i&url=https%3A%2F%2Fwww.interfax.ru%2Fphoto%2F4448&psig=AOvVaw0n0jbtFrujehYHZ-tdZO6e&ust=1629275740738000&source=images&cd=vfe&ved=0CAsQjRxqFwoTCKCXoKLTt_ICFQAAAAAdAAAAABAD',
                title: 'Eiffel 65 - Blue',
                subTitle: '# 732613',
                ExtraViewData: () => {
                    return(
                        <NftTokenValue
                            walletCurrency={'BTC'}
                            balance={12443}
                            balanceData={53674}
                            currencySymbol={'$'}
                        />
                    )
                }
            },
            {
                img: 'https://www.google.com/url?sa=i&url=https%3A%2F%2Fwww.interfax.ru%2Fphoto%2F4448&psig=AOvVaw0n0jbtFrujehYHZ-tdZO6e&ust=1629275740738000&source=images&cd=vfe&ved=0CAsQjRxqFwoTCKCXoKLTt_ICFQAAAAAdAAAAABAD',
                title: 'Eiffel 65 - Bluevb bvbn nbvbn v',
                subTitle: '# 732613',
                ExtraViewData: () => {
                    return(
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
                img: 'https://www.google.com/url?sa=i&url=https%3A%2F%2Fwww.interfax.ru%2Fphoto%2F4448&psig=AOvVaw0n0jbtFrujehYHZ-tdZO6e&ust=1629275740738000&source=images&cd=vfe&ved=0CAsQjRxqFwoTCKCXoKLTt_ICFQAAAAAdAAAAABAD',
                title: 'Eiffel 65 - Blue',
                subTitle: '# 732613',
            ExtraViewData: () => {
                return(
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
                img: 'https://www.google.com/url?sa=i&url=https%3A%2F%2Fwww.interfax.ru%2Fphoto%2F4448&psig=AOvVaw0n0jbtFrujehYHZ-tdZO6e&ust=1629275740738000&source=images&cd=vfe&ved=0CAsQjRxqFwoTCKCXoKLTt_ICFQAAAAAdAAAAABAD',
                title: 'Eiffel 65 - Blue',
                subTitle: '# 732613',
                ExtraViewData: () => {
                    return(
                        <NftTokenValue
                            walletCurrency={'MATIC'}
                            balance={'12443'}
                            balanceData={'53674'}
                            currencySymbol={'$'}
                        />
                    )
                }
            },
        ]
        return(
            <View>
                <FlatList
                    data={flatListData}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{paddingTop: this.context.GRID_SIZE}}
                    renderItem={({ item, index }) => this.renderFlatListItem({ item, index })}
                    keyExtractor={({ index }) => index}
                    horizontal={false}
                    numColumns={2}
                    ListHeaderComponent={this.renderTabs}
                />
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

        return(
            <ScreenWrapper
                title={strings('nft.title')}
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
