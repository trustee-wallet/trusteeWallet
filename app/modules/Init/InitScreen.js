/**
 * @version 0.43
 * screen while app is loading data
 */
import React from 'react'
import { connect } from 'react-redux'
import { Image, View, Text, Platform, TouchableOpacity, Linking, StyleSheet } from 'react-native'
import { UIActivityIndicator, MaterialIndicator } from 'react-native-indicators'
import FontAwesome from 'react-native-vector-icons/FontAwesome'
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons'

import NavStore from '@app/components/navigation/NavStore'

import App from '@app/appstores/Actions/App/App'

import Log from '@app/services/Log/Log'
import BlocksoftCryptoLog from '@crypto/common/BlocksoftCryptoLog'
import SendLog from '@app/services/Log/SendLog'

import config from '@app/config/config'

import { strings } from '@app/services/i18n'
import { setLoaderStatus } from '@app/appstores/Stores/Main/MainStoreActions'
import prettyShare from '@app/services/UI/PrettyShare/PrettyShare'

import BlocksoftExternalSettings from '@crypto/common/BlocksoftExternalSettings'
import MarketingEvent from '@app/services/Marketing/MarketingEvent'
import MarketingAnalytics from '@app/services/Marketing/MarketingAnalytics'

import { showModal } from '@app/appstores/Stores/Modal/ModalActions'
import { getInit, getInitError } from '@app/appstores/Stores/Init/selectors'
import { getLockScreenStatus } from '@app/appstores/Stores/Settings/selectors'
import { ThemeContext } from '@app/modules/theme/ThemeProvider'

class InitScreen extends React.PureComponent {

    constructor() {
        super()
        this.state = {
            status: ''
        }
        this.timeout = () => {}
    }

    componentDidMount() {
       this.init()
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        this.init()
    }

    init = async () => {
        if (this.props.init === true) {
            clearTimeout(this.statusTimeout)
            if (this.props.lockScreenStatus * 1 > 0) {
                NavStore.reset('LockScreenPop')
            } else {
                NavStore.reset('TabBar')
            }
        } else {
            try {
                this.statusTimeout = setTimeout(() => {
                    this.setState({
                        status: App.initStatus + ' ' + App.initError
                    })
                }, 60000)
            } catch (e) {
            }
        }
    }

    handleSupport = async () => {
        const link = await BlocksoftExternalSettings.get('SUPPORT_BOT')
        MarketingEvent.logEvent('taki_support', { link, screen: 'ERROR_INIT' })
        Linking.openURL(link)
    }

    handleLogs = async () => {

        setLoaderStatus(true)

        try {
            const shareOptions = await SendLog.getAll(this.props.initError)
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

    render() {
        if (App.initStatus === 'resetError') {
            App.init({source : 'InitScreen.render', onMount : false})
        }

        const { colors } = this.context

        MarketingAnalytics.setCurrentScreen('InitScreen.index')
        return (
            <View style={[styles.wrapper, { backgroundColor: colors.common.background }]}>
                <View style={{ position: 'absolute', top: 20, left: 20 }}>
                    <Text style={{ marginTop: 40 }}>
                        {this.state.status}
                    </Text>
                </View>
                <View style={{ flex: 1, justifyContent: 'center' }}>
                    <Image
                        style={styles.image}
                        source={require('../../assets/images/logo.png')}
                    />
                    <View style={{ marginTop: -70, marginBottom: 60 }}>
                        {Platform.OS === 'ios' ? <UIActivityIndicator size={30} color='#3E3453' /> :
                            <MaterialIndicator size={30} color='#3E3453' />}
                    </View>
                    <View style={{ position: 'relative' }}>
                        <Text style={[styles.appName__text, { color: colors.initScreen.appName }]} numberOfLines={1}>
                            TRUSTEE WALLET
                        </Text>
                        <Text style={[styles.appName__text2, { color: colors.initScreen.appNameSub }]} numberOfLines={1}>
                            TRUSTEE WALLET
                        </Text>
                        {
                            this.props.initError ?
                                <View>
                                    <View style={styles.block}>
                                        <View style={styles.block__content}>

                                            <TouchableOpacity style={styles.header__description}>
                                                <Text>
                                                    <Text style={[styles.header__title, { color: colors.common.text1 }]}>
                                                        {strings('settings.error.title')}
                                                    </Text>
                                                </Text>
                                                <Text>
                                                    <Text>{this.props.initError}</Text>
                                                </Text>
                                            </TouchableOpacity>

                                            <TouchableOpacity style={styles.block__item}
                                                              onPress={this.handleLogs}>
                                                <FontAwesome name='bug' size={20} style={styles.block__icon} />
                                                <Text style={[styles.block__text, { color: colors.common.text1 }]}
                                                      numberOfLines={1}>{strings('settings.other.copyLogs')}</Text>
                                            </TouchableOpacity>

                                            <View style={styles.divider} />

                                            <TouchableOpacity style={styles.block__item}
                                                              onPress={this.handleSupport}>
                                                <MaterialIcon name='telegram' size={20} style={styles.block__icon} />
                                                <Text style={[styles.block__text, { color: colors.common.text1 }]} numberOfLines={1}>{strings('settings.error.contactSupport')}</Text>
                                            </TouchableOpacity>

                                        </View>
                                    </View>

                                </View>
                                : null
                        }
                    </View>
                </View>
                <View style={{ marginTop: 'auto' }}>
                    <Text style={[styles.appVersion__text, { color: colors.initScreen.appVersion }]} >
                        {'#' + config.version.hash + ' | ' + config.version.code}
                    </Text>
                </View>
            </View>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        lockScreenStatus: getLockScreenStatus(state),
        init: getInit(state),
        initError: getInitError(state)
    }
}

InitScreen.contextType = ThemeContext

export default connect(mapStateToProps, {})(InitScreen)

const styles = StyleSheet.create({
    wrapper: {
        flex: 1,
        justifyContent: 'center',
        paddingLeft: 30,
        paddingRight: 30
    },
    image: {
        alignSelf: 'center',
        width: 148,
        height: 180,
        marginBottom: 147
    },
    button: {
        marginBottom: 20
    },
    appName__text: {
        position: 'relative',
        fontSize: 30,
        fontFamily: 'SFUIDisplay-Bold',
        textAlign: 'center',
        zIndex: 2
    },
    appName__text2: {
        position: 'absolute',
        top: 1,
        left: 1,
        width: '100%',
        fontSize: 30,
        fontFamily: 'SFUIDisplay-Bold',
        textAlign: 'center',
        zIndex: 1
    },
    appVersion__text: {
        marginBottom: 10,
        opacity: .5,
        textAlign: 'center',
        fontFamily: 'SFUIDisplay-Regular',
        fontSize: 10,
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
        paddingTop: 20,
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
    },
    header__title: {
        fontFamily: 'SFUIDisplay-Regular',
        fontSize: 22,
        textAlign: 'center'
    },
    header__description: {
        alignItems: 'center'
    }
})
