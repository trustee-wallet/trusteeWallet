import React, { Component } from 'react'
import { View, Text, Platform } from 'react-native'

import PI from 'react-native-phone-input'
import { TextInputMask } from 'react-native-masked-text'

import GradientView from './GradientView'

import { strings } from '../../services/i18n'


class PhoneInput extends Component {
    constructor(props) {
        super(props)
        this.state = {
            phoneMask: '+99999999999',
            phoneNumber: '',
            isValid: true
        }
    }

    validate = () => {
        this.setState({
            isValid: this.refPhone.isValidNumber()
        })

        return this.refPhone.isValidNumber()
    }

    getPhoneNumber = () => this.refTextInputMask.getRawValue().replace(/\s+/g, '')

    onChangeText = (value) => {

        this.setState({
            isValid: true,
            phoneNumber: value
        }, () => {

            const countryCode = this.refPhone.getISOCode()

            let phoneMask = '+99999999999'

            if(countryCode === 'ua'){
                phoneMask = '+99 999 999 99 99'
            }

            if(countryCode === 'ru'){
                phoneMask = '+9 999 999 99 99'
            }

            this.setState({
                phoneMask
            })
        })
    }

    render() {

        const { isValid, phoneNumber, phoneMask } = this.state
        const { onFocus } = this.props

        return (
            <View style={styles.wrapper}>
                <View style={styles.content}>
                    <TextInputMask
                        ref={ref => this.refTextInputMask = ref}
                        type={'custom'}
                        placeholder={strings('components.elements.phoneInput.phoneNumber')}
                        options={{
                            mask: phoneMask
                        }}
                        keyboardType={'phone-pad'}
                        value={this.state.phoneNumber}
                        placeholderTextColor={!isValid ? '#e77ca3' : "#404040"}
                        onChangeText={(value) => this.onChangeText(value)}
                        onFocus={onFocus}
                        style={[styles.input, !isValid ? { color: '#e77ca3' } : "#404040"]}
                    />
                    <View style={styles.flag}>
                        <PI ref={ref => this.refPhone = ref}
                            value={phoneNumber}
                            disabled
                            initialCountry={''}
                            autoFormat={true} />
                    </View>
                </View>
                <View style={styles.line}>
                    <GradientView style={styles.line__item} array={isValid ? lineStyles.array : lineStyles.arrayError } start={lineStyles.start} end={lineStyles.end}/>
                </View>
                <Text style={[styles.error, !isValid ? { color: '#e77ca3' } : null]}>
                    { !isValid ? strings('components.elements.phoneInput.invalidFormat') : '' }
                </Text>
            </View>
        )
    }

}

export default PhoneInput

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
        color: "#404040",
        fontSize: 18,
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
    flag: {
        width: 40,
        overflow: 'hidden'
    },
    error: {
        marginTop: Platform.OS === 'android' ? -4 : 5,
        fontSize: 14,
        fontFamily: 'SFUIDisplay-Regular',
        color: '#404040'
    }
}