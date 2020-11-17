/**
 * @version 0.9
 */
import React, { Component } from 'react'
import { connect } from 'react-redux'
import { View , Image, Animated } from 'react-native'
import MaterialIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import Orientation from 'react-native-orientation'

import PINCode, { hasUserSetPinCode, deleteUserPinCode } from '@haskkor/react-native-pincode'
import firebase from 'react-native-firebase'

import GradientView from '../../components/elements/GradientView'
import NavStore from '../../components/navigation/NavStore'
import Navigation from '../../components/navigation/Navigation'

import { strings } from '../../services/i18n'

import lockScreenAction from '../../appstores/Stores/LockScreen/LockScreenActions'
import settingsActions from '../../appstores/Stores/Settings/SettingsActions'
import { setLoaderStatus } from '../../appstores/Stores/Main/MainStoreActions'


class LockScreen extends Component {

    constructor(props) {
        super(props)
        this.state = {
            passwordState: null,
            progress: new Animated.Value(0),
            show: false
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

    finishProcess = () => {

        const { flowType, actionCallback } = this.props.lockScreen

        if (flowType === 'CREATE_PINCODE') {
            settingsActions.setSettings('askPinCodeWhenSending', '1')
            settingsActions.setSettings('lock_screen_status', '1')
            lockScreenAction.setFlowType({
                flowType: ''
            })
            NavStore.reset('SettingsScreenStack')
        } else if (flowType === 'DELETE_PINCODE') {
            settingsActions.setSettings('lock_screen_status', '0')
            deleteUserPinCode('reactNativePinCode')
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
        } else {
            this.setState({
                show: false
            })
            NavStore.reset('DashboardStack')
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

    renderButtonComponentLockedPage = () => {
        return (
            <View></View>
        )
    }

    renderIconComponentLockedPage = () => {
        return (
            <View style={styles.icon}>
                <MaterialIcons size={25} name={'lock'} color={'#7229AE'}/>
            </View>
        )
    }

    renderNavigation = () => {
        const { flowType } = this.props.lockScreen

        if(flowType !== '') {
            return <Navigation backAction={this.backNavigationAction} />
        }
    }

    backNavigationAction = () => {
        const { flowType } = this.props.lockScreen

        if(flowType === 'CONFIRM_SEND_CRYPTO') {
            return () => {
                lockScreenAction.setFlowType({ flowType: '' })
                lockScreenAction.setActionCallback({ actionCallback: () => {} })
            }
        } else {
            return () => {}
        }
    }

    render() {
        firebase.analytics().setCurrentScreen('LockScreen.index')
        const { flowType } = this.props.lockScreen
        let { touchID_status: touchIDStatus } = this.props.settings.data
        touchIDStatus = +touchIDStatus
        return (
            <GradientView style={styles.wrapper} array={styles_.array} start={styles_.start} end={styles_.end}>
                {this.renderNavigation()}
                {
                    this.state.passwordState !== null && this.state.show ?

                        <View style={{ flex: 1 }}>
                             <View style={[styles.top, flowType !== '' ? styles.top__navigation : null]}>
                                <Image
                                    style={styles.top__logo}
                                    resizeMode='stretch'
                                    source={require('../../assets/images/logo.png')}/>
                            </View>
                            <PINCode
                                status={this.state.passwordState}
                                finishProcess={this.finishProcess}
                                passwordLength={6}
                                timeLocked={300000}
                                maxAttempts={3}
                                touchIDDisabled={!touchIDStatus}
                                colorCircleButtons={'rgb(255, 255, 255)'}
                                styleMainContainer={!this.state.show ? { height: 0, overflow: 'hidden' } : undefined}
                                stylePinCodeButtonCircle={{
                                    width: 54, height: 54, alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: 27
                                }}
                                buttonDeleteText={' '}
                                stylePinCodeDeleteButtonText={{
                                    height: 0
                                }}
                                stylePinCodeViewTitle={{ height: 10 }}
                                stylePinCodeTextTitle={{
                                    height: 20,
                                    fontFamily: 'SFUIDisplay-Regular',
                                    fontSize: 16
                                }}
                                stylePinCodeColorTitle={'#404040'}
                                stylePinCodeTextSubtitle={{ height: 0 }}
                                titleEnter={strings('lockScreen.enter')}
                                titleChoose={strings('lockScreen.create')}
                                subtitleChoose={' '}
                                titleConfirm={strings('lockScreen.confirm')}
                                titleAttemptFailed={strings('lockScreen.incorrect')}
                                textTitleLockedPage={strings('lockScreen.maximumAttempts')}
                                stylePinCodeButtonNumber={'#404040'}
                                textDescriptionLockedPage={' '}
                                textSubDescriptionLockedPage={' '}
                                styleLockScreenColorIcon={'#000'}

                                colorPassword={'#864dd9'}
                                subtitleComponent={() => this.renderSubtitle()}
                                styleLockScreenSizeIcon={30}
                                stylePinCodeHiddenPasswordSizeEmpty={10}
                                stylePinCodeHiddenPasswordSizeFull={15}
                                stylePinCodeTextButtonCircle={{
                                    fontSize: 34,
                                    fontFamily: 'SFUIDisplay-Regular'
                                }}
                                stylePinCodeChooseContainer={{}}
                                numbersButtonOverlayColor={'#9969df'}
                                stylePinCodeDeleteButtonColorShowUnderlay={'#9969df'}
                                stylePinCodeColumnDeleteButton={{
                                    alignItems: 'center',
                                    justifyContent: 'center',

                                    marginTop: -3,
                                    marginLeft: -5,

                                    height: 54
                                }}
                                styleLockScreenTitle={{
                                    marginBottom: 35,
                                    fontFamily: 'SFUIDisplay-Regular',
                                    fontSize: 16,
                                    color: '#404040'
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
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginTop: -10,
                                    width: 250,
                                    height: 75
                                }}
                                stylePinCodeColumnButtons={{
                                    alignItems: 'center',
                                    justifyContent: 'center',

                                    width: 54,
                                    marginHorizontal: 15,

                                    backgroundColor: '#fff',

                                    shadowColor: '#000',
                                    shadowOffset: {
                                        width: 0,
                                        height: 3
                                    },
                                    shadowOpacity: 0.29,
                                    shadowRadius: 4.65,

                                    borderRadius: 40
                                }}
                                stylePinCodeEmptyColumn={{}}
                                iconComponentLockedPage={this.renderIconComponentLockedPage}
                                buttonComponentLockedPage={this.renderButtonComponentLockedPage}
                                styleLockScreenTextTimer={{
                                    fontFamily: 'SFUIDisplay-Regular',
                                    color: '#404040'
                                }}
                                styleLockScreenViewTimer={{
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: 80,
                                    height: 35,
                                    marginBottom: 50,
                                    borderRadius: 10,
                                    borderWidth: 1,
                                    borderColor: '#7229AE'
                                }}
                            />
                        </View>
                        : null
                }
            </GradientView>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        settings: state.settingsStore,
        lockScreen: state.lockScreenStore
    }
}

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
        height: 250,
        paddingTop: 110,
        marginBottom: 15,
    },
    top__navigation: {
        paddingTop: 50,
        marginTop: 50,
        marginBottom: -30
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
        marginBottom: 25
    },
    titleLockedScreen: {
        position: 'relative',
        top: -35,
        fontSize: 16,
        fontFamily: 'SFUIDisplay-Regular',
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
        fontFamily: 'SFUIDisplay-Regular',
        fontSize: 16
    },
    icon: {
        justifyContent: 'center',
        alignItems: 'center',
        width: 50,
        height: 50,
        borderWidth: 1,
        borderColor: '#7229AE',
        borderRadius: 45
    }
}
