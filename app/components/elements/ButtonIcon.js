/**
 * @version 0.9
 */
import React, { Component } from 'react'

import { Image, Text, TouchableOpacity, View } from 'react-native'

import QRCodeBtn from '@assets/images/qrCodeBtn'

import FontAwesome from 'react-native-vector-icons/FontAwesome'

import FontAwesome5 from 'react-native-vector-icons/FontAwesome5'

import Entypo from 'react-native-vector-icons/Entypo'


export default class ButtonIcon extends Component {

    constructor(props) {
        super(props)
    }

    handleIcon = () => {
        const { icon } = this.props

        switch (icon) {

            case 'QR_CODE_BTN':

                return (<QRCodeBtn width={20} height={19}/>)
            case 'FACEBOOK':

                return (<FontAwesome name="facebook" size={19} color='#fff'/>)
            case 'TWITTER':

                return (<FontAwesome name="twitter" size={19} color='#fff'/>)
            case 'WHATSAPP':

                return (<FontAwesome name="whatsapp" size={18} color='#fff'/>)
            case 'EMAIL':

                return (<FontAwesome name="envelope-o" size={18} color='#fff'/>)
            case 'DOTS':

                return (<Entypo name="dots-three-horizontal" size={19} color='#fff'/>)
            case 'VIBER':

                return (<FontAwesome5 name="viber" size={19} color='#fff'/>)
            case 'TELEGRAM':

                return (<FontAwesome5 name="telegram-plane" size={19} color='#fff'/>)
            case 'INSTAGRAM':

                return (<FontAwesome5 name="instagram" size={19} color='#fff'/>)
            default:
                return <View></View>
        }
    }

    render() {

        const { style, callback, disabled } = this.props

        return (
            <View style={{ ...styles.wrapper, ...style }}>
                <TouchableOpacity disabled={typeof disabled != 'undefined' ? disabled : false} onPress={callback} style={{ ...styles.btn, ...style }}>
                    {this.handleIcon()}
                </TouchableOpacity>
            </View>
        )
    }
}

const styles = {
    wrapper: {
        width: 46,
        height: 46,
        marginBottom: 10,
        borderRadius: 23,
        backgroundColor: '#fff',

        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.23,
        shadowRadius: 2.62,

        elevation: 4
    },
    icon: {
        width: 20,
        height: 20
    },
    btn: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 46,
        height: 46,
        borderRadius: 23,

        //overflow: 'hidden',

        backgroundColor: '#fff'
    },
    icons: {
        color: '#f4f4f4',
        position: {
            start: { x: 0.0, y: 0.5 },
            end: { x: 1, y: 0.5 }
        }
    },
    icon__mark: {
        position: 'absolute',
        bottom: 7,
        right: -15,

        paddingTop: 1,
        paddingLeft: 3,
        paddingRight: 3,
        paddingBottom: 1,

        borderRadius: 4
    },
    icon__wrap: {
        position: 'relative',

        alignItems: 'center',
        justifyContent: 'center',

        width: '100%',
        height: '100%',
        overflow: 'hidden',

        borderRadius: 23
    },
    icon__mark__text: {
        paddingRight: 20,
        fontSize: 7,
        fontFamily: 'SFUIDisplay-Semibold',
        color: '#fff'
    }
}
