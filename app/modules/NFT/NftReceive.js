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
    TouchableOpacity
} from 'react-native'

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

const { width: WINDOW_WIDTH } = Dimensions.get('window')

class NftReceive extends React.PureComponent {

    state={
        coin: 'ETH',
        token: '0xc1q8n0fq2r3wtsjpzyyy4g9kfmpkds2525mmc5gfv'
    }

    handleBack = () => {
        NavStore.goBack()
    }

    handleShare = () => {
        // TODO share
    }

    renderFlatListItem = ({ item, index }) => {
        return (
            <ReceiveFlatListItem
                data={item}
                margin={index === 0}
            />
        )
    }

    renderFlatList = () => {

        const {
            coin
        } = this.state

        const flatListData = [
            {
                text: 'ethereum',
                inverse: coin === 'ETH',
                action: () => this.setState({ coin: 'ETH' })
            },
            {
                text: 'tron',
                inverse: coin === 'TRX',
                action: () => this.setState({ coin: 'TRX' })
            },
            {
                text: 'polygon',
                inverse: coin === 'MATIC',
                action: () => this.setState({ coin: 'MATIC' })
            },
            {
                text: 'monero',
                inverse: coin === 'XMR',
                action: () => this.setState({ coin: 'XMR' })
            }
        ]

        return (
            <FlatList
                data={flatListData}
                keyExtractor={({ index }) => index}
                horizontal={true}
                renderItem={({ item, index }) => this.renderFlatListItem({ item, index })}
                showsHorizontalScrollIndicator={false}
            />
        )
    }

    copyToLink = (token) => {
        copyToClipboard(token)
        Toast.setMessage(strings('toast.copied')).show()
    }

    render() {

        const {
            coin,
            token
        } = this.state

        const {
            GRID_SIZE,
            colors
        } = this.context

        return (
            <ScreenWrapper
                title={strings('nftMainScreen.title')}
                leftType='back'
                leftAction={this.handleBack}
                rightType='share'
                rightAction={this.handleShare}
            >
                <View style={{ paddingTop: GRID_SIZE, paddingHorizontal: GRID_SIZE * 2 }}>
                    <Text
                        style={[styles.emptyText, {
                            color: colors.common.text3,
                            marginBottom: GRID_SIZE
                        }]}>{strings('nftMainScreen.emptyNftText')}</Text>
                </View>
                <View style={{ flex: 0.085, marginTop: GRID_SIZE }}>
                    {this.renderFlatList()}
                </View>
                <View style={[styles.tokenContainer, { marginLeft: GRID_SIZE, marginTop: GRID_SIZE * 1.5 }]}>
                    <TouchableOpacity onPress={() => this.copyToClip(token)} style={styles.qr}>
                        <QrCodeBox
                            value={token}
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
                        style={[styles.tokenWrapper, {
                        backgroundColor: colors.nftScreen.tokenBg,
                        marginRight: GRID_SIZE
                        }]}
                        onPress={() => this.copyToLink(token)}
                    >
                        <Text style={[styles.tokenText, {
                            color: colors.common.text1,
                            marginHorizontal: GRID_SIZE
                        }]}>{token}</Text>
                        <View style={[styles.copyBtn, { marginTop: GRID_SIZE }]}>
                            <Text style={[styles.qrCodeTokenString, {
                                color: colors.cashback.token,
                            }]}>
                                {strings('account.receiveScreen.copy')}
                            </Text>
                            <CustomIcon name='copy' size={19} color={colors.cashback.token} />
                        </View>
                    </TouchableOpacity>
                </View>
                <View style={{ paddingVertical: GRID_SIZE, paddingHorizontal: GRID_SIZE * 2 }}>
                    <Text style={{...styles.emptyText, color: colors.common.text3 }}>{strings('nftMainScreen.receiveText', { coin: coin })}</Text>
                </View>
            </ScreenWrapper>
        )
    }
}

NftReceive.contextType = ThemeContext

export default NftReceive

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
        alignItems: 'center',
    },
    tokenContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    tokenText: {
        fontFamily: 'SFUIDisplay-SemiBold',
        fontSize: 15,
        lineHeight: 19,
        letterSpacing: 1.5
    },
    qrCodeTokenString: {
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
