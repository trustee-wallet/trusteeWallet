/**
 * @version 0.2
 */
import React, { Component } from 'react'
import { connect } from 'react-redux'
import { View, Dimensions, Text, ScrollView, Image, TouchableOpacity, Animated } from 'react-native'
import LottieView from 'lottie-react-native'
import MaterialIcons from 'react-native-vector-icons/MaterialCommunityIcons'

import PINCode, { hasUserSetPinCode, deleteUserPinCode } from '@haskkor/react-native-pincode'

import GradientView from '../../components/elements/GradientView'

import NavStore from '../../components/navigation/NavStore'

import { strings } from '../../services/i18n'

import lockScreenAction from '../../appstores/Actions/LockScreenActions'
import settingsActions from '../../appstores/Actions/SettingsActions'

import Navigation from '../../components/navigation/Navigation'

import navigationActions from '../../appstores/Actions/NavigationActions'
import firebase from "react-native-firebase"

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
                    duration: 5000
                }),
                Animated.timing(this.state.progress, {
                    toValue: 0,
                    duration: 5000
                })
            ]),
            {
                iterations: 100
            }
        ).start()
    }

    finishProcess = () => {

        const { flowType } = this.props.lockScreen
        const { lock_screen_status } = this.props.settings.data

        if (flowType === 'CREATE_PINCODE') {

            console.log('LockScreen.props')
            console.log(this.props)

            settingsActions.setSettings('lock_screen_status', '1');

            lockScreenAction.setFlowType({
                flowType: ''
            })

            NavStore.reset('SettingsScreenStack')

        } else if (flowType === 'DELETE_PINCODE') {

            settingsActions.setSettings('lock_screen_status', '0');

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

        } else {
            this.setState({
                show: false
            })
            NavStore.reset('DashboardStack')
        }
    }

    async componentWillMount() {

        this._onFocusListener = this.props.navigation.addListener('didFocus', async (payload) => {
            let res = await hasUserSetPinCode()

            this.setState({
                passwordState: res ? 'enter' : 'choose'
            })

            setTimeout(() => {
                this.setState({
                    show: true
                })
            }, 500)
        })

    }

    renderSubtitle = () => {
        return (
            /*<View style={{
                position: 'relative',
                width: 200
            }}>
                <View style={{
                    width: 200,
                    height: 30,
                    marginBottom: -50,
                    paddingLeft: 40,
                    paddingRight: 40,
                    paddingBottom: 11,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    borderBottomWidth: 2,
                    borderBottomColor: '#7229ae'
                }}>
                    <View style={{
                        width: 26,
                        height: 26,
                        borderWidth: 2,
                        borderColor: '#752eb0',
                        borderRadius: 25
                    }} />
                    <View></View>
                    <View></View>
                    <View></View>
                </View>
            </View>*/
            <View></View>
        )
    }

    titleComponentLockPage = () => {
        return (
            <View>
                <Text style={styles.titleLockedScreen}>{strings('lockScreen.maximumAttempts')}</Text>
            </View>
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

    render() {
        firebase.analytics().setCurrentScreen('LockScreen.index')
        const { flowType } = this.props.lockScreen
        let { touchID_status } = this.props.settings.data
        touchID_status = +touchID_status
        return (
            <GradientView style={styles.wrapper} array={styles_.array} start={styles_.start} end={styles_.end}>
                { flowType !== '' ?  <Navigation /> : null }
                {
                    this.state.passwordState !== null && this.state.show ?

                        <View style={{ flex: 1 }}>
                            <View style={[styles.top, flowType !== '' ? styles.top__navigation : null]}>
                                <Image
                                    style={styles.top__bg}
                                    resizeMode='stretch'
                                    source={require('../../assets/images/lockScreenBg.png')}/>
                                <LottieView style={{
                                    width: 100,
                                    height: 100,
                                    marginRight: 10
                                }} source={require('../../assets/jsons/animations/dotsLeft.json')} progress={this.state.progress}/>
                                <Image
                                    style={styles.top__logo}
                                    resizeMode='stretch'
                                    source={require('../../assets/images/logo.png')}/>
                                <LottieView style={{
                                    width: 100,
                                    height: 100,
                                    marginLeft: 10
                                }} source={require('../../assets/jsons/animations/dotsRight.json')} progress={this.state.progress}/>
                            </View>
                            <PINCode
                                //pinStatus={'locked'}
                                status={this.state.passwordState}
                                finishProcess={this.finishProcess}
                                passwordLength={6}
                                timeLocked={300000}
                                maxAttempts={3}
                                touchIDDisabled={!touchID_status}
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
                                //titleComponentLockedPage={this.titleComponentLockPage}
                                //handleResultEnterPin={(data, data1) => this.handlePinStatus(data, data1)}
                                //pinStatus={(data) => console.log(data)}
                                //textTitleLockedPage={'Maximum attempts reached'}

                                colorPassword={'#864dd9'}
                                subtitleComponent={() => this.renderSubtitle()}
                                styleLockScreenSizeIcon={30}
                                stylePinCodeHiddenPasswordSizeEmpty={10}
                                stylePinCodeHiddenPasswordSizeFull={15}
                                stylePinCodeTextButtonCircle={{
                                    fontSize: 34,
                                    fontFamily: 'SFUIDisplay-Regular'
                                }}
                                stylePinCodeChooseContainer={{
                                    //borderWidth: 2,
                                    //borderColor: '#000'
                                }}
                                numbersButtonOverlayColor={'#9969df'}
                                stylePinCodeDeleteButtonColorShowUnderlay={'#9969df'}
                                stylePinCodeColumnDeleteButton={{
                                    marginTop: -3,
                                    marginLeft: -5
                                    //borderWidth: 2,
                                    //borderColor: '#000'
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
                                    //borderWidth: 2,
                                    //borderColor: '#000'
                                }}
                                stylePinCodeColumnButtons={{
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                    //borderWidth: 2,
                                    //borderColor: '#000'
                                }}
                                stylePinCodeEmptyColumn={{
                                    //borderWidth: 2,
                                    //borderColor: '#000'
                                }}
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
                                //textButtonLockedPage={'Quit'}
                                //styleLockScreenButton
                                //styleLockScreenViewIcon={{
                                //    backgroundColor: '#000'
                                //}}
                                //titleComponent={() => this.renderPasswordComponent()}
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
    array: ['#fff', '#fff'],
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

        marginBottom: 15
    },
    top__navigation: {
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
        //backgroundColor: '#CD6A8D',
        borderWidth: 1,
        borderColor: '#7229AE',
        borderRadius: 45
    }
}
