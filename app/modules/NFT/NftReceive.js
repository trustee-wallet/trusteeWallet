/**
 * @version 0.50
 * @author Vadym
 */

import React from 'react'
import {
    Text,
    View,
    StyleSheet,
    FlatList,
    Dimensions,
    TouchableOpacity,
    Platform
} from 'react-native'

import { connect } from 'react-redux'

import ScreenWrapper from '@app/components/elements/ScreenWrapper'
import NavStore from '@app/components/navigation/NavStore'
import { strings } from '@app/services/i18n'
import { ThemeContext } from '@app/theme/ThemeProvider'
import ReceiveFlatListItem from '@app/modules/NFT/elements/ReceiveFlatListItem'
import QrCodeBox from '@app/components/elements/QrCodeBox'
import qrLogo from '@assets/images/logoWithWhiteBG.png'
import Log from '@app/services/Log/Log'
import CustomIcon from '@app/components/elements/CustomIcon'
import copyToClipboard from '@app/services/UI/CopyToClipboard/CopyToClipboard'
import Toast from '@app/services/UI/Toast/Toast'

import { getSelectedCryptoCurrencyData, getSelectedWalletData } from '@app/appstores/Stores/Main/selectors'
import { setLoaderStatus } from '@app/appstores/Stores/Main/MainStoreActions'

import prettyShare from '@app/services/UI/PrettyShare/PrettyShare'
import { FileSystem } from '@app/services/FileSystem/FileSystem'
import { getVisibleCurrencies } from '@app/appstores/Stores/Currency/selectors'
import store from '@app/store'
import Button from '@app/components/elements/new/buttons/Button'

import Nfts from '@crypto/common/BlocksoftDictNfts'

const { width: WINDOW_WIDTH } = Dimensions.get('window')

class NftReceive extends React.PureComponent {

    state = {
        selectedAddress: {
            currencyCode: 'ETH',
            address: '',
            tokenBlockchain: 'ETHEREUM'
        }
    }

    async componentDidMount() {
        this.handleSelectBlockchain(this.props.cryptoCurrency)
    }


    handleBack = () => {
        NavStore.goBack()
    }

    handleShare = () => {
        const { tokenBlockchain, address } = this.state.selectedAddress
        try {
            setLoaderStatus(true)

            const message = `${tokenBlockchain.toLowerCase()}:${address}`
            this.refSvg.toDataURL(async (data) => {
                if (Platform.OS === 'android') {
                    // noinspection ES6MissingAwait
                    prettyShare({ message, url: `data:image/png;base64,${data}`, title: 'QR', type: 'image/png' })
                } else {
                    const fs = new FileSystem({ fileEncoding: 'base64', fileName: 'QR', fileExtension: 'jpg' })
                    await fs.writeFile(data)
                    // noinspection ES6MissingAwait
                    prettyShare({ message, url: await fs.getPathOrBase64() })
                }
                setLoaderStatus(false)
            })
        } catch (e) {
            setLoaderStatus(false)
            Log.err('NftReceive handleShare error', e)
        }
    }

    renderFlatListItem = ({ item, index }) => {
        return (
            <ReceiveFlatListItem
                data={item}
                margin={index === 0}
            />
        )
    }

    handleSelectBlockchain = async (data) => {

        const { walletHash } = this.props.wallet
        const { currencyCode, tokenBlockchainCode, tokenBlockchain } = data
        const basicAccounts = store.getState().accountStore.accountList

        let address = ''
        if (typeof basicAccounts[walletHash] !== 'undefined') {
            if (typeof basicAccounts[walletHash][tokenBlockchainCode] !== 'undefined') {
                address = basicAccounts[walletHash][tokenBlockchainCode].address
            } else if (tokenBlockchainCode !== 'TRX') {
                address = basicAccounts[walletHash]['ETH'].address
            }
        }

        this.setState({
            selectedAddress: {
                currencyCode,
                address,
                tokenBlockchain
            }
        })
    }

    renderFlatList = () => {

        const {
            selectedAddress
        } = this.state

        const flatListData = []
        for (const tmp of Nfts.Nfts) {
            flatListData.push({
                text: tmp.tokenBlockchain,
                inverse: selectedAddress.currencyCode === tmp.currencyCode,
                action: () => this.handleSelectBlockchain(tmp)
            })
        }

        return (
            <FlatList
                data={flatListData}
                horizontal={true}
                renderItem={this.renderFlatListItem}
                showsHorizontalScrollIndicator={false}
                keyExtractor={({ index }) => index}
            />
        )
    }

    copyToLink = (token) => {
        copyToClipboard(token)
        Toast.setMessage(strings('toast.copied')).show()
    }

    handleAddCustomToken = () => {
        NavStore.goNext('NftAddAssetScreen')
    }

    render() {

        const { tokenBlockchain, address } = this.state.selectedAddress

        const {
            GRID_SIZE,
            colors
        } = this.context

        const message = `${tokenBlockchain.toLowerCase()}:${address}`
        return (
            <ScreenWrapper
                title={strings('nftMainScreen.title')}
                leftType='back'
                leftAction={this.handleBack}
                rightType='share'
                rightAction={this.handleShare}
            >
                <View style={{ paddingTop: GRID_SIZE, paddingHorizontal: GRID_SIZE * 2 }}>
                    <Text style={[styles.emptyText, { color: colors.common.text3, marginBottom: GRID_SIZE }]}>
                        {strings('nftMainScreen.emptyNftText')}
                    </Text>
                </View>
                <View style={{ marginTop: GRID_SIZE }}>
                    {this.renderFlatList()}
                </View>
                <View style={{ paddingHorizontal: GRID_SIZE }}>
                    <View style={[styles.tokenContainer, { marginTop: GRID_SIZE * 1.5 }]}>
                        <TouchableOpacity
                            onPress={() => this.copyToLink(address)}
                            style={styles.qr}
                            activeOpacity={0.8}
                        >
                            <QrCodeBox
                                getRef={ref => this.refSvg = ref}
                                value={message}
                                size={WINDOW_WIDTH * 0.3254}
                                color='#404040'
                                backgroundColor='#F5F5F5'
                                logo={qrLogo}
                                logoSize={WINDOW_WIDTH * 0.1175}
                                logoBackgroundColor='transparent'
                                onError={(e) => {
                                    Log.err('MnemonicQrCode QRCode error ' + e.message)
                                }}
                            />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.tokenWrapper, { backgroundColor: colors.cashback.detailsBg }]}
                            onPress={() => this.copyToLink(address)}
                        >
                            <Text style={[styles.tokenText, { color: colors.common.text1, marginHorizontal: GRID_SIZE }]}>{address}</Text>
                            <View style={[styles.copyBtn, { marginTop: GRID_SIZE }]}>
                                <Text style={[styles.qrCodeTokenString, { color: colors.cashback.token }]}>
                                    {strings('account.receiveScreen.copy')}
                                </Text>
                                <CustomIcon name='copy' size={19} color={colors.cashback.token} />
                            </View>
                        </TouchableOpacity>
                    </View>
                    <View style={{ paddingVertical: GRID_SIZE, paddingHorizontal: GRID_SIZE }}>
                        <Text style={[styles.emptyText, { color: colors.common.text3 }]}>
                            {strings('nftMainScreen.receiveText', { coin: tokenBlockchain })}
                        </Text>
                    </View>

                    <Button
                        containerStyle={{ marginTop: GRID_SIZE }}
                        title={strings('assets.addAssetButton')}
                        onPress={this.handleAddCustomToken}
                    />
                </View>
            </ScreenWrapper>
        )
    }
}

NftReceive.contextType = ThemeContext

const mapStateToProps = (state) => {
    return {
        wallet: getSelectedWalletData(state),
        cryptoCurrency: getSelectedCryptoCurrencyData(state),
        cryptoCurrencies: getVisibleCurrencies(state)
    }
}

export default connect(mapStateToProps)(NftReceive)

const styles = StyleSheet.create({
    emptyText: {
        fontFamily: 'SFUIDisplay-SemiBold',
        fontSize: 14,
        lineHeight: 18,
        letterSpacing: 1
    },
    qr: {
        backgroundColor: '#F5F5F5',
        width: WINDOW_WIDTH * 0.3905,

        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 24,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 3
        },
        shadowOpacity: 0.27,
        shadowRadius: 4.65,
        elevation: 6
    },
    tokenWrapper: {
        width: WINDOW_WIDTH * 0.4905,
        height: WINDOW_WIDTH * 0.3905,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center'
    },
    tokenContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    tokenText: {
        fontFamily: 'SFUIDisplay-SemiBold',
        fontSize: 15,
        lineHeight: 19,
        letterSpacing: 1.5,
        textAlign: 'center'
    },
    qrCodeTokenString: {
        alignSelf: 'center',
        textTransform: 'uppercase',
        fontFamily: 'Montserrat-Bold',
        fontSize: 12,
        lineHeight: 17,
        letterSpacing: 1.5,
        paddingRight: 4
    },
    copyBtn: {
        flexDirection: 'row',
        textAlign: 'center'
    }
})
