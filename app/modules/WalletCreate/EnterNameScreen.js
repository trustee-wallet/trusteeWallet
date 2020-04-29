/**
 * @version 0.9
 */
import React, { Component } from 'react'
import { connect } from 'react-redux'

import { View, StyleSheet, ScrollView, Text, TouchableOpacity, Dimensions, Keyboard } from 'react-native'

import { KeyboardAwareView } from 'react-native-keyboard-aware-view'

import Button from '../../components/elements/Button'
import WalletNameInput from '../../components/elements/Input'
import GradientView from '../../components/elements/GradientView'

import NavStore from '../../components/navigation/NavStore'
import Navigation from '../../components/navigation/Navigation'

import { strings } from '../../../app/services/i18n'

import { setMnemonicLength, setWalletName } from '../../appstores/Stores/CreateWallet/CreateWalletActions'
import { setLoaderStatus } from '../../appstores/Stores/Main/MainStoreActions'

import Log from '../../services/Log/Log'

import firebase from 'react-native-firebase'


const data = {
    id: 'walletName',
    type: 'EMPTY'
}

const { height: WINDOW_HEIGHT } = Dimensions.get('window')


class EnterNameScreen extends Component {

    constructor(props) {
        super(props)
        this.state = {
            walletName: '',
            mnemonicLength: 128,
            focused: false
        }
        this.walletNameInput = React.createRef()
        this.scrollView = React.createRef()
        Log.log('WalletCreate.EnterNameScreen is created')
    }


    renderTitle = () => {

        const { flowType } = this.props.data

        switch (flowType) {
            case 'CREATE_NEW_WALLET':
                return strings('walletCreate.createTitle')
            case 'IMPORT_WALLET':
                return strings('walletCreate.importTitle')
            default:
                break
        }

    }

    onPress = async () => {
        Log.log('WalletCreate.EnterNameScreen onPress')
        const result = await this.walletNameInput.handleValidate()
        Log.log('WalletCreate.EnterNameScreen validation result', result)

        if (result.status === 'success') {
            setWalletName({ walletName: result.value })
            setMnemonicLength({ mnemonicLength: this.state.mnemonicLength })

            Keyboard.dismiss()

            const { flowType } = this.props.data

            switch (flowType) {
                case 'CREATE_NEW_WALLET':
                    setLoaderStatus(true)
                    setTimeout(() => {
                        Log.log('WalletCreate.EnterNameScreen goto BackupStep0Screen')

                        setLoaderStatus(false)
                    }, 2000)
                    break
                case 'IMPORT_WALLET':
                    Log.log('WalletCreate.EnterNameScreen goto EnterMnemonicPhrase')
                    NavStore.goNext('EnterMnemonicPhrase')
                    break
                default:
                    break
            }
        }
    }

    renderSelectMnemonicLength = () => {
        const { flowType } = this.props.data
        const { mnemonicLength } = this.state

        if (flowType === 'CREATE_NEW_WALLET') {
            return (
                <View style={styles.mnemonicLength}>
                    <Text style={styles.mnemonicLength__title}>{strings('walletCreate.description')}</Text>
                    <View style={styles.mnemonicLength__content}>
                        <TouchableOpacity
                            style={styles.mnemonicLength__item}
                            disabled={mnemonicLength === 128}
                            onPress={() => this.handleSelectMnemonicLength(128)}>
                            <View style={styles.radio}>
                                <View style={mnemonicLength === 128 ? styles.radio__dot : null}/>
                            </View>
                            <Text>{12 + ' ' + strings('walletCreate.words12')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.mnemonicLength__item}
                            disabled={mnemonicLength === 256}
                            onPress={() => this.handleSelectMnemonicLength(256)}>
                            <View style={styles.radio}>
                                <View style={mnemonicLength === 256 ? styles.radio__dot : null}/>
                            </View>
                            <Text>{24 + ' ' + strings('walletCreate.words24')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )
        }

    }

    handleSelectMnemonicLength = (mnemonicLength) => {
        this.setState({
            mnemonicLength
        })
    }

    onFocus = () => {
        this.setState({
            focused: true
        })
    }

    render() {
        firebase.analytics().setCurrentScreen('WalletCreate.EnterNameScreen')

        const { focused } = this.state

        return (
            <GradientView style={styles.wrapper} array={styles_.array} start={styles_.start} end={styles_.end}>
                <Navigation
                    title={this.renderTitle()}
                    isClose={false}
                />
                <KeyboardAwareView>
                    <ScrollView
                        keyboardShouldPersistTaps={'always'}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={focused ? styles.wrapper__content_active : styles.wrapper__content}
                        style={styles.wrapper__scrollView}
                        ref={ref => this.scrollView = ref}>

                        {/*<Image*/}
                        {/*    style={styles.img}*/}
                        {/*    resizeMode='stretch'*/}
                        {/*    source={require('../../assets/images/createName.png')}*/}
                        {/*/>*/}
                        <WalletNameInput
                            ref={component => this.walletNameInput = component}
                            id={data.id}
                            name={strings('walletCreate.name')}
                            type={data.type}
                            autoFocus={true}
                            onFocus={() => this.onFocus()}
                        />
                        {this.renderSelectMnemonicLength()}
                        <GradientView style={styles.line} array={lineStyles_.array} start={lineStyles_.start} end={lineStyles_.end}/>
                        <View style={{
                            flex: 1,
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}>
                            <View></View>
                            <Button styles={styles.btn} press={this.onPress}>
                                {strings('walletCreate.submit')}
                            </Button>
                        </View>

                    </ScrollView>
                </KeyboardAwareView>
            </GradientView>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        data: state.createWalletStore
    }
}

export default connect(mapStateToProps, {})(EnterNameScreen)

const styles_ = {
    array: ['#f9f9f9', '#f9f9f9'],
    start: { x: 0.0, y: 0 },
    end: { x: 0, y: 1 }
}

const lineStyles_ = {
    array: ['#7127ac', '#864dd9'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 0 }
}

const styles = StyleSheet.create({
    wrapper: {
        flex: 1
    },
    wrapper__scrollView: {
        marginTop: 80
    },
    wrapper__content: {
        flex: 1,
        minHeight: WINDOW_HEIGHT - 100,
        marginTop: 20,
        paddingLeft: 30,
        paddingRight: 30,
        paddingBottom: 30
    },
    wrapper__content_active: {
        flex: 1,
        minHeight: 200,
        marginTop: 20,
        paddingLeft: 30,
        paddingRight: 30,
        paddingBottom: 30
    },
    btn: {
        width: '100%',
        marginTop: 30,
        marginBottom: 30
    },
    btn__text: {
        fontSize: 19,
        fontFamily: 'SFUIDisplay-Semibold',
        textAlign: 'center',
        color: '#fff'
    },
    title: {
        marginBottom: 55,
        fontSize: 24,
        fontFamily: 'SFUIDisplay-Semibold',
        color: '#404040',
        textAlign: 'center'
    },
    img: {
        alignSelf: 'center',
        width: 270,
        height: 270,
        marginBottom: 50
    },
    text: {
        marginBottom: 7,
        fontSize: 16,
        fontFamily: 'SFUIDisplay-Regular',
        color: '#999999'
    },
    mnemonicLength__title: {
        marginTop: 10,

        color: '#404040',
        fontSize: 12,
        fontFamily: 'SFUIDisplay-Regular'
    },
    mnemonicLength__content: {
        flexDirection: 'row',
        justifyContent: 'flex-start'
    },
    mnemonicLength__item: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',

        paddingVertical: 10,
        marginRight: 20
    },
    radio: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 17,
        height: 17,
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#6B36A8',
        borderRadius: 16
    },
    radio__dot: {
        width: 10,
        height: 10,
        borderRadius: 10,
        backgroundColor: '#6B36A8'
    }
})
