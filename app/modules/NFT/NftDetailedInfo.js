/**
 * @version 0.50
 * @author Vadym
 */

import React from 'react'
import {
    Dimensions,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Linking
} from 'react-native'
import { connect } from 'react-redux'
import FastImage from 'react-native-fast-image'

import ScreenWrapper from '@app/components/elements/ScreenWrapper'
import { strings } from '@app/services/i18n'
import NavStore from '@app/components/navigation/NavStore'
import { ThemeContext } from '@app/theme/ThemeProvider'
import BorderedButton from '@app/components/elements/new/buttons/BorderedButton'
import NftTokenInfo from '@app/modules/NFT/elements/NftTokenInfo'
import NftTokenValue from '@app/modules/NFT/elements/NftTokenValue'
import Button from '@app/components/elements/new/buttons/Button'

import prettyShare from '@app/services/UI/PrettyShare/PrettyShare'
import Log from '@app/services/Log/Log'
import { getSelectedWalletData } from '@app/appstores/Stores/Main/selectors'
import { getNftsData } from '@app/appstores/Stores/Nfts/selectors'

import { showModal } from '@app/appstores/Stores/Modal/ModalActions'
import { SendActionsStart } from '@app/appstores/Stores/Send/SendActionsStart'
import BlocksoftPrettyStrings from '@crypto/common/BlocksoftPrettyStrings'
import config from '@app/config/config'
import store from '@app/store'
import Nfts from '@crypto/common/BlocksoftDictNfts'

const { width: WINDOW_WIDTH } = Dimensions.get('window')

let CACHE_CLICK_SEND = false
class NftDetailedInfo extends React.PureComponent {

    state = {
        heightPhoto: 260, // TODO percent of screen
        data: {
            contractAddress: '2',
            contractSchema: 'ERC721',
            cryptoCurrencySymbol: 'ETH',
            cryptoValue: '?',
            id: 0,
            img: '',
            permalink: '',
            subTitle: '',
            title: '',
            desc: '',
            tokenBlockchainCode: 'ETH',
            tokenId: '',
            tokenQty : 0,
            usdValue: ''
        }
    }

    componentDidMount() {
        const data = NavStore.getParamWrapper(this, 'nftItem')
        this.setState({
            data
        })

        if (data.img) {
            Image.getSize(data.img, (height) => {
                this.setState({
                    heightPhoto: height > 260 ? 260 : height
                })
            })
        }
    }

    handleBack = () => {
        NavStore.goBack()
    }

    handleSend = async () => {
        if (CACHE_CLICK_SEND) return false
        CACHE_CLICK_SEND = true
        try {
            const tmp = Nfts.NftsIndexed[this.state.data.tokenBlockchainCode.toUpperCase()]
            const currencyCode = tmp.tokenBlockchainCode || this.state.data.tokenBlockchainCode
            const { cryptoCurrencies } = store.getState().currencyStore
            let found = false
            for (const cryptoCurrency of cryptoCurrencies) {
                if (cryptoCurrency.currencyCode === currencyCode) {
                    found = true
                    continue
                }
            }
            if (!found) {
                showModal({
                    type: 'YES_NO_MODAL',
                    icon: 'WARNING',
                    title: strings('modal.exchange.sorry'),
                    description: strings('nftMainScreen.turnBasicAsset', {asset : Nfts.getCurrencyTitle(false, currencyCode)}),
                }, () => {
                    NavStore.goNext('AddAssetScreen')
                })
                CACHE_CLICK_SEND = false
                return false
            }
            const contractSchema = this.state.data.contractSchema || 'ERC721'
            let contractAction = 'transferFrom'
            let contractActionParams = [
                this.props.nftsData.address,
                'addressTo',
                this.state.data.tokenId
            ]
            if (contractSchema === 'ERC1155') {
                contractAction = 'safeTransferFrom'
                contractActionParams = [
                    this.props.nftsData.address,
                    'addressTo',
                    this.state.data.tokenId,
                    1, // amount!
                    '0x'
                ]
            }

            await SendActionsStart.startFromCustomContractCallData({
                currencyCode,
                contractCallData: {
                    contractAddress : this.state.data.contractAddress,
                    contractSchema,
                    contractAction,
                    contractActionParams,
                    infoForUser: [
                        {
                            title: strings('nftMainScreen.contract'),
                            subtitle: BlocksoftPrettyStrings.makeCut(this.state.data.contractAddress, 8, 8),
                            iconType: 'contract'
                        },
                        {
                            title: strings('nftMainScreen.contractSchema'),
                            subtitle: BlocksoftPrettyStrings.makeCut(this.state.data.contractSchema),
                            iconType: 'contract'
                        },
                        {
                            title: strings('nftMainScreen.tokenId'),
                            subtitle: this.state.data.tokenId,
                            iconType: 'tokenId'
                        }
                    ]
                }})
        } catch (e) {
            if (config.debug.appErrors) {
                console.log('NFT.NftDetailedInfo handleSend error ' + e.message)
            }
        }
        CACHE_CLICK_SEND = false
    }

    openLink = () => {
        const link = this.state.data.permalink
        try {
            Linking.openURL(link)
        } catch (e) {
            Log.err('NFT.NftDetailedInfo open URI error ' + e.message + ' ' + link)
        }

    }

    handleShareLink = () => {
        const shareOptions = { message: '' }
        shareOptions.message += this.state.data.title + '\n' + this.state.data.subTitle + '\n\n'
        shareOptions.message += this.state.data.permalink ? strings('account.transactionScreen.website') + this.state.data.permalink : ''


        prettyShare(shareOptions, 'nft_copyToMoreFinish')
    }

    handleOpenQrCode = () => {
        const forSignature = {
            signAddress: this.props.nftsData.address,
            derivationPath : this.props.nftsData.derivationPath,
            walletHash: this.props.wallet.walletHash,
            tokenId: this.state.data.tokenId,
            tokenBlockchainCode: this.state.data.tokenBlockchainCode,
            contractAddress: this.state.data.contractAddress
        }
        NavStore.goNext('NftDetailedInfoQR', { forSignature })
    }

    render() {

        const { data } = this.state
        const {
            GRID_SIZE,
            colors
        } = this.context

        const showLink = typeof data.permalink !== 'undefined' && data.permalink && data.permalink !== 'false' ? true : false

        return (
            <ScreenWrapper
                title={data.title || ' '}
                leftType='back'
                leftAction={this.handleBack}
                rightType='share'
                rightAction={this.handleShareLink}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollViewContent}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={[styles.container, { paddingHorizontal: GRID_SIZE }]}>
                        <View style={[{
                            width: WINDOW_WIDTH - GRID_SIZE * 2,
                            height: this.state.heightPhoto,
                            marginTop: GRID_SIZE,
                            marginBottom: GRID_SIZE * 1.5
                        }]}>
                            {data.img && data.img !== '' ?
                                <FastImage
                                    style={styles.img}
                                    source={{
                                        uri: data.img,
                                        priority: FastImage.priority.normal,
                                    }}
                                    resizeMode={FastImage.resizeMode.contain}
                                /> : null}
                        </View>
                        <NftTokenInfo
                            containerStyles={styles.title}
                            title={data.title}
                            subTitle={data.subTitle}
                        />
                        <View style={[styles.headerInfoContainer, { marginBottom: GRID_SIZE }]}>
                            <View style={styles.currencyInfo}>
                                <NftTokenValue
                                    tokenBlockchainCode={data.tokenBlockchainCode}
                                    tokenQty={data.tokenQty}
                                    walletCurrency={data.cryptoCurrencySymbol}
                                    balance={data.cryptoValue}
                                    balanceData={data.usdValue}
                                    currencySymbol='$'
                                />
                            </View>
                            <View style={styles.buttonContainer}>
                                <BorderedButton
                                    containerStyles={styles.button}
                                    icon='send'
                                    text={strings('account.send')}
                                    onPress={this.handleSend}
                                />
                            </View>
                        </View>
                        <View style={{ marginHorizontal: GRID_SIZE * 2, marginBottom: GRID_SIZE * 2 }}>
                            <Text style={[styles.infoText, { color: colors.common.text3 }]}>
                                {data.desc}
                            </Text>
                        </View>
                        { showLink && (
                            <TouchableOpacity
                                style={styles.linkContainer}
                                onPress={this.openLink}
                            >
                                <Text style={[styles.link, { color: colors.common.text1 }]}>{strings('account.transactionScreen.viewExplorer')}</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                    <View style={{ paddingVertical: GRID_SIZE }} />
                </ScrollView>
                <Button
                    containerStyle={{ marginHorizontal: GRID_SIZE, marginBottom: GRID_SIZE * 1.5 }}
                    title={strings('nftMainScreen.proof')}
                    onPress={this.handleOpenQrCode}
                />
            </ScreenWrapper>
        )
    }
}

NftDetailedInfo.contextType = ThemeContext

const mapStateToProps = (state) => {
    return {
        wallet: getSelectedWalletData(state),
        nftsData: getNftsData(state)
    }
}

export default connect(mapStateToProps)(NftDetailedInfo)

const styles = StyleSheet.create({
    scrollViewContent: {
        flexGrow: 1
    },
    container: {
        flex: 1
    },
    img: {
        flex: 1
    },
    buttonContainer: {},
    button: {
        width: 'auto'
    },
    headerInfoContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    currencyInfo: {
        flex: 1
    },
    infoText: {
        fontFamily: 'SFUIDisplay-SemiBold',
        fontSize: 15,
        letterSpacing: 1
    },
    linkContainer: {
        justifyContent: 'center',
        alignItems: 'center'
    },
    link: {
        textAlign: 'center',
        fontSize: 12,
        fontFamily: 'Montserrat-Bold',
        letterSpacing: 1.6,
        textDecorationLine: 'underline',
        textTransform: 'uppercase'
    },
    proofButton: {
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 10
    },
    proofText: {
        fontFamily: 'Montserrat-SemiBold',
        fontSize: 16,
        letterSpacing: 0.5,
        marginVertical: 17,
        textAlign: 'center',
        color: '#F7F7F7'
    },
    title: {
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center'
    }
})
