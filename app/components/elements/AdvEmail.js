/**
 * @version 0.9
 */
import React, { Component } from 'react'
import { View, Text, Platform, TextInput } from 'react-native'

import GradientView from './GradientView'

import { strings } from '../../services/i18n'

import AsyncStorage from '@react-native-community/async-storage'

let CACHE_VALUE = false

class AdvEmail extends Component {
    constructor(props) {
        super(props)
        this.state = {
            email: '',
            isValid: true,
            isSet : false
        }
    }

    validate = () => {
        const pattern = /^[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.(?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/

        CACHE_VALUE = this.state.email

        const isValid = this.state.email && pattern.test(this.state.email)
        if (isValid) {
            AsyncStorage.setItem('trade.advEmail', this.state.email)
        }

        this.setState({
            isValid
        })

        return isValid
    }

    getEmail = () => this.state.email


    onChangeText = (value) => {

        this.setState({
            isValid : true,
            email: value
        })
    }

    render() {

        const { isValid } = this.state
        const { onFocus, value } = this.props

        if (!CACHE_VALUE) {
            if (value) {
                CACHE_VALUE = value
            }
        }
        if (CACHE_VALUE && !this.state.isSet) {
            this.state.email = CACHE_VALUE
            this.state.isSet = true
        }

        return (
            <View style={styles.wrapper}>
                <View style={styles.content}>
                    <TextInput
                        ref={ref => this.refTextInputMask = ref}
                        type={'custom'}
                        placeholder={strings('components.elements.advEmail.accountEmail')}
                        keyboardType={'email-address'}
                        value={this.state.email}
                        onChangeText={(value) => this.onChangeText(value)}
                        placeholderTextColor={!isValid ? '#e77ca3' : '#404040'}
                        onFocus={onFocus}
                        style={[styles.input, !isValid ? { color: '#e77ca3' } : '#404040']}
                    />
                </View>
                <View style={styles.line}>
                    <GradientView style={styles.line__item} array={isValid ? lineStyles.array : lineStyles.arrayError} start={lineStyles.start} end={lineStyles.end}/>
                </View>
                <Text style={[styles.error, !isValid ? { color: '#e77ca3' } : null]}>
                    {!isValid ? strings('components.elements.advEmail.invalidFormat') : ''}
                </Text>
            </View>
        )
    }

}

export default AdvEmail

const lineStyles = {
    array: ['#7127ac', '#864dd9'],
    arrayError: ['#e77ca3', '#f0a5af'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 0 }
}

const styles = {
    wrapper: {
        marginRight: 2,
        marginLeft: 30,
        paddingRight: 30
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    input: {
        flex: 1,

        marginLeft: Platform.OS === 'android' ? -2 : 0,

        fontFamily: 'SFUIDisplay-Regular',
        color: '#404040',
        fontSize: 18
    },
    line: {
        paddingRight: 75
    },
    line__item: {
        width: '100%',
        height: 2,

        marginTop: Platform.OS === 'android' ? -8 : 5,

        borderRadius: 2
    },
    error: {
        marginTop: Platform.OS === 'android' ? -4 : 5,
        fontSize: 14,
        fontFamily: 'SFUIDisplay-Regular',
        color: '#404040'
    }
}
