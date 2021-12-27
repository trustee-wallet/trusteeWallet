/**
 * @version 0.53
 * @author yura
 */


import React, { PureComponent } from 'react'
import { View, StyleSheet, FlatList, Text, SafeAreaView } from 'react-native'

import { ThemeContext } from '@app/theme/ThemeProvider'
import ScreenWrapper from '@app/components/elements/ScreenWrapper'
import { strings } from '@app/services/i18n'
import NavStore from '@app/components/navigation/NavStore'
import TextInput from '@app/components/elements/new/TextInput'
import Button from '@app/components/elements/new/buttons/Button'

import ReceiveFlatListItem from '@app/modules/NFT/elements/ReceiveFlatListItem'
import ListItem from '@app/components/elements/new/list/ListItem/Asset'

import Nfts from '@crypto/common/BlocksoftDictNfts'
import { addCustomToken } from '@app/modules/NFT/helpers'
import { getNftCustomAssetsData } from '@app/appstores/Stores/NftCustomAssets/selectors'
import { NftCustomAssetsActions } from '@app/appstores/Stores/NftCustomAssets/NftCustomAssetsActions'
import { QRCodeScannerFlowTypes, setQRConfig } from '@app/appstores/Stores/QRCodeScanner/QRCodeScannerActions'

import Log from '@app/services/Log/Log'
import Toast from '@app/services/UI/Toast/Toast'
import { connect } from 'react-redux'

class NftAddAssetScreen extends PureComponent {

    state = {
        customAddress: '',
        selectedBlockchain: {
            currencyCode: 'NFT_MATIC',
            tokenBlockchain: 'MATIC',
            tokenBlockchainCode : 'MATIC',
            title: 'MATIC'
        }
    }

    async componentDidMount() {
        NftCustomAssetsActions.loadCustomAssets()
    }


    handleBack = () => {
        NavStore.goBack()
    }

    handleClose = () => {
        NavStore.reset('HomeScreen')
    }

    handleChangeCustomAddress = (value) => {
        this.setState(() => ({ customAddress: value }))
    }

    handleOpenQr = () => {
        setQRConfig({ flowType: QRCodeScannerFlowTypes.ADD_CUSTOM_TOKEN_SCANNER, callback : (data) => {
                try {
                    this.setState({ customAddress: data })
                } catch (e) {
                    Log.log('QRCodeScannerScreen callback error ' + e.message )
                    Toast.setMessage(e.message).show()
                }
                NavStore.goBack()
            }})
        NavStore.goNext('QRCodeScannerScreen')
    }

    handleSelectBlockchain = (selectedBlockchain) => {
        this.setState({
            selectedBlockchain
        })
    }

    handleAddCustomToken = () => {
        const { customAddress, selectedBlockchain } = this.state
        addCustomToken(customAddress, selectedBlockchain.currencyCode)
    }

    renderFlatList = () => {

        const {
            selectedBlockchain
        } = this.state

        const flatListData = []
        for (const tmp of Nfts.Nfts) {
            flatListData.push({
                text: tmp.tokenBlockchainShortTitle || tmp.tokenBlockchain,
                inverse: selectedBlockchain?.currencyCode === tmp.currencyCode,
                action: () => this.handleSelectBlockchain(tmp)
            })
        }

        return (
            <FlatList
                data={flatListData}
                horizontal={true}
                renderItem={this.renderFlatListItem}
                showsHorizontalScrollIndicator={false}
                keyExtractor={item => item.currencyCode}
            />
        )
    }

    renderFlatListItem = ({ item, index }) => {
        return (
            <ReceiveFlatListItem
                data={item}
                margin={index === 0}
            />
        )
    }

    renderListItem = ({ item }) => {
        console.log('item', item)
        return (
            <ListItem
                title={item.currencyName}
                subtitle={item.currencySymbol}
                iconType={item.currencyCode}
                onPress={() => this.handleChangeCurrencyStatus(item)}
                rightContent='switch'
                switchParams={{ value: item.isHidden !== null && !item.maskedHidden, onPress: () => this.handleChangeCurrencyStatus(item) }}
            />
        )
    }

    // renderCustomTextInput() {
    //     return(
            
    //     ) 
    // }

    render() {
        const {
            GRID_SIZE,
            colors
        } = this.context

        const { customAddress, selectedBlockchain } = this.state
        const { nftCustomAssetsData } = this.props
        let data = []

        /*
        @todo FOR VADIK
        if (typeof nftCustomAssetsData !== 'undefined' && typeof nftCustomAssetsData.customAssets[selectedBlockchain.currencyCode] !== 'undefined') {
            for (const key in nftCustomAssetsData.customAssets[selectedBlockchain.currencyCode]) {
                const tmp = nftCustomAssetsData.customAssets[selectedBlockchain.currencyCode][key]
                tmp.currencyCode = selectedBlockchain.currencyCode
                data.push(tmp)
            }
        }*/

        return (
            <ScreenWrapper
                leftType='back'
                leftAction={this.handleBack}
                rightType='close'
                rightAction={this.handleClose}
                title={strings('nftAddAssetScreen.title')}
            >
                <SafeAreaView style={[styles.content, { backgroundColor: colors.common.background }]}>
                    <FlatList
                        data={data}
                        showsVerticalScrollIndicator={false}
                        ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: colors.common.listItem.basic.borderColor, marginLeft: GRID_SIZE * 2 }} />}
                        ListHeaderComponent={
                            <>
                                <View style={{ margin: GRID_SIZE }}>
                                    <Text style={[styles.text, { color: colors.common.text3 }]}>{strings('nftAddAssetScreen.addCustomLabel')}</Text>
                                </View>
                                <View style={{ marginBottom: GRID_SIZE }}>
                                    {this.renderFlatList()}
                                </View>
                                {this.state.selectedBlockchain.tokenBlockchainCode === 'ETH' ?
                                    <View style={[styles.customAddressContent, { padding: GRID_SIZE }]}>
                                        <Text style={[styles.text, { color: colors.common.text3 }]}>{strings('nftAddAssetScreen.addCustomLabelOpenSea')}</Text>
                                    </View>
                                    :
                                    <View style={[styles.customAddressContent, { padding: GRID_SIZE }]}>
                                        <TextInput
                                            placeholder={strings('nftAddAssetScreen.addCustomPlaceholder')}
                                            onChangeText={this.handleChangeCustomAddress}
                                            value={customAddress}
                                            paste={true}
                                            callback={this.handleChangeCustomAddress}
                                            qr={true}
                                            qrCallback={this.handleOpenQr}
                                            onBlur={() => null}
                                        />
                                        <Button
                                            containerStyle={{ marginTop: GRID_SIZE * 2 }}
                                            title={strings('nftAddAssetScreen.addAssetButton')}
                                            onPress={() => this.handleAddCustomToken(customAddress)}
                                            disabled={!customAddress}
                                        />
                                    </View>
                                }
                            </>
                        }
                        renderItem={this.renderListItem}
                        keyExtractor={item => item.id}
                    />
                </SafeAreaView>
            </ScreenWrapper>
        )
    }
}

NftAddAssetScreen.contextType = ThemeContext

const mapStateToProps = (state) => {
    return {
        nftCustomAssetsData: getNftCustomAssetsData(state)
    }
}

export default connect(mapStateToProps)(NftAddAssetScreen)

const styles = StyleSheet.create({
    customAddressContent: {
        flex: 1
    },
    content: {
        flex: 1
    },
    text: {
        fontFamily: 'Montserrat-SemiBold',
        fontSize: 16,
        lineHeight: 21,
        marginBottom: 12
    }
})
