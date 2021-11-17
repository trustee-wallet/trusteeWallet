/**
 * @version 0.42
 * @author Vadym
 */

import React, { PureComponent } from 'react'
import {
    Image,
    ImageBackground,
    Text,
    TouchableOpacity,
    View,
    StyleSheet,
    Dimensions
} from 'react-native'

import { strings } from '@app/services/i18n'
import QrCodeBox from '@app/components/elements/QrCodeBox'
import CustomIcon from '@app/components/elements/CustomIcon'
import MarketingEvent from '@app/services/Marketing/MarketingEvent'
import copyToClipboard from '@app/services/UI/CopyToClipboard/CopyToClipboard'
import Toast from '@app/services/UI/Toast/Toast'
import Log from '@app/services/Log/Log'
import { ThemeContext } from '@app/theme/ThemeProvider'

import qrLogo from '@assets/images/logoWithWhiteBG.png'

const { width: WINDOW_WIDTH, height: WINDOW_HEIGHT } = Dimensions.get('window')

class QrCodePage extends PureComponent {

    copyToClip = (token) => {
        MarketingEvent.logEvent('taki_cashback_3_copyToClip', { cashbackLink: token })
        copyToClipboard(token)
        Toast.setMessage(strings('toast.copied')).show()
    }

    handleRenderQrError = (e) => {
        if (e.message !== 'No input text') Log.err('CashbackScreen QRCode error ' + e.message)
    }

    render() {

        const {
            cashbackLinkTitle,
            cashbackLink
        } = this.props

        const {
            colors,
            GRID_SIZE
        } = this.context

        return(
            <>
                <ImageBackground
                    style={styles.qrBg}
                    source={require('@assets/images/bgQR2.png')}
                >
                    <Text style={[styles.pageSubtitle, { color: colors.common.text1, marginLeft: GRID_SIZE * 1.5, marginTop: GRID_SIZE }]}>{strings('cashback.pageSubtitle')}</Text>
                    <View>
                        <View style={styles.pageSubtitleTextBox}>
                            <Text style={[styles.pageSubtitleText, { color: colors.common.text1 }]}>{strings('cashback.pageSubtitleText')}</Text>
                            <Text style={[styles.pageSubtitleProcent, { color: colors.common.text1}]}>{'30%'}</Text>
                        </View>
                        <Image style={styles.donut1} source={require('@assets/images/donut1.png')} />
                    </View>
                    <View style={styles.qrCodeContainer}>
                        <TouchableOpacity
                            style={[styles.qrBox, { paddingHorizontal: GRID_SIZE, paddingVertical: GRID_SIZE, backgroundColor: '#F5F5F5' }]}
                            onPress={() => this.copyToClip(cashbackLink)}
                            activeOpacity={0.7}
                        >
                            <QrCodeBox
                                value={cashbackLink}
                                size={170}
                                logo={qrLogo}
                                logoSize={60}
                                color={colors.cashback.qrCode}
                                backgroundColor='transparent'
                                onError={this.handleRenderQrError}
                                style={styles.qrCode}
                            />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.tokenBox, { backgroundColor: colors.common.listItem.basic.iconBgLight, marginTop: GRID_SIZE}]}
                            onPress={() => this.copyToClip(cashbackLink)}
                            activeOpacity={0.8}
                        >
                            <Text style={[styles.qrCodeTokenString, { color: colors.cashback.token }]}>
                                {cashbackLinkTitle + '  '}
                                <CustomIcon name='copy' size={WINDOW_WIDTH * 0.06} color={colors.cashback.token} />
                            </Text>
                        </TouchableOpacity>
                        <Text style={[styles.yourToken, { color: colors.common.text3, marginTop: GRID_SIZE / 2 }]}>{strings('cashback.yourToken')}</Text>
                    </View>
                    <Image style={styles.donut2} source={require('@assets/images/donut2.png')} />
                    <Image style={styles.donuts} source={require('@assets/images/donuts.png')} />
                </ImageBackground>
            </>
        )
    }
}

QrCodePage.contextType = ThemeContext

export default QrCodePage

const styles = StyleSheet.create({
    pageSubtitle: {
        zIndex: 2,
        flex: 1,
        fontFamily: 'Montserrat-SemiBold',
        fontSize: WINDOW_WIDTH * 0.058,
        lineHeight: WINDOW_WIDTH * 0.072,
        width: WINDOW_WIDTH * 0.555,
        height: WINDOW_WIDTH * 0.3,
        position: 'absolute',
        top: 0
    },
    pageSubtitleTextBox: {
        position: 'absolute',
        zIndex: 2,
        top: WINDOW_WIDTH * -0.33,
        left: WINDOW_WIDTH * 0.772,
        width: WINDOW_WIDTH * 0.2125
    },
    pageSubtitleProcent: {
        fontFamily: 'Montserrat-SemiBold',
        fontStyle: 'normal',
        textAlign: 'center',
        fontSize: WINDOW_WIDTH * 0.05,
        color: '#ffffff'
    },
    pageSubtitleText: {
        fontFamily: 'Montserrat-SemiBold',
        fontStyle: 'normal',
        textAlign: 'center',
        fontSize: WINDOW_WIDTH * 0.04,
        color: '#ffffff'
    },
    qrCodeContainer: {
        position: 'absolute',
        marginTop: WINDOW_WIDTH * 0.25,
        top: WINDOW_WIDTH * 0.075,
        left: WINDOW_WIDTH * 0.23,
        alignItems: 'center'
    },
    qrBox: {
        flex: 1,
        
        borderRadius: 24,
        shadowColor: "#000",
        shadowOffset: {
        	width: 0,
        	height: 3,
        },
        shadowOpacity: 0.27,
        shadowRadius: 4.65,

        elevation: 6,  
    },
    qrCode: {
        alignSelf: 'center'
    },
    qrCodeTokenString: {
        justifyContent: 'space-between',
        fontFamily: 'Montserrat-SemiBold',
        fontSize: WINDOW_WIDTH * 0.05,
        lineHeight: WINDOW_WIDTH * 0.06,
        textAlign: 'center'
    },
    qrBg: {
        justifyContent: 'center',
        alignSelf: 'center',
        position: 'relative',
        width: WINDOW_WIDTH,
        height: WINDOW_HEIGHT,
        
    },
    donut1: {
        position: 'relative',
        top: WINDOW_WIDTH * -0.47,
        left: WINDOW_WIDTH * 0.64,
        width: WINDOW_WIDTH * 0.47,
        height: WINDOW_WIDTH * 0.47,
        resizeMode: 'contain'
    },
    buttonsRow: {
        flexDirection: 'row',
        justifyContent: 'center'
    },
    buttonContainer: {
        marginTop: 12,
        flex: 1
    },
    tokenBox: {
        borderRadius: 16,
        flex: 1,
        height: 54,
        width: '100%',
        alignSelf: 'center',
        justifyContent: 'center',
        zIndex: 2
    },
    yourToken: {
        fontFamily: 'SFUIDisplay-Regular',
        fontSize: WINDOW_WIDTH * 0.04,
        lineHeight: WINDOW_WIDTH * 0.05,
        letterSpacing: 1,
        zIndex: 2
    },
    donut2: {
        width: WINDOW_WIDTH * 0.38,
        height: WINDOW_WIDTH * 0.38,
        left: WINDOW_WIDTH * 0.78,
        top: WINDOW_WIDTH * 0.2,
        resizeMode: 'contain'
    },
    donuts: {
        width: WINDOW_WIDTH * 0.6,
        height: WINDOW_WIDTH * 0.6,
        top: -WINDOW_WIDTH * 0.03,
        left: -WINDOW_WIDTH * 0.11,
        resizeMode: 'contain'
    }
})
