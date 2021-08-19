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
    View
} from 'react-native'

import ScreenWrapper from '@app/components/elements/ScreenWrapper'
import { strings } from '@app/services/i18n'
import NavStore from '@app/components/navigation/NavStore'
import { ThemeContext } from '@app/theme/ThemeProvider'
import BorderedButton from '@app/components/elements/new/buttons/BorderedButton'
import NftTokenInfo from '@app/modules/NFT/elements/NftTokenInfo'
import NftTokenValue from '@app/modules/NFT/elements/NftTokenValue'
import Button from '@app/components/elements/new/buttons/Button'


const { width: WINDOW_WIDTH } = Dimensions.get('window')

class NftDetailedInfo extends React.PureComponent {

    handleBack = () => {
        NavStore.goBack()
    }

    handleSend = () => {
        // TODO send
    }

    handleOpenLink = () => {
        // TODO share
    }

    handleOpenQrCode = () => {
        NavStore.goNext('QRCodeScannerScreen')
    }

    render() {

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
                rightAction={this.handleOpenLink}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollViewContent}
                >
                    <>
                        <View style={[styles.imageContainer, styles.shadow, {
                            width: WINDOW_WIDTH - GRID_SIZE * 2,
                            marginVertical: GRID_SIZE,
                            marginLeft: GRID_SIZE
                        }]}>
                            <Image
                                style={styles.img}
                                source={require('@assets/images/logo.png')}
                                resizeMode='center'
                            />
                            <View style={[styles.buttonContainer, { right: GRID_SIZE }]}>
                                <BorderedButton
                                    isBlack={true}
                                    containerStyles={styles.button}
                                    icon='send'
                                    text={strings('account.send')}
                                    onPress={this.handleSend}
                                />
                            </View>
                        </View>
                        <View style={styles.headerInfoContainer}>
                            <View style={[styles.titleContainer, { marginLeft: GRID_SIZE }]}>
                                <NftTokenInfo
                                    title='Lucky Otaku'
                                    subTitle='# 732613'
                                />
                            </View>
                            <View style={[styles.currencyInfo, { marginTop: GRID_SIZE, marginRight: GRID_SIZE * 2 }]}>
                                <NftTokenValue
                                    walletCurrency='ETH'
                                    balance='134312'
                                    balanceData='67544677'
                                    currencySymbol='$'
                                />
                            </View>
                        </View>
                        <View style={{ marginHorizontal: GRID_SIZE, marginBottom: GRID_SIZE * 2 }}>
                            <Text style={[styles.infoText, { color: colors.common.text3 }]}>
                                *hissing noises*! I'm 🍀 Lucky Otaku 🎉. In high school, I was voted most likely to work
                                at NASA. I am 36% sphinx, 10% Foreign Film Director, and otherwise bad at math. I think
                                you'll love me beclaws I have cattitude.
                            </Text>
                        </View>
                        <TouchableOpacity
                            style={styles.linkContainer}
                            onPress={this.handleOpenLink}
                        >
                            <Text style={[styles.link, { color: colors.common.text1 }]}>View on OpenSea</Text>
                        </TouchableOpacity>
                    </>
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
    img: {
        flex: 1,
        flexDirection: 'row',
        alignSelf: 'center',
        justifyContent: 'center',
        resizeMode: 'center'
    },
    buttonContainer: {
        position: 'absolute',
        alignSelf: 'flex-end',
    },
    imageContainer: {
        zIndex: 0,
        position: 'relative',
        height: 260,
        backgroundColor: '#FFE0E5',
        borderRadius: 20
    },
    shadow: {
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4
        },
        shadowOpacity: 0.30,
        shadowRadius: 4.65,

        elevation: 8
    },
    button: {
        width: 'auto',
        zIndex: 3
    },
    headerInfoContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    titleContainer: {},
    currencyInfo: {},
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
    }
})
