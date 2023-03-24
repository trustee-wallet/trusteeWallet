/**
 * @version 0.45
 */
import React from 'react'
import { connect } from 'react-redux'
import { View, Image, StyleSheet, BackHandler, Platform } from 'react-native'
import MaterialIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import Orientation from 'react-native-orientation'
import { RESULTS } from 'react-native-permissions'

import PINCode, { hasUserSetPinCode } from '@haskkor/react-native-pincode'

import NavStore from '@app/components/navigation/NavStore'
import Header from '@app/components/elements/new/Header'
import { ThemeContext } from '@app/theme/ThemeProvider'

import { strings } from '@app/services/i18n'

import MarketingAnalytics from '@app/services/Marketing/MarketingAnalytics'
import MarketingEvent from '@app/services/Marketing/MarketingEvent'

import { getLockScreenData } from '@app/appstores/Stores/LockScreen/selectors'
import { getIsTouchIDStatus } from '@app/appstores/Stores/Settings/selectors'
import { biometricActions, finishProcess } from '@app/modules/LockScreen/helpers'
import { LockScreenFlowTypes } from '@app/appstores/Stores/LockScreen/LockScreenActions'
import TouchableDebounce from '@app/components/elements/new/TouchableDebounce'


class LockScreen extends React.PureComponent {

    constructor(props) {
        super(props)
        this.state = {
            passwordState: null,
            headerHeight: 0,
            noShowTouchId: false
        }
    }

    async componentDidMount() {
        Orientation.lockToPortrait()
        const res = await hasUserSetPinCode()
        this.setState({
            passwordState: res ? 'enter' : 'choose'
        })
        this.checkAvailableBiometric()
        BackHandler.addEventListener("hardwareBackPress", this.backAction)
    }

    componentWillUnmount() {
        BackHandler.removeEventListener("hardwareBackPress", this.backAction)
    }

    backAction = () => {
        if(typeof this.props.lockScreen.noCallback === 'function'){
            this.props.lockScreen.noCallback()
        }
    }

    renderIconComponentLockedPage = () => {
        return (
            <View style={styles.icon}>
                <MaterialIcons size={25} name={'lock'} color={'#5c5c5c'} />
            </View>
        )
    }

    handleBack = () => {
        const { flowType } = this.props.lockScreen
        
        NavStore.goBack()

        if (flowType === LockScreenFlowTypes.MNEMONIC_CALLBACK) {
            NavStore.goBack()
        }
    }

    handleClose = () => {
        NavStore.reset('HomeScreen')
    }

    setHeaderHeight = (height) => {
        const headerHeight = Math.round(height || 0)
        this.setState(() => ({ headerHeight }))
    }

    checkAvailableBiometric = async () => {
        const isBiometryType = await biometricActions.checkBiometryType()
        if (isBiometryType) {
            if (Platform.OS === 'ios' && isBiometryType === 'FaceID') {
                const checkBiometricResult = await biometricActions.checkBiometricPermission()
                if (checkBiometricResult === RESULTS.BLOCKED) {
                    this.setState({ noShowTouchId: true })
                }
            }
        } else {
            this.setState({ noShowTouchId: false })
        }
    }

    renderHeader = () => {
        const { flowType } = this.props.lockScreen
        if (flowType && flowType !== '' && flowType !== LockScreenFlowTypes.PUSH_POPUP_CALLBACK && flowType !== LockScreenFlowTypes.INIT_POPUP) {
            MarketingEvent.UI_DATA.IS_LOCKED = false
            return <Header
                leftType='back'
                leftAction={this.handleBack}
                rightType='close'
                rightAction={this.handleClose}
                setHeaderHeight={this.setHeaderHeight}
            />
        } else {
            MarketingEvent.UI_DATA.IS_LOCKED = true
        }
    }

    render() {
        MarketingAnalytics.setCurrentScreen('LockScreen.index')

        const { flowType } = this.props.lockScreen

        const touchIDStatus = this.props.touchIDStatus * 1

        const { colors, isLight } = this.context

        const { headerHeight, noShowTouchId } = this.state

        const noTouchIDShow = (noShowTouchId|| this.state.passwordState !== 'enter' || touchIDStatus === 0 || flowType === LockScreenFlowTypes.CHANGE_TOUCHID_STATUS)

        return (
            <View style={[styles.wrapper, { backgroundColor: colors.common.background }]}>
                {this.renderHeader()}
                {
                    <View style={{ flex: 1, marginTop: headerHeight * 0.75 }}>
                        <View style={[styles.top, flowType !== '' ? styles.top__navigation : null]}>
                            {isLight ? (
                                <Image
                                    style={styles.top__logo}
                                    resizeMode='stretch'
                                    source={require('@assets/images/logo.png')} />
                            ) : (
                                <Image
                                    style={styles.top__logo}
                                    resizeMode='stretch'
                                    source={require('@assets/images/logoWhite.png')} />
                            )
                            }

                        </View>
                        <PINCode
                            status={this.state.passwordState}
                            finishProcess={() => {
                                finishProcess(this.props.lockScreen, this)
                            }}
                            passwordLength={6}
                            timeLocked={300000}
                            maxAttempts={3}
                            touchIDDisabled={noTouchIDShow}
                            colorCircleButtons={'rgb(255, 255, 255)'}
                            stylePinCodeButtonCircle={{
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: 40,
                                backgroundColor: colors.common.background
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
                                marginBottom: -10
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
                            subtitleComponent={() => <View></View>}
                            styleLockScreenSizeIcon={30}
                            stylePinCodeHiddenPasswordSizeEmpty={10}
                            stylePinCodeHiddenPasswordSizeFull={15}
                            stylePinCodeTextButtonCircle={{
                                fontSize: 28,
                                fontFamily: 'Montserrat-SemiBold'
                            }}
                            numbersButtonOverlayColor={'#864dd9'}
                            stylePinCodeDeleteButtonColorShowUnderlay={''}
                            stylePinCodeColumnDeleteButton={{
                                alignItems: 'center',
                                justifyContent: 'center',
                                opacity: 1
                            }}
                            styleLockScreenMainContainer={{
                                marginTop: 0,
                                backgroundColor: colors.common.background
                            }}
                            stylePinCodeChooseContainer={{}}
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
                            stylePinCodeRowButtons={{}}
                            stylePinCodeColumnButtons={{
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: colors.common.background,
                                borderRadius: 40
                            }}
                            iconComponentLockedPage={this.renderIconComponentLockedPage}
                            buttonComponentLockedPage={() => <View></View>}
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
                                backgroundColor: colors.pincode.bgTimerColor
                            }}
                            stylePinCodeEmptyColumn={
                                this.state.passwordState !== 'enter' ? null :
                                    {
                                        borderRadius: 40,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        backgroundColor: colors.common.background
                                    }
                            }
                            bottomLeftComponent={
                                noTouchIDShow ? null :
                                    (launchTouchID) => {
                                        return <TouchableDebounce onPress={launchTouchID} style={[styles.iconContainer]}>
                                            <MaterialIcons size={35} name={'fingerprint'} color={'#7229AE'} />
                                        </TouchableDebounce>
                                    }
                            }
                        />
                    </View>
                }
            </View>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        touchIDStatus: getIsTouchIDStatus(state),
        lockScreen: getLockScreenData(state)
    }
}

LockScreen.contextType = ThemeContext

export default connect(mapStateToProps, {})(LockScreen)

const styles = StyleSheet.create({
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
        zIndex: 2
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
        height: '100%'
    }
})
