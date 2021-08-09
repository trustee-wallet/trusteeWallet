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
            cashbackLink,
            cashbackLinkTitle,
        } = this.props

        const {
            colors,
            GRID_SIZE
        } = this.context

        console.log(WINDOW_WIDTH)

        return(
            <>
                <ImageBackground
                    style={styles.qrBg}
                    source={require('@assets/images/qrBG.png')}
                >
                    <Text style={[styles.pageSubtitle, { color: colors.common.text1, marginHorizontal: GRID_SIZE / 2 }]}>{strings('cashback.pageSubtitle')}</Text>
                    <View style={styles.PageSubtitleTextBox}>
                        <Text style={styles.pageSubtitleText}>{strings('cashback.pageSubtitleText')}</Text>
                        <Text style={styles.pageSubtitleProcent}>{'30%'}</Text>
                    </View>
                    <Image style={styles.picProcent} source={require('@assets/images/picProcent.png')} />
                    <TouchableOpacity
                        style={[styles.qrCodeContainer, { marginVertical: GRID_SIZE / 2, marginHorizontal: GRID_SIZE / 2.5, left: WINDOW_WIDTH * 0.276 }]}
                        onPress={() => this.copyToClip(cashbackLink)}
                        activeOpacity={0.8}
                    >
                        <QrCodeBox
                            value={cashbackLink}
                            size={WINDOW_WIDTH * 0.3}
                            color={colors.cashback.qrCode}
                            backgroundColor='transparent'
                            onError={this.handleRenderQrError}
                            style={styles.qrCode}
                        />
                        <Text style={[styles.qrCodeTokenString, { color: colors.cashback.token }]}>
                            {cashbackLinkTitle + ' '}
                            <CustomIcon name='copy' style={{marginLeft: 25}} size={WINDOW_WIDTH * 0.042} color={colors.cashback.token} /></Text>
                    </TouchableOpacity>
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
        lineHeight: WINDOW_WIDTH * 0.062,
        width: WINDOW_WIDTH * 0.555,
        height: WINDOW_WIDTH * 0.3,
        position: 'absolute',
        top: -WINDOW_WIDTH * 0.27
    },
    PageSubtitleTextBox: {
        position: 'absolute',
        zIndex: 2,
        top: -WINDOW_WIDTH * 0.23,
        left: WINDOW_WIDTH * 0.57,
        width: WINDOW_WIDTH * 0.2125
    },
    pageSubtitleProcent: {
        fontFamily: 'Montserrat-Medium',
        fontStyle: 'normal',
        textAlign: 'center',
        fontSize: WINDOW_WIDTH * 0.08,
        color: '#ffffff'
    },
    pageSubtitleText: {
        fontFamily: 'Montserrat-Medium',
        fontStyle: 'normal',
        textAlign: 'center',
        fontSize: WINDOW_WIDTH * 0.0625,
        color: '#ffffff'
    },
    qrCodeContainer: {
        flex: 1,
        alignItems: 'center',
        position: 'absolute',
        top: WINDOW_WIDTH * 0.075
    },
    qrCode: {
        alignSelf: 'center'
    },
    qrCodeTokenString: {
        marginTop: 6,
        justifyContent: 'space-between',
        fontFamily: 'Montserrat-SemiBold',
        fontSize: WINDOW_WIDTH * 0.042,
        lineHeight: WINDOW_WIDTH * 0.042,
        textAlign: 'center'
    },
    qrBg: {
        justifyContent: 'center',
        alignSelf: 'center',
        position: 'relative',
        width: WINDOW_WIDTH * 0.95,
        height: WINDOW_WIDTH * 0.95,
        marginTop: WINDOW_WIDTH * 0.32
    },
    picProcent: {
        position: 'absolute',
        top: -WINDOW_HEIGHT * 0.155,
        left: WINDOW_WIDTH * 0.51,
        width: WINDOW_WIDTH * 0.42,
        height: WINDOW_WIDTH * 0.34
    },
    buttonsRow: {
        flexDirection: 'row',
        justifyContent: 'center'
    },
    buttonContainer: {
        flex: 1
    },

})
