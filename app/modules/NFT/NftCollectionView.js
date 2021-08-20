/**
 * @version 0.50
 * @author Vadym
 */

import React from 'react'
import {
    Dimensions,
    FlatList,
    View
} from 'react-native'

import FlatListItem from '@app/modules/NFT/elements/FlatListItem'
import ScreenWrapper from '@app/components/elements/ScreenWrapper'
import NavStore from '@app/components/navigation/NavStore'
import NftTokenValue from '@app/modules/NFT/elements/NftTokenValue'

const { width: WINDOW_WIDTH } = Dimensions.get('window')

class NftCollectionView extends React.PureComponent {

    state = {
        numColumns: WINDOW_WIDTH >= (182 * 3) + this.context.GRID_SIZE * 4 ? 3 : 2,
    }

    handleBack = () => {
        NavStore.goBack()
    }

    handleClose = () => {
        NavStore.reset('TabBar')
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
            />
        )
    }


    renderFlatList = () => {

        const {
            numColumns,
        } = this.state

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
        return(
            <View>
                <FlatList
                    data={flatListData}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingTop: this.context.GRID_SIZE }}
                    renderItem={({ item, index }) => this.renderFlatListItem({ item, index })}
                    horizontal={false}
                    numColumns={numColumns}
                />
            </View>
        )
    }

    render() {
        return(
            <ScreenWrapper
                title={'cryptokitties'}
                leftType='back'
                leftAction={this.handleBack}
                rightType='close'
                rightAction={this.handleClose}
            >
                {this.renderFlatList()}
            </ScreenWrapper>
        )
    }
}

export default NftCollectionView

