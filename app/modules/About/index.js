import React, { Component } from 'react'
import {
    View,
    Text,
    ScrollView,
    Image,
    TouchableOpacity,
    TouchableWithoutFeedback,
    Vibration,
    Clipboard
} from 'react-native'

import GradientView from '../../components/elements/GradientView'
import Navigation from '../../components/navigation/Navigation'
import Icon from '../../components/elements/CustomIcon.js'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import NavStore from '../../components/navigation/NavStore'

import { strings } from '../../services/i18n'
import Toast from '../../services/Toast/Toast'
import Cashback from '../../services/Cashback/Cashback'

import config from '../../config/config'
import firebase from 'react-native-firebase'

import Snow from 'react-native-snow'
import { connect } from 'react-redux'

class AboutScreen extends Component {

    handleModal = (route) => {
        NavStore.goNext(route)
    }

    _onLongPressButton = () => {
        Toast.setMessage(strings('settings.config', { config: 'DEV' })).show()

        config.exchange.mode = 'DEV'
        config.cashback.mode = 'DEV'

        Cashback.reInit()

        Vibration.vibrate(100)
    }

    copyVersion = () => {
        Clipboard.setString(`${config.version.code} | #${config.version.hash}`)
        Toast.setMessage(strings('toast.copied')).show(-100)
    }

    render() {
        firebase.analytics().setCurrentScreen('About.index')

        return (
            <GradientView style={styles.wrapper} array={styles_.array} start={styles_.start} end={styles_.end}>
                <ScrollView showsVerticalScrollIndicator={false}>
                    <Navigation
                        title={ strings('settings.about.title') }
                    />
                    <View style={styles.wrapper__content}>
                        <View style={styles.header}>
                            <View style={styles.header__content}>
                                <TouchableWithoutFeedback
                                    style={{ backgroundColor: '#fff' }}
                                    delayLongPress={20000}
                                    onLongPress={this._onLongPressButton.bind()}>
                                    <Image
                                        style={ styles.header__logo }
                                        resizeMode='stretch'
                                        source={require('../../assets/images/logoAbout.png')}/>
                                </TouchableWithoutFeedback>
                                {/*<Text style={styles.header__title}>{  strings('settings.about.header', { OS: Platform.OS === 'android' ? 'Android' : 'IOS' } ) }</Text>*/}
                                <TouchableOpacity style={styles.header__description} onPress={this.copyVersion}>
                                    <Text style={styles.header__title}>{ strings('settings.about.version') } { config.version.code }</Text>
                                    <Text style={styles.header__hash}>#{ config.version.hash }</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                        <View style={styles.block}>
                            <View style={styles.block__content}>
                                <TouchableOpacity style={styles.block__item}
                                                  onPress={() => this.handleModal('PrivacyPolicyScreen')}>
                                    <Icon name="privacy" size={20} style={styles.block__icon} />
                                    <Text style={styles.block__text} numberOfLines={1}>{ strings('settings.about.privacy') }</Text>
                                </TouchableOpacity>
                                <View style={styles.divider} />
                                <TouchableOpacity style={styles.block__item}
                                                  onPress={() => this.handleModal('TermsOfUseScreen')}>
                                    <MaterialCommunityIcons name="file-document-edit" size={24} style={{...styles.block__icon, marginRight: 10}} />
                                    <Text style={styles.block__text} numberOfLines={1}>{ strings('settings.about.terms') }</Text>
                                </TouchableOpacity>
                                <View style={styles.divider} />
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </GradientView>
        )
    }
}

export default AboutScreen


const styles_ = {
    array: ["#fff","#fff"],
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
        paddingRight: 15,
    },
    block__content: {
        paddingLeft: 7,
        paddingRight: 7,
        marginBottom: 20,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.23,
        shadowRadius: 2.62,

        elevation: 4,
        backgroundColor: '#fff',
        borderRadius: 15,
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
        justifyContent: 'space-around',
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
    },

}
