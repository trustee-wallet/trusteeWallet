/**
 * @version 0.9
 */
import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Image, View, Text, Platform, TouchableOpacity, Linking } from 'react-native'



import {
    UIActivityIndicator,
    MaterialIndicator
} from 'react-native-indicators'

import GradientView from '../../components/elements/GradientView'
import NavStore from '../../components/navigation/NavStore'

import App from '../../appstores/Actions/App/App'

import Log from '../../services/Log/Log'

import config from '../../config/config'

import Theme from '../../themes/Themes'
import FontAwesome from 'react-native-vector-icons/FontAwesome'
import { strings } from '../../services/i18n'
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons'
import { setLoaderStatus } from '../../appstores/Stores/Main/MainStoreActions'
import SendLog from '../../services/Log/SendLog'
import prettyShare from '../../services/UI/PrettyShare/PrettyShare'
import BlocksoftCryptoLog from '../../../crypto/common/BlocksoftCryptoLog'
import { showModal } from '../../appstores/Stores/Modal/ModalActions'
import BlocksoftExternalSettings from '../../../crypto/common/BlocksoftExternalSettings'
import MarketingEvent from '../../services/Marketing/MarketingEvent'
import MarketingAnalytics from '../../services/Marketing/MarketingAnalytics'

let styles


class InitScreen extends Component {

    constructor() {
        super()
        this.state = {
            init: false,
            initError: false
        }
    }

    UNSAFE_componentWillMount() {
        Log.log('InitScreen is mounted')
        styles = Theme.getStyles().initScreenStyles
    }

    componentDidMount() {
        try {
            App.init({navigateToInit : false, source : 'InitScreen.mount'})
        } catch (e) {
            this.setState({
                initError: e.message
            })
        }
    }

    UNSAFE_componentWillReceiveProps(props) {
        Log.log('InitScreen is receiving props')
        // @debug for raw testing
        // NavStore.reset('WalletCreateScreen')
        if (props.data.initError) {
            this.setState({
                initError: props.data.initError
            })
        }
        if (props.data.init === true) { //this one is making "freezing"//&& this.props.data.init !== props.data.init) {
            if (+props.settings.keystore.lockScreenStatus) {
                Log.log('InitScreen navigated to LockScreen')
                NavStore.reset('LockScreen')
            } else {
                Log.log('InitScreen navigated to DashboardStack')
                NavStore.reset('DashboardStack')
            }
        } else {
            Log.log('!!!!!!!!!!!!!!!!InitScreen will be here till DB inited')
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
            const shareOptions = await SendLog.getAll(this.state.initError)
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
        MarketingAnalytics.setCurrentScreen('InitScreen.index')

        return (
            <GradientView style={styles.wrapper} array={styles_.array} start={styles_.start} end={styles_.end}>
                <View style={{ flex: 1, justifyContent: 'center' }}>
                    <Image
                        style={styles.image}
                        source={styles.image__url.path}
                    />
                    <View style={{ marginTop: -70, marginBottom: 60 }}>
                        {Platform.OS === 'ios' ? <UIActivityIndicator size={30} color='#3E3453'/> :
                            <MaterialIndicator size={30} color='#3E3453'/>}
                    </View>
                    <View style={{ position: 'relative' }}>
                        <Text style={styles.appName__text} numberOfLines={1}>
                            TRUSTEE WALLET
                        </Text>
                        <Text style={{
                            position: 'absolute',
                            top: 1,
                            left: 1,

                            width: '100%',

                            fontSize: 30,
                            fontFamily: 'SFUIDisplay-Bold',
                            color: '#3E3453',
                            textAlign: 'center',
                            zIndex: 1
                        }} numberOfLines={1}>
                            TRUSTEE WALLET
                        </Text>
                        {
                            this.state.initError ?
                                <View>
                                    <View style={stylesOld.block}>
                                        <View style={stylesOld.block__content}>

                                            <TouchableOpacity style={stylesOld.header__description}>
                                                <Text>
                                                    <Text style={styles.header__title}>
                                                        {strings('settings.error.title')}
                                                    </Text>
                                                </Text>
                                                <Text>
                                                    <Text>{this.state.initError}</Text>
                                                </Text>
                                            </TouchableOpacity>

                                            <TouchableOpacity style={stylesOld.block__item}
                                                              onPress={this.handleLogs}>
                                                <FontAwesome name="bug" size={20} style={stylesOld.block__icon}/>
                                                <Text style={stylesOld.block__text}
                                                      numberOfLines={1}>{strings('settings.other.copyLogs')}</Text>
                                            </TouchableOpacity>

                                            <View style={stylesOld.divider}/>

                                            <TouchableOpacity style={stylesOld.block__item}
                                                              onPress={this.handleSupport}>
                                                <MaterialIcon name="telegram" size={20} style={stylesOld.block__icon}/>
                                                <Text style={stylesOld.block__text} numberOfLines={1}>{strings('settings.error.contactSupport')}</Text>
                                            </TouchableOpacity>

                                        </View>
                                    </View>

                                </View>
                                : null
                        }
                    </View>
                </View>
                <View style={{ marginTop: 'auto' }}>
                    <Text style={{
                        marginBottom: 10,
                        opacity: .5,
                        textAlign: 'center',
                        fontFamily: 'SFUIDisplay-Regular',
                        fontSize: 10,
                        color: '#3E3453'
                    }}>
                        {'#' + config.version.hash + ' | ' + config.version.code}
                    </Text>
                </View>
            </GradientView>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        settings: state.settingsStore,
        data: state.mainStore
    }
}

export default connect(mapStateToProps, {})(InitScreen)

const styles_ = {
    array: ['#f2f2f2', '#f2f2f2'],
    start: { x: 0.0, y: 0 },
    end: { x: 0, y: 1 }
}

const stylesOld = {
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
        color: '#404040'
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
}
