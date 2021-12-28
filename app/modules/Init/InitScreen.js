/**
 * @version 0.43
 * screen while app is loading data
 */
import React from 'react'
import { connect } from 'react-redux'
import { View, Text, TouchableOpacity, Linking, StyleSheet, StatusBar } from 'react-native'
import FontAwesome from 'react-native-vector-icons/FontAwesome'
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons'
import LottieView from 'lottie-react-native'

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
import { ThemeContext } from '@app/theme/ThemeProvider'
import { LockScreenFlowTypes, setLockScreenConfig } from '@app/appstores/Stores/LockScreen/LockScreenActions'

class InitScreen extends React.PureComponent {

    state = {
        status: ''
    }

    componentDidMount() {
        this.initAnimationRef.play()
        this.init()
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        this.initAnimationRef.play()
        this.init()
    }

    init = async () => {
        const { isLight } = this.context

        StatusBar.setBarStyle(isLight ? 'dark-content' : 'light-content')

        if (this.props.init === true) {
            clearTimeout(this.statusTimeout)
            setTimeout(() => {
                if (this.props.lockScreenStatus * 1 > 0) {
                    setLockScreenConfig({ flowType: LockScreenFlowTypes.INIT_POPUP })
                    NavStore.reset('LockScreenPop')
                } else {
                    NavStore.reset('TabBar')
                }
            }, 500)
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
            const shareOptions = await SendLog.getAll('Init Error ' + this.props.initError)
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
            App.init({ source: 'InitScreen.render', onMount: false })
        }

        const { colors, isLight, GRID_SIZE } = this.context

        MarketingAnalytics.setCurrentScreen('InitScreen.index')
        return (
            <View style={[styles.wrapper, { backgroundColor: colors.common.background }]}>
                <StatusBar translucent={false} backgroundColor={colors.common.background} barStyle={isLight ? 'dark-content' : 'light-content'} />
                <View style={{ position: 'absolute', top: 20, left: 20 }}>
                    <Text style={{ marginTop: 40 }}>
                        {this.state.status}
                    </Text>
                </View>

                <LottieView
                    ref={ref => this.initAnimationRef = ref}
                    style={{ marginBottom: GRID_SIZE * 2, flex: 1 }}
                    source={isLight ? require('@assets/jsons/animations/LoaderTrusteeLight.json') : require('@assets/jsons/animations/LoaderTrusteeDark.json')}
                    useNativeDriver
                    autoPlay
                    loop
                />

                <View style={{ flex: 1, justifyContent: 'flex-end', marginBottom: GRID_SIZE * 5 }}>
                    <View>
                        <Text style={[styles.appName__text, { color: colors.initScreen.appName }]} numberOfLines={1}>
                            TRUSTEE WALLET
                        </Text>
                        <View>
                            <Text style={[styles.appVersion__text, { color: colors.common.text1, marginTop: GRID_SIZE / 2 }]} >
                                {'#' + config.version.hash + ' | ' + config.version.code}
                            </Text>
                        </View>

                        {this.props.initError &&
                            <View style={[styles.block__content, { backgroundColor: colors.common.background }]}>

                                <TouchableOpacity style={styles.header__description}>
                                    <Text style={[styles.header__title, { color: colors.common.text1 }]}>
                                        {strings('settings.error.title')}
                                    </Text>
                                    <Text>{this.props.initError}</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.block__item}
                                    onPress={this.handleLogs}>
                                    <FontAwesome name='bug' size={20} style={styles.block__icon} color={colors.common.text1} />
                                    <Text style={[styles.block__text, { color: colors.common.text1 }]}
                                        numberOfLines={1}>{strings('settings.other.copyLogs')}</Text>
                                </TouchableOpacity>

                                <View style={styles.divider} />

                                <TouchableOpacity style={styles.block__item}
                                    onPress={this.handleSupport}>
                                    <MaterialIcon name='telegram' size={20} style={styles.block__icon} color={colors.common.text1} />
                                    <Text style={[styles.block__text, { color: colors.common.text1 }]} numberOfLines={1}>{strings('settings.error.contactSupport')}</Text>
                                </TouchableOpacity>

                            </View>
                        }
                    </View>
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
        fontSize: 26,
        lineHeight: 30,
        fontFamily: 'Montserrat-Bold',
        textAlign: 'center',
        zIndex: 2,
        letterSpacing: 1
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
        textAlign: 'center',
        fontFamily: 'SFUIDisplay-Regular',
        fontSize: 12,
        lineHeight: 14,
        opacity: 0.5
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
        paddingRight: 7
    },
    block__item: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingLeft: 8,
        paddingRight: 8,
        height: 42,
    },
    block__text: {
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
