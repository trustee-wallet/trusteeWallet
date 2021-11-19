/**
 * @version 0.43
 */
import React from 'react'
import { Dimensions, Linking, PixelRatio, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import FontAwesome from 'react-native-vector-icons/FontAwesome'
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons'
import {widthPercentageToDP as wp, heightPercentageToDP as hp} from 'react-native-responsive-screen'
import {strings} from '@app/services/i18n'
import config from '@app/config/config'
import {setLoaderStatus} from '@app/appstores/Stores/Main/MainStoreActions'
import Log from '@app/services/Log/Log'
import BlocksoftCryptoLog from '@app/../crypto/common/BlocksoftCryptoLog'
import SendLog from '@app/services/Log/SendLog'
import {showModal} from '@app/appstores/Stores/Modal/ModalActions'

import CustomIcon from '@app/components/elements/CustomIcon'
import App from '@app/appstores/Actions/App/App'
import prettyShare from '@app/services/UI/PrettyShare/PrettyShare'

import SvgLogo from './ErrorScreenLogo'
import BlocksoftExternalSettings from '@crypto/common/BlocksoftExternalSettings'
import MarketingEvent from '@app/services/Marketing/MarketingEvent'
import NavStore from '@app/components/navigation/NavStore'

const {height: HEIGHT, width: WIDTH} = Dimensions.get('window')

let CACHE_ERROR = ''

let PHONE = '';
if (PixelRatio.get() === 2 && WIDTH > 600) {
    PHONE = true;
} else if(PixelRatio.get() === 3.5 && WIDTH < 600) {
    PHONE = false;
} else {
    PHONE = false;
}

const goHome = (props) => {
    App.initStatus = 'resetError'
    NavStore.reset('InitScreen')
}

const handleSupport = async () => {
    const link = await BlocksoftExternalSettings.get('SUPPORT_BOT')
    MarketingEvent.logEvent('taki_support', { link, screen: 'ERROR_GENERAL' })
    Linking.openURL(link)
}

const handleLogs = async () => {

    setLoaderStatus(true)

    try {
        const shareOptions = await SendLog.getAll('Cache Error ' + CACHE_ERROR)
        if (shareOptions) {
            await prettyShare(shareOptions)
        }
        setLoaderStatus(false)
    } catch (e) {
        try {
            setLoaderStatus(false)
            let text = e.message || false
            let log = e.message
            if (typeof (e.error) !== 'undefined') {
                if (e.error.toString().indexOf('No Activity') !== -1) {
                    text = strings('modal.walletLog.noMailApp')
                } else if (!text) {
                    text = JSON.stringify(e.error).substr(0, 100)
                }
                log += ' ' + JSON.stringify(e.error)
            }
            if (text.indexOf('User did not share') !== -1) {
                text = strings('modal.walletLog.notComplited')
            }
            Log.err('SettingsMain.handleLogs error ' + log)
            BlocksoftCryptoLog.err('SettingsMain.handleLogs error ' + log)
            showModal({
                type: 'INFO_MODAL',
                icon: false,
                title: strings('modal.walletLog.sorry'),
                description: text
            })
        } catch (e1) {
            Log.err('SettingsMain.handleLogs error1 ' + e1.message)
        }
    }
}

const ErrorScreen = (props) => {
    let error = props.error || ''
    if (typeof props.route !== 'undefined'
        && typeof props.route.params !== 'undefined'
        && typeof props.route.params.error !== 'undefined'
    ) {
        error = props.route.params.error
    }

    const tmp = JSON.stringify(error)
    if (tmp !== CACHE_ERROR) {
        Log.err('ErrorScreen inited ' + tmp)
        CACHE_ERROR = tmp
    }
    return (
        <View style={styles.wrapper}>
            <View style={styles.wrapper__content}>
                <SvgLogo width={WIDTH * 0.87} height={HEIGHT * 0.24} styles={styles}/>
                <View style={styles.header__description}>
                    <Text style={!PHONE ? styles.header__title : stylesTablet.header__title__tablet}>
                        {strings('settings.error.title')}
                    </Text>
                    <Text style={!PHONE ? styles.text__error : stylesTablet.text__error__tablet}>
                        {strings('settings.error.text')}
                    </Text>
                </View>
                <View style={styles.button}>
                    <TouchableOpacity style={styles.block__item}
                                      onPress={handleLogs}>
                        <View style={!PHONE ? styles.circle : stylesTablet.circle__tablet}>
                            {/* <FontAwesome name='bug' size={30} style={styles.block__icon}/> */}
                            <FontAwesome name='bug' size={!PHONE ? 30 : 40} style={styles.block__icon}/>
                        </View>
                        <Text style={!PHONE ? styles.block__text : stylesTablet.block__text__tablet}
                              numberOfLines={2}>{strings('settings.other.copyLogs')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.block__item}
                                      onPress={handleSupport}>
                        <View style={!PHONE ? styles.circle : stylesTablet.circle__tablet}>
                            {/* <MaterialIcon name='telegram' size={38} style={{...styles.block__icon, marginLeft: -5}}/> */}
                            <MaterialIcon name='telegram' size={!PHONE ? 36 : 46}
                                          style={{...styles.block__icon, marginLeft: -5}}/>
                        </View>
                        <Text style={!PHONE ? styles.block__text : stylesTablet.block__text__tablet}
                              numberOfLines={1}>{strings('settings.error.contactSupport')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.block__item}
                                      onPress={() => goHome(props)}>
                        <View style={!PHONE ? styles.circle : stylesTablet.circle__tablet}>
                            <CustomIcon style={{...styles.block__icon, marginBottom: 2}} size={!PHONE ? 30 : 40} name='reload'/>
                        </View>
                        <Text style={!PHONE ? styles.block__text : stylesTablet.block__text__tablet}
                              numberOfLines={1}>{strings('settings.error.tryAgain')}</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.footer}>
                    <View style={styles.footer__content}>
                        <Text
                            style={styles.footer__version}>{strings('settings.about.version', { version: config.version.code })}</Text>
                        <Text style={styles.footer__hash}>#{config.version.hash}</Text>
                    </View>
                </View>
            </View>
        </View>
    )
}

export default ErrorScreen

const styles = StyleSheet.create({
    wrapper: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        alignItems: 'center'
    },
    wrapper__content: {
        // marginTop: 60,
        marginTop: hp('15%'),
        paddingLeft: 15,
        paddingRight: 15,
    },
    header: {
        marginTop: hp('2.5%'),
        // marginTop: 45,
        // marginBottom: hp('2.93%')
        // backgroundColor: 'yellow',
        marginBottom: 20,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        // height: hp('50%'),
        // paddingVertical: hp('9%'),
    },
    header__logo: {
        position: 'relative',
        alignSelf: 'center',
        // width: wp('87%'),
        // backgroundColor: 'green',
        width: WIDTH * 0.62,
        height: HEIGHT * 0.24,
        // marginTop: hp('5.86%'),
    },
    header__logo__phone: {
        position: 'relative',
        alignSelf: 'center',
        // width: wp('87%'),
        // backgroundColor: 'green',
        width: WIDTH * 0.87,
        height: HEIGHT * 0.24,
        // marginTop: hp('5.86%'),
    },
    header__title: {
        fontFamily: 'Montserrat-Regular',
        fontStyle: 'normal',
        fontWeight: 'bold',
        fontSize: hp('2.78%'),
        lineHeight: hp('3.51%'),
        color: '#404040',
        textAlign: 'center',
        marginBottom: hp('1.36%')
    },
    header__description: {
        alignItems: 'center',
        marginBottom: hp('8%')
    },
    text__error: {
        position: 'relative',
        width: wp('85%'),
        height: hp('13%'),
        fontFamily: 'SFUIDisplay-Regular',
        fontStyle: 'normal',
        fontWeight: '500',
        fontSize: hp('2.25%'),
        // fontSize: width * 10,
        lineHeight: hp('2.6%'),
        textAlign: 'center',
        // letterSpacing: wp('0.125%'),
        letterSpacing: 0.5,
        color: '#5c5c5c'
    },
    button: {
        position: 'relative',
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'stretch',
        marginHorizontal: wp('4%')
    },
    block__item: {
        flexDirection: 'column',
        alignItems: 'center',
        paddingLeft: 8,
        paddingRight: 8,
        height: hp('6.15%'),
        marginVertical: 10,
        width: wp('32.5%')
    },
    circle: {
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center',
        width: 56,
        height: 56,
        backgroundColor: '#404040',
        borderRadius: 50,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.30,
        shadowRadius: 4.65,
        elevation: 8,
    },
    block__text: {
        alignSelf: 'center',
        textAlign: 'center',
        fontFamily: 'SFUIDisplay-Regular',
        // fontSize: hp('2.3%'),
        fontSize: 14,
        color: '#404040',
        // marginTop: hp('9.01%')
        marginTop: 5,
        // letterSpacing: wp('0.125%'),
        letterSpacing: 1,
    },
    block__icon: {
        // marginRight: 15,
        color: '#f7f7f7',
    },
    footer: {
        flex: 1,
        justifyContent: 'flex-end',
        marginBottom: hp('1.76%')

    },
    footer__content: {
        position: 'absolute',
        bottom: 0,
        alignSelf: 'center',
    },
    footer__hash: {
        fontFamily: 'SFUIDisplay-Regular',
        fontStyle: 'normal',
        fontWeight: '600',
        fontSize: 14,
        // fontSize: hp('1.65%'),
        lineHeight: 14,
        // lineHeight: hp('1.65%'),
        textAlign: 'center',
        letterSpacing: 1,
        // letterSpacing: wp('0.25%'),
        color: '#5c5c5c',
        marginVertical: 7
        // marginVertical: hp('0.59%')
    },
    footer__version: {
        fontFamily: 'Montserrat-Regular',
        fontStyle: 'normal',
        fontWeight: 'bold',
        // fontSize: hp('2%'),
        fontSize: 16,
        // lineHeight: hp('2%'),
        lineHeight: 16,
        textAlign: 'center',
        color: '#404040'
    },
})

const stylesTablet = StyleSheet.create({
    header__title__tablet: {
        fontFamily: 'Montserrat-Regular',
        fontStyle: 'normal',
        fontWeight: 'bold',
        // fontSize: hp('2.78%'),
        fontSize: 32,
        // lineHeight: hp('3.51%'),
        lineHeight: 32,
        color: '#404040',
        textAlign: 'center',
        // marginTop: hp('1.36%'),
        marginBottom: hp('1.36%')
    },
    text__error__tablet: {
        position: 'relative',
        width: wp('60%'),
        height: hp('13%'),
        fontFamily: 'SFUIDisplay-Regular',
        fontStyle: 'normal',
        fontWeight: '500',
        // fontSize: hp('2.25%'),
        fontSize: 17,
        // lineHeight: hp('2.6%'),
        lineHeight: 22,
        textAlign: 'center',
        // letterSpacing: wp('0.125%'),
        letterSpacing: 0.5,
        color: '#5c5c5c'
    },
    circle__tablet: {
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center',
        width: 76,
        height: 76,
        backgroundColor: '#404040',
        borderRadius: 50,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.30,
        shadowRadius: 4.65,
        elevation: 8,
        marginTop: 60,
    },
    block__text__tablet: {
        alignSelf: 'center',
        textAlign: 'center',
        fontFamily: 'SFUIDisplay-Regular',
        // fontSize: hp('2.3%'),
        fontSize: 17,
        fontWeight: '600',
        color: '#404040',
        lineHeight: 17,
        // marginTop: hp('9.01%')
        marginTop: 15,
        // letterSpacing: wp('0.125%'),
        letterSpacing: 2,
    },
})
