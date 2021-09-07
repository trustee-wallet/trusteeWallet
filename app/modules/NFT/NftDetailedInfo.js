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


const { width: WINDOW_WIDTH } = Dimensions.get('window')

class NftDetailedInfo extends React.PureComponent {

    state = {
        heightPhoto: 260, // TODO percent of screen
        data: {
            contractAddress: '0x7d5773e8fee4bc9b679c1eb51b2597984c007682',
            сontractSchema: 'ERC721',
            cryptoCurrencySymbol: 'ETH',
            cryptoValuePretty: '?',
            id: 0,
            img: '',
            permalink: '',
            subTitle: '',
            title: '',
            desc: '',
            tokenBlockchainCode: 'ETH',
            tokenId: '',
            usdValuePretty: ''
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

    handleSend = () => {
        // TODO send
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
        const shareOptions = {
            title: this.state.data.title,
            message: this.state.data.subTitle,
            url: this.state.data.permalink
        }
        prettyShare(shareOptions, 'taki_cashback_4_copyToMoreFinish')
    }

    handleOpenQrCode = () => {
        NavStore.goNext('QRCodeScannerScreen')
    }

    render() {

        const {data} = this.state
        const {
            GRID_SIZE,
            colors
        } = this.context

        return (
            <ScreenWrapper
                title={strings('nftMainScreen.info')}
                leftType='back'
                leftAction={this.handleBack}
                rightType='share'
                rightAction={this.handleShareLink}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollViewContent}
                >
                    <View style={styles.container}>
                        <View style={[{
                            width: WINDOW_WIDTH - GRID_SIZE * 2,
                            height: this.state.heightPhoto,
                            marginTop: GRID_SIZE,
                            marginLeft: GRID_SIZE,
                            marginBottom: GRID_SIZE * 1.5
                        }]}>
                            {data.img && data.img !== '' ?
                            <Image
                                style={styles.img}
                                source={{
                                    uri: data.img
                                }}
                                resizeMode='contain'
                            /> : null}
                        </View>
                        <NftTokenInfo
                            containerStyles={styles.title}
                            title={data.title}
                            subTitle={data.subTitle}
                        />
                        <View style={[styles.headerInfoContainer, { marginHorizontal: GRID_SIZE * 2, marginBottom: GRID_SIZE }]}>
                            <View style={styles.currencyInfo}>
                                <NftTokenValue
                                    walletCurrency={data.cryptoCurrencySymbol}
                                    balance={data.cryptoValuePretty}
                                    balanceData={data.usdValuePretty}
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
                        <TouchableOpacity
                            style={styles.linkContainer}
                            onPress={this.openLink}
                        >
                            <Text style={[styles.link, { color: colors.common.text1 }]}>View on OpenSea</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={{
                        paddingHorizontal: GRID_SIZE,
                        paddingVertical: GRID_SIZE * 1.5
                    }}>
                        <Button
                            title={strings('nftMainScreen.proof')}
                            onPress={this.handleOpenQrCode}
                        />
                    </View>
                </ScrollView>
            </ScreenWrapper>
        )
    }
}

NftDetailedInfo.contextType = ThemeContext

export default NftDetailedInfo

const styles = StyleSheet.create({
    scrollViewContent: {
        flexGrow: 1,
        justifyContent: 'space-between'
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
