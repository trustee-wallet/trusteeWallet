/**
 * @version 0.2
 */
import React, { Component } from 'react'
import { View, Image, Animated, Text, Platform } from 'react-native'
import { connect } from 'react-redux'

import firebase from "react-native-firebase"
import LottieView from "lottie-react-native"

import Button from '../../components/elements/Button'
import ButtonLine from '../../components/elements/ButtonLine'

import NavStore from '../../components/navigation/NavStore'

import { setCallback, setFlowType } from "../../appstores/Actions/CreateWalletActions"

import Log from "../../services/Log/Log"
import { strings } from "../../services/i18n"
import OtherActions from '../../appstores/Actions/OtherActions'

class WalletCreateScreen extends Component {

    constructor(props){
        super(props)
        this.state = {
            logoAnim: new Animated.Value(0),
            logoShow: new Animated.Value(0),
        }
    }

    componentWillMount() {
        OtherActions.licenceTermsCheck()
    }

    componentDidMount() {
        Log.log('WalletCreateScreen is mounted')
    }

    componentWillReceiveProps(nextProps, nextContext) {
        if(typeof nextProps.settingsStore.data.licence_terms_accepted != 'undefined' && +nextProps.settingsStore.data.licence_terms_accepted){
            this.startAnim()
        }
    }

    startAnim = () => {
        Animated.timing(this.state.logoAnim, {
            toValue: 1,
            duration: 4000
        }).start()

        setTimeout(() => {
            Animated.timing(this.state.logoShow, {
                toValue: 1,
                duration: 200
            }).start()
        }, 3500)
    }

    handleSelect = (data) => {
        setFlowType(data)
        setCallback({
            callback: async () => {
                NavStore.goNext('InitScreen')
            }
        })
        NavStore.goNext('EnterNameScreen')
    }

    handleCreate = () => {
        this.handleSelect({
            flowType: 'CREATE_NEW_WALLET'
        })
    }

    handleImport = () => {
        this.handleSelect({
            flowType: 'IMPORT_WALLET'
        })
    }

    render() {

        const { logoShow } = this.state

        firebase.analytics().setCurrentScreen('WalletCreate.WalletCreateScreen')

        return (
            <View style={styles.wrapper}>
                <View style={styles.content}>
                    <View style={styles.content__center}>
                        <View style={styles.content__img}>
                            <LottieView style={{
                                width: 230,
                                height: 230,
                            }} source={require("../../assets/jsons/animations/loader.json")} progress={this.state.logoAnim}/>
                        <Animated.View style={{...styles.logo, opacity: logoShow }}>
                            <Image
                                style={styles.logo__img}
                                source={require('../../assets/images/logoWhite.png')}
                            />
                        </Animated.View>
                        </View>
                        <View>
                            <View>
                                <Text style={styles.content__title}>
                                    { strings("walletCreateScreen.title") }
                                </Text>
                            </View>
                            {/*<View>*/}
                            {/*    <Text style={styles.content__title}>*/}
                            {/*        { strings("walletCreateScreen.title2") } { strings("walletCreateScreen.title3") }*/}
                            {/*    </Text>*/}
                            {/*</View>*/}
                            {/*<View>*/}
                            {/*    <Text style={styles.content__title}>*/}
                            {/*    </Text>*/}
                            {/*</View>*/}
                        </View>
                        {/*<Text style={styles.content__description}>*/}
                        {/*    { strings("walletCreateScreen.description") }*/}
                        {/*</Text>*/}
                    </View>
                    <View style={styles.item}>
                        <Button styleText={{ color: '#7127AC' }} backgroundColorArray={['#fff', '#fff']} press={this.handleCreate} styles={styles.button}>
                            { strings("walletCreateScreen.createWallet") }
                        </Button>
                    </View>
                    <View style={styles.item}>
                        <ButtonLine press={this.handleImport} styles={styles.button__line} styleText={{ color: '#fff' }} innerStyle={{ borderColor: '#fff' }}>
                            { strings("walletCreateScreen.importWallet") }
                        </ButtonLine>
                    </View>
                </View>
            </View>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        settingsStore: state.settingsStore
    }
}

export default connect(mapStateToProps, {})(WalletCreateScreen)

const styles = {
    wrapper: {
        flex: 1,
        backgroundColor: '#7127AC'
    },
    content: {
        flex: 1,
        // alignItems: 'center',
        justifyContent: 'center',

        paddingHorizontal: 15
    },
    content__title: {
        marginTop: Platform.OS === 'android' ? -10 : 0,

        textAlign: 'center',
        fontSize: 24,
        fontFamily: 'SFUIDisplay-Semibold',
        color: '#fff'
    },
    content__description: {
        textAlign: 'center',
        fontSize: 16,
        fontFamily: 'SFUIDisplay-Semibold',
        color: '#dcbafb'
    },
    content__center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    content__img: {
        position: 'relative',
        marginBottom: 20
    },
    logo: {
        position: 'absolute',
        left: 45,
        top: 30,
        width: 140,
        height: 170,
    },
    logo__img: {
        width: '100%',
        height: '100%',
    },
    item: {
        alignItems: 'center',
        width: '100%',
        marginBottom: 20
    },
    createImg: {
        width: 210,
        height: 210,
        marginBottom: 20
    },
    importImg: {
        width: 125,
        height: 180,
        marginTop: 20,
        marginBottom: 20
    },
    image: {
        width: 148,
        height: 180,
    },
    button: {
        width: '100%',
    },
    button__line: {
        width: '100%',

        backgroundColor: '#7127AC'
    },
}
