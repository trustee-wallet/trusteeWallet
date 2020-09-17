/**
 * @version 0.9
 */
import React, { Component } from 'react'
import { View, Text, ScrollView, Image, TouchableOpacity, TouchableWithoutFeedback, Vibration } from 'react-native'

import firebase from 'react-native-firebase'
import GradientView from '../../components/elements/GradientView'
import Navigation from '../../components/navigation/Navigation'
import Icon from '../../components/elements/CustomIcon.js'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'

import NavStore from '../../components/navigation/NavStore'

import { strings } from '../../services/i18n'
import Cashback from '../../services/Cashback/Cashback'
import Toast from '../../services/UI/Toast/Toast'
import copyToClipboard from '../../services/UI/CopyToClipboard/CopyToClipboard'

import config from '../../config/config'


class FIOScreen extends Component {



    render() {
        return (
            <View style={{ padding: 30, backgroundColor: '#f5f5f5' }}>
                <Text>FIO screen test text</Text>
            </View>
        );
    }
}

export default FIOScreen


const styles_ = {
    array: ['#fff', '#fff'],
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
        paddingRight: 15
    },
    block__content: {
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
        justifyContent: 'space-around'
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
    }

}
