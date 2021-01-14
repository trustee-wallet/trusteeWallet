/**
 * @version 0.9
 */
import React, { Component } from 'react'
import { connect } from 'react-redux'
import { View, Image, Animated, Text, TouchableOpacity } from 'react-native'
import MaterialIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import Orientation from 'react-native-orientation'

import PINCode, { hasUserSetPinCode, deleteUserPinCode } from '@haskkor/react-native-pincode'



import GradientView from '../../components/elements/GradientView'
import NavStore from '../../components/navigation/NavStore'
import Header from '../../components/elements/new/Header'
import { ThemeContext } from '../../modules/theme/ThemeProvider'

import { strings } from '../../services/i18n'

import lockScreenAction from '../../appstores/Stores/LockScreen/LockScreenActions'
import settingsActions from '../../appstores/Stores/Settings/SettingsActions'
import { setLoaderStatus } from '../../appstores/Stores/Main/MainStoreActions'
import Button from '../../components/elements/Button'
import MarketingAnalytics from '../../services/Marketing/MarketingAnalytics'
import { SettingsKeystore } from '../../appstores/Stores/Settings/SettingsKeystore'
import Log from '../../services/Log/Log'
import MarketingEvent from '../../services/Marketing/MarketingEvent'


class LockScreen extends Component {

    constructor(props) {
        super(props)
        this.state = {
            passwordState: null,
            progress: new Animated.Value(0),
            show: false,
            lastStatus: 'status1',
            pinLocked: null,

            headerHeight: 0
        }
    }

    async componentDidMount() {

        Animated.loop(
            Animated.sequence([
                Animated.timing(this.state.progress, {
                    toValue: 1,
                    duration: 500
                }),
                Animated.timing(this.state.progress, {
                    toValue: 0,
                    duration: 500
                })
            ]),
            {
                iterations: 100
            }
        ).start()
        Orientation.lockToPortrait()
    }

    finishProcess = async () => {

        const { flowType, actionCallback, backData } = this.props.lockScreen
        MarketingEvent.UI_DATA.IS_LOCKED = false

        if (flowType === 'WALLET_CONNECT') {
            lockScreenAction.setFlowType({
                flowType: ''
            })
            NavStore.reset('WalletConnectScreen', backData)
        } else if (flowType === 'JUST_CALLBACK') {
            setTimeout(() => {
                actionCallback(false)
                lockScreenAction.setFlowType({ flowType: '' })
                lockScreenAction.setActionCallback({ actionCallback: () => {} })
            }, 500)
        } else if (flowType === 'CREATE_PINCODE') {
            await SettingsKeystore.setAskPinCodeWhenSending('1')
            await SettingsKeystore.setLockScreenStatus('1')
            await settingsActions.getSettings(true)
            lockScreenAction.setFlowType({
                flowType: ''
            })
            NavStore.reset('SettingsScreenStack')
        } else if (flowType === 'DELETE_PINCODE') {
            await SettingsKeystore.setLockScreenStatus('0')
            await deleteUserPinCode('reactNativePinCode')
            await settingsActions.getSettings(true)
            lockScreenAction.setFlowType({
                flowType: ''
            })
            NavStore.reset('SettingsScreenStack')
        } else if (flowType === 'CHANGE_TOUCHID_STATUS') {
            const touchIDStatus = await SettingsKeystore.getTouchIDStatus()
            await SettingsKeystore.setTouchIDStatus(touchIDStatus === '0' ? '1' : '0')
            await settingsActions.getSettings(true)
            lockScreenAction.setFlowType({
                flowType: ''
            })
            NavStore.reset('SettingsScreenStack')
        } else if (flowType === 'CHANGE_ASKING_STATUS') {
            const askPinCodeWhenSending = await SettingsKeystore.getAskPinCodeWhenSending()
            await SettingsKeystore.setAskPinCodeWhenSending(askPinCodeWhenSending === '0' ? '1' : '0')
            await settingsActions.getSettings(true)
            lockScreenAction.setFlowType({
                flowType: ''
            })
            NavStore.reset('SettingsScreenStack')
        } else if (flowType === 'CHANGE_PASSWORD_FIRST_STEP') {
            this.setState({
                passwordState: 'choose'
            })
            lockScreenAction.setFlowType({
                flowType: ''
            })
        } else if (flowType ===  'CONFIRM_BACKUP_WALLET') {
            NavStore.goBack()
            setLoaderStatus(true)
            setTimeout(() => {
                actionCallback(false)
                lockScreenAction.setFlowType({ flowType: '' })
                lockScreenAction.setActionCallback({ actionCallback: () => {} })
            }, 50)
        } else if (flowType === 'CONFIRM_SEND_CRYPTO') {
            NavStore.goBack()
            setLoaderStatus(true)
            setTimeout(() => {
                actionCallback(false)
                lockScreenAction.setFlowType({ flowType: '' })
                lockScreenAction.setActionCallback({ actionCallback: () => {} })
            }, 500)
        } else if (flowType === 'CONFIRM_WALLET_PHRASE') {
            NavStore.goBack()
            setLoaderStatus(true)
            setTimeout(() => {
                actionCallback(false)
                lockScreenAction.setFlowType({ flowType: '' })
                lockScreenAction.setActionCallback({ actionCallback: () => {} })
            }, 500)
        } else {
            this.setState({
                show: false
            })
            NavStore.goBack()
        }
    }

    // eslint-disable-next-line camelcase
    async UNSAFE_componentWillMount() {

        this._onFocusListener = this.props.navigation.addListener('didFocus', async (payload) => {
            const res = await hasUserSetPinCode()

            this.setState({
                passwordState: res ? 'enter' : 'choose'
            })

            setTimeout(() => {
                this.setState({
                    show: true
                })
            }, 100)
        })

    }

    renderSubtitle = () => {
        return (
            <View></View>
        )
    }

    updateLastStatus = (status) => {
        this.setState({
            lastStatus: status
        })
    }

    renderButtonComponentLockedPage = () => {
        return (
            <View></View>
        )
    }

    renderIconComponentLockedPage = () => {
        return (
            <View style={styles.icon}>
                <MaterialIcons size={25} name={'lock'} color={'#5c5c5c'}/>
            </View>
        )
    }

    handleBack = () => { NavStore.goBack() }

    handleClose = () => { NavStore.reset('DashboardStack') }

    setHeaderHeight = (height) => {
        const headerHeight = Math.round(height || 0);
        this.setState(() => ({ headerHeight }))
    }

    renderHeader = () => {
        const { flowType } = this.props.lockScreen

        if(flowType !== '' && flowType !== 'JUST_CALLBACK') {
            MarketingEvent.UI_DATA.IS_LOCKED = false
            return <Header
                leftType="back"
                leftAction={this.handleBack}
                rightType="close"
                rightAction={this.handleClose}
                setHeaderHeight={this.setHeaderHeight}
            />
        } else {
            MarketingEvent.UI_DATA.IS_LOCKED = true
        }
    }

    backNavigationAction = () => {
        const { flowType } = this.props.lockScreen

        if(flowType === 'CONFIRM_SEND_CRYPTO') {
            return () => {
                MarketingEvent.UI_DATA.IS_LOCKED = false
                lockScreenAction.setFlowType({ flowType: '' })
                lockScreenAction.setActionCallback({ actionCallback: () => {} })
            }
        } else {
            return () => {
                MarketingEvent.UI_DATA.IS_LOCKED = false
            }
        }
    }

    render() {
        MarketingAnalytics.setCurrentScreen('LockScreen.index')
        const { flowType } = this.props.lockScreen
        let touchIDStatus = this.props.settings.keystore.touchIDStatus
        touchIDStatus = +touchIDStatus
        Log.log('LockScreen.render with touchIDStatus ' + JSON.stringify(touchIDStatus))

        const { colors, isLight } = this.context

        const { headerHeight } = this.state

        return (
            <View style={[styles.wrapper, { backgroundColor: colors.common.background }]}>
                {this.renderHeader()}
                {
                    this.state.passwordState !== null && this.state.show ?

                        <View style={{ flex: 1, marginTop: headerHeight * 0.75 }}>
                             <View style={[styles.top, flowType !== '' ? styles.top__navigation : null]}>
                                 {  isLight ? (
                                     <Image
                                         style={styles.top__logo}
                                         resizeMode='stretch'
                                         source={require('../../assets/images/logo.png')}/>
                                     ) : (
                                         <Image
                                             style={styles.top__logo}
                                             resizeMode='stretch'
                                             source={require('../../assets/images/logoWhite.png')}/>
                                     )
                                 }

                            </View>
                            <PINCode
                                changeInternalStatus = {this.updateLastStatus}
                                status={this.state.passwordState}
                                finishProcess={this.finishProcess}
                                passwordLength={6}
                                timeLocked={300000}
                                maxAttempts={3}
                                touchIDDisabled={!touchIDStatus}
                                colorCircleButtons={'rgb(255, 255, 255)'}
                                styleMainContainer={!this.state.show ? { height: 0, overflow: 'hidden',} : undefined}
                                stylePinCodeButtonCircle={{
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: 40,
                                    backgroundColor: colors.common.background,
                                }}
                                buttonDeleteText={' '}
                                stylePinCodeDeleteButtonText={{
                                    height: 0,
                                    display: 'none'
                                }}
                                stylePinCodeViewTitle={{ height: 10 }}
                                stylePinCodeTextTitle={{
                                    fontFamily: 'Montserrat-SemiBold',
                                    fontSize: 17,
                                    marginBottom: -10,
                                }}
                                stylePinCodeColorTitle={colors.common.text3}
                                stylePinCodeTextSubtitle={{ height: 0 }}
                                titleEnter={strings('lockScreen.enter')}
                                titleChoose={strings('lockScreen.create')}
                                subtitleChoose={' '}
                                titleConfirm={strings('lockScreen.confirm')}
                                titleAttemptFailed={strings('lockScreen.incorrect')}
                                textTitleLockedPage={strings('lockScreen.maximumAttempts')}
                                stylePinCodeButtonNumber={colors.common.text3}
                                textDescriptionLockedPage={' '}
                                textSubDescriptionLockedPage={' '}
                                styleLockScreenColorIcon={colors.common.text3}

                                colorPassword={'#864dd9'}
                                subtitleComponent={() => this.renderSubtitle()}
                                styleLockScreenSizeIcon={30}
                                stylePinCodeHiddenPasswordSizeEmpty={10}
                                stylePinCodeHiddenPasswordSizeFull={15}
                                stylePinCodeTextButtonCircle={{
                                    fontSize: 28,
                                    fontFamily: 'Montserrat-SemiBold',
                                }}
                                numbersButtonOverlayColor={'#864dd9'}
                                stylePinCodeDeleteButtonColorShowUnderlay={''}
                                stylePinCodeColumnDeleteButton={{
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    opacity: 1,
                                }}
                                styleLockScreenMainContainer={{
                                    marginTop: 0,
                                    backgroundColor: colors.common.background,
                                }}
                                stylePinCodeChooseContainer={{
                                }}
                                styleLockScreenTitle={{
                                    marginBottom: 25,
                                    fontFamily: 'Montserrat-SemiBold',
                                    fontSize: 17,
                                    textAlign: 'center',
                                    color: colors.common.text1
                                }}
                                stylePinCodeHiddenPasswordCircle={{
                                    width: 230,
                                    height: 30,
                                    marginTop: -20,
                                    paddingLeft: 20,
                                    paddingRight: 20,
                                    paddingBottom: 11,
                                    flexDirection: 'row',
                                    justifyContent: 'space-between',
                                    borderBottomWidth: 2,
                                    borderBottomColor: '#7229ae'
                                }}
                                stylePinCodeRowButtons={{
                                }}
                                stylePinCodeColumnButtons={{
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: colors.common.background,
                                    borderRadius: 40
                                }}
                                iconComponentLockedPage={this.renderIconComponentLockedPage}
                                buttonComponentLockedPage={this.renderButtonComponentLockedPage}
                                /*handleResultEnterPin={this.updateLastStatus}*/
                                styleLockScreenTextTimer={{
                                    fontFamily: 'Montserrat-SemiBold',
                                    color: colors.common.text3
                                }}
                                styleLockScreenViewTimer={{
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: 140,
                                    height: 50,
                                    marginBottom: 20,
                                    borderRadius: 10,
                                    borderWidth: 0,
                                    backgroundColor: colors.pincode.bgTimerColor,
                                }}
                                stylePinCodeEmptyColumn={
                                    this.state.passwordState !== 'enter' ? null :
                                        {
                                            borderRadius: 40,
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            backgroundColor: colors.common.background,
                                        }
                                }
                                bottomLeftComponent={
                                    (this.state.passwordState !== 'enter' || touchIDStatus === 0) ? null :
                                        (launchTouchID) => {
                                            return <TouchableOpacity onPress={launchTouchID} style={[styles.iconContainer]}>
                                                <MaterialIcons size={35} name={'fingerprint'} color={'#7229AE'}/>
                                            </TouchableOpacity>
                                        }
                                }
                            />
                        </View>
                        : null
                }
            </View>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        settings: state.settingsStore,
        lockScreen: state.lockScreenStore
    }
}

LockScreen.contextType = ThemeContext

export default connect(mapStateToProps, {})(LockScreen)

const styles_ = {
    array: ['#f5f5f5', '#f5f5f5'],
    start: { x: 0.0, y: 0 },
    end: { x: 0, y: 1 }
}

const styles = {
    wrapper: {
        flex: 1
    },
    top: {
        flexDirection: 'row',
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: 80,
        paddingTop: 120,
        marginBottom: 10,
        zIndex: 2,
    },
    top__navigation: {
        paddingTop: 120,
        marginBottom: 10
    },
    top__bg: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%'
    },
    top__logo: {
        position: 'relative',
        width: 95,
        height: 115,
        marginBottom: 1
    },
    titleLockedScreen: {
        position: 'relative',
        top: -35,
        fontSize: 16,
        fontFamily: 'Montserrat-SemiBold',
        color: '#404040',
        backgroundColor: '#fff'
    },
    quitBtn: {
        width: 100,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center'
    },
    quitBtn__text: {
        color: '#000',
        fontFamily: 'Montserrat-SemiBold',
        fontSize: 16
    },
    icon: {
        justifyContent: 'center',
        alignItems: 'center',
        width: 30,
        height: 30,
        borderRadius: 45
    },
    iconContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: '100%',
    }
}
