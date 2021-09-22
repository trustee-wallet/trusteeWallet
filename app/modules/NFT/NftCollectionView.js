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
import { ThemeContext } from '@app/theme/ThemeProvider'

const { width: WINDOW_WIDTH } = Dimensions.get('window')

class NftCollectionView extends React.PureComponent {

    state = {
        numColumns: WINDOW_WIDTH >= (182 * 3) + this.context.GRID_SIZE * 4 ? 3 : 2,
        data : {
            title : '?',
            assets : []
        }
    }

    componentDidMount() {
        const data = NavStore.getParamWrapper(this, 'nftCollection')
        this.setState({
            data
        })
    }

    handleBack = () => {
        NavStore.goBack()
    }

    handleClose = () => {
        NavStore.reset('TabBar')
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
                onPress={() => this.handleToken(item.data)}
                numColumns={numColumns}
                data={item}
                margin={index % numColumns === 0}
            />
        )
    }


    renderFlatList = () => {

        const {
            numColumns,
            data
        } = this.state

        const { GRID_SIZE } = this.context

        const flatListData = []
        for (const asset of data.assets) {
            flatListData.push({
                data : asset,
                img: asset.img,
                title: asset.title,
                subTitle: asset.subTitle,
                ExtraViewData: () => {
                    return (
                        <NftTokenValue
                            tokenBlockchainCode={asset.tokenBlockchainCode}
                            walletCurrency={asset.cryptoCurrencySymbol}
                            balance={asset.cryptoValue}
                            balanceData={asset.usdValue} // @vadym its very bad names of fields
                            currencySymbol={'$'}
                        />
                    )
                }
            })
        }

        return(
            <View>
                <FlatList
                    data={flatListData}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingTop: GRID_SIZE }}
                    renderItem={this.renderFlatListItem}
                    horizontal={false}
                    numColumns={numColumns}
                    keyExtractor={({ index }) => index}
                />
            </View>
        )
    }

    render() {
        const {title} = this.state.data
        return(
            <ScreenWrapper
                title={title}
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

NftCollectionView.contextType = ThemeContext

export default NftCollectionView

