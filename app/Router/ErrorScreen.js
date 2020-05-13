import React from 'react'
import { Image, Linking, ScrollView, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native'
import FontAwesome from 'react-native-vector-icons/FontAwesome'
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons'
import AsyncStorage from '@react-native-community/async-storage'
import Share from 'react-native-share'
import { strings } from '../services/i18n'
import NavStore from '../components/navigation/NavStore'
import GradientView from '../components/elements/GradientView'
import config from '../config/config'
import copyToClipboard from '../services/UI/CopyToClipboard/CopyToClipboard'
import Toast from '../services/UI/Toast/Toast'
import { setLoaderStatus } from '../appstores/Stores/Main/MainStoreActions'
import DBExport from '../appstores/DataSource/DB/DBExport/DBExport'
import Log from '../services/Log/Log'
import BlocksoftCryptoLog from '../../crypto/common/BlocksoftCryptoLog'
import FileSystem from '../services/FileSystem/FileSystem'
import { showModal } from '../appstores/Stores/Modal/ModalActions'

import App from '../appstores/Actions/App/App'


let CACHE_ERROR = ''

const goHome = (props) => {
    App.initStatus = 'resetError'
    props.resetError()
}

const copyVersion = () => {
    copyToClipboard(`${config.version.code} | #${config.version.hash} ${CACHE_ERROR}`)
    Toast.setMessage(strings('toast.copied')).show(-100)
}

const handleSupport = () => {
    Linking.openURL('https://t.me/trustee_support_bot')
}

const handleLogs = async () => {
    let deviceToken = ''
    try {
        deviceToken = await AsyncStorage.getItem('fcmToken')
    } catch (e) {
        // do nothing
    }

    setLoaderStatus(true)

    DBExport.getSql().then(async (sql) => {

        const logs = `    
          
                ↑↑↑ Send to: contact@trustee.deals ↑↑↑
                ${deviceToken} 
                --LOG-- 
                ${Log.getHeaders()} 
                
                
                --SQL-- 
                ${sql}
            `
        const fs = new FileSystem()
        await (fs.setFileEncoding('utf8').setFileName('Logs').setFileExtension('txt')).writeFile(logs)

        const urls = [
            await fs.getPathOrBase64(),
            await Log.FS.ALL.getPathOrBase64(),
            await Log.FS.DAEMON.getPathOrBase64(),
            await BlocksoftCryptoLog.FS.getPathOrBase64()
        ]

        const shareOptions = {
            title: 'Trustee. Support',
            subject: 'Trustee. Support',
            email: 'contact@trustee.deals',
            message: '↑↑↑ Send to: contact@trustee.deals ↑↑↑',
            urls
        }

        Share.open(shareOptions)
            .then((res) => {
                setLoaderStatus(false)
            })
            .catch(e => {
                setLoaderStatus(false)

                let text = e.message
                if (typeof (e.error) !== 'undefined' && e.error.indexOf('No Activity') !== -1) {
                    text = strings('modal.walletLog.noMailApp')
                }
                if (text.indexOf('User did not share') !== -1) {
                    text = strings('modal.walletLog.notComplited')
                }
                showModal({
                    type: 'INFO_MODAL',
                    icon: false,
                    title: strings('modal.walletLog.sorry'),
                    description: text
                })

            })
    }).catch(function(e) {
        setLoaderStatus(false)
        let text = e.message
        let log = e.message
        if (typeof (e.error) !== 'undefined' && e.error.indexOf('No Activity') !== -1) {
            text = strings('modal.walletLog.noMailApp')
            log += ' ' + e.error
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
    })
}

const ErrorScreen = (props) => {
    // NavStore.goNext('SettingsScreenStack')

    CACHE_ERROR = JSON.stringify(props.error)
    return (
        <GradientView style={styles.wrapper} array={styles_.array} start={styles_.start} end={styles_.end}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.wrapper__content}>
                    <View style={styles.header}>
                        <View style={styles.header__content}>
                            <TouchableWithoutFeedback
                                style={{ backgroundColor: '#fff' }}>
                                <Image
                                    style={styles.header__logo}
                                    resizeMode='stretch'
                                    source={require('../assets/images/logoAbout.png')}/>
                            </TouchableWithoutFeedback>
                            {/*<Text style={styles.header__title}>{  strings('settings.about.header', { OS: Platform.OS === 'android' ? 'Android' : 'IOS' } ) }</Text>*/}
                            <TouchableOpacity style={styles.header__description} onPress={copyVersion}>
                                <Text style={styles.header__title}>{strings('settings.about.version')} {config.version.code}</Text>
                                <Text style={styles.header__hash}>#{config.version.hash}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                    <View style={styles.block}>
                        <View style={styles.block__content}>
                            <TouchableOpacity style={styles.header__description} onPress={copyVersion}>
                                <Text>
                                    <Text style={styles.header__title}>
                                        {strings('settings.error.title')}
                                    </Text>
                                </Text>
                                <Text>
                                    <Text>{CACHE_ERROR}</Text>
                                </Text>
                            </TouchableOpacity>

                            <View style={styles.divider}/>
                            <TouchableOpacity style={styles.block__item}
                                              onPress={handleLogs}>
                                <FontAwesome name="bug" size={20} style={styles.block__icon}/>
                                <Text style={styles.block__text} numberOfLines={1}>{strings('settings.other.copyLogs')}</Text>
                            </TouchableOpacity>

                            <View style={styles.divider}/>

                            <TouchableOpacity style={styles.block__item}
                                              onPress={handleSupport}>
                                <MaterialIcon name="telegram" size={20} style={styles.block__icon}/>
                                <Text style={styles.block__text} numberOfLines={1}>{strings('settings.error.contactSupport')}</Text>
                            </TouchableOpacity>


                            <View style={styles.divider}/>
                            <TouchableOpacity style={styles.block__item}
                                              onPress={() => goHome(props)}>
                                <FontAwesome name="refresh" size={20} style={styles.block__icon}/>
                                <Text style={styles.block__text} numberOfLines={1}>{strings('settings.error.tryAgain')}</Text>
                            </TouchableOpacity>
                            <View style={styles.divider}/>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </GradientView>
    )
}

export default ErrorScreen

const styles_ = {
    array: ['#fff', '#fff'],
    start: { x: 0.0, y: 0 },
    end: { x: 0, y: 1 }
}

const styles = {
    wrapper: {
        flex: 1
    },
    wrapper__top: {
        height: 115,
        marginBottom: 35
    },
    wrapper__bg: {
        width: '100%',
        height: '100%'
    },
    wrapper__content: {
        marginTop: 80,
        paddingLeft: 15,
        paddingRight: 15
    },
    block__content: {
        paddingLeft: 7,
        paddingRight: 7,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.23,
        shadowRadius: 2.62,

        elevation: 4,
        backgroundColor: '#fff',
        borderRadius: 15
    },
    block__item: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: 8,
        paddingRight: 8,
        height: 42
    },
    block__text: {
        flex: 1,

        fontFamily: 'SFUIDisplay-Regular',
        fontSize: 19,
        color: '#404040'
    },
    header: {
        marginTop: 50,
        marginBottom: 20
    },
    header__title: {
        fontFamily: 'SFUIDisplay-Regular',
        fontSize: 22,
        color: '#404040',
        textAlign: 'center'
    },
    header__description: {
        alignItems: 'center'
    },
    header__row: {
        flexDirection: 'row',
        justifyContent: 'space-around'
    },
    header__text: {
        fontFamily: 'SFUIDisplay-Regular',
        fontSize: 14,
        color: '#999999'
    },
    header__hash: {
        fontFamily: 'SFUIDisplay-Regular',
        fontSize: 10,
        color: '#999999'
    },
    header__version: {
        fontFamily: 'SFUIDisplay-Regular',
        fontSize: 19,
        color: '#404040'
    },
    divider: {
        borderBottomWidth: 1,
        borderBottomColor: '#e3e6e9'
    },
    block__icon: {
        marginRight: 15,
        color: '#999999'
    },
    header__logo: {
        alignSelf: 'center',
        width: 170,
        height: 200,
        marginBottom: -60
    }

}
