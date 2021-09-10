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

class AddNftAssetScreen extends PureComponent {

    state = {
        customAddress: '',
        selectedBlockchain: {
            currencyCode: 'ETH',
            title: 'ETHEREUM'
        }
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
        // TODO
    }

    handleSelectBlockchain = (selectedBlockchain) => {
        this.setState({
            selectedBlockchain
        })
    }

    renderFlatList = () => {

        const {
            selectedBlockchain
        } = this.state

        const flatListData = []
        // for (const tmp of this.props.cryptoCurrencies) {
        //     if (typeof tmp.currencyType === 'undefined' || tmp.currencyType !== 'NFT') continue

        // flatListData.push({
        //     text: tmp.tokenBlockchain,
        //     inverse: selectedAddress.currencyCode === tmp.currencyCode,
        //     action: () => this.handleSelectBlockchain(tmp)
        // })
        // }

        flatListData.push({
            text: 'ETHEREUM',
            inverse: selectedBlockchain?.currencyCode === 'ETH',
            action: () => this.handleSelectBlockchain({ currencyCode: 'ETH', title: 'ETHEREUM' })
        })
        flatListData.push({
            text: 'TRON',
            inverse: selectedBlockchain?.currencyCode === 'TRX',
            action: () => this.handleSelectBlockchain({ currencyCode: 'TRX', title: 'TRON' })
        })
        flatListData.push({
            text: 'MATIC',
            inverse: selectedBlockchain?.currencyCode === 'MATIC',
            action: () => this.handleSelectBlockchain({ currencyCode: 'MATIC', title: 'MATIC' })
        })

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
        return (
            <ListItem
                title={item.currencyName}
                subtitle={item.currencySymbol}
                iconType={item.currencyCode}
                onPress={() => this.handleChangeCurrencyStatus(item)}
                rightContent="switch"
                switchParams={{ value: item.isHidden !== null && !item.maskedHidden, onPress: () => this.handleChangeCurrencyStatus(item) }}
            />
        )
    }

    render() {
        const {
            GRID_SIZE,
            colors
        } = this.context

        const { customAddress, data } = this.state

        return (
            <ScreenWrapper
                leftType='back'
                leftAction={this.handleBack}
                rightType='close'
                rightAction={this.handleClose}
                title={strings('assets.title')}
            >
                <SafeAreaView style={[styles.content, { backgroundColor: colors.common.background }]}>
                    <FlatList
                        data={data}
                        showsVerticalScrollIndicator={false}
                        ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: colors.common.listItem.basic.borderColor, marginLeft: GRID_SIZE * 2 }} />}
                        ListHeaderComponent={() => (
                            <>
                                <View style={{ margin: GRID_SIZE }}>
                                    <Text style={[styles.text, { color: colors.common.text3 }]}>{strings('assets.addCustomLabel')}</Text>
                                </View>
                                <View style={{ marginBottom: GRID_SIZE }}>
                                    {this.renderFlatList()}
                                </View>
                                <View style={[styles.customAddressConent, { padding: GRID_SIZE }]}>
                                    <TextInput
                                        placeholder={strings('assets.addCustomPlaceholder')}
                                        onChangeText={this.handleChangeCustomAddress}
                                        value={customAddress}
                                        paste={true}
                                        callback={this.handleChangeCustomAddress}
                                        qr={true}
                                        qrCallback={this.handleOpenQr}
                                    />
                                    <Button
                                        containerStyle={{ marginTop: GRID_SIZE * 2 }}
                                        title={strings('assets.addAssetButton')}
                                        onPress={() => this.handleAddCustomToken(customAddress)}
                                        disabled={!customAddress}
                                    />
                                </View>
                            </>
                        )}
                        renderItem={this.renderListItem}
                    />
                </SafeAreaView>
            </ScreenWrapper>
        )
    }
}

AddNftAssetScreen.contextType = ThemeContext

export default AddNftAssetScreen

const styles = StyleSheet.create({
    customAddressConent: {
        flex: 1,
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