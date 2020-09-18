/**
 * @version 0.9
 */
import React, { Component } from 'react'
import { View, Text, Platform } from 'react-native'

import { TextInputMask } from 'react-native-masked-text'

import GradientView from './GradientView'

import { strings } from '../../services/i18n'


class PayeerInput extends Component {
    constructor(props) {
        super(props)
        this.state = {
            walletMask: 'P9999999999',
            walletNumber: 'P',
            isValid: true
        }
    }

    validate = () => {
        const isValid = this.state.walletNumber.length === 11

        this.setState({
            isValid
        })

        return isValid
    }

    getWalletNumber = () => this.state.walletNumber


    onChangeText = (value) => {

        this.setState({
            isValid : true,
            walletNumber: value
        })
    }

    render() {

        const { isValid, walletMask } = this.state
        const { onFocus } = this.props

        return (
            <View style={styles.wrapper}>
                <View style={styles.content}>
                    <TextInputMask
                        ref={ref => this.refTextInputMask = ref}
                        type={'custom'}
                        placeholder={strings('components.elements.advInput.accountNumber')}
                        options={{
                            mask: walletMask
                        }}
                        keyboardType={'number'}
                        value={this.state.walletNumber}
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
                    {!isValid ? strings('components.elements.advInput.invalidFormat') : ''}
                </Text>
            </View>
        )
    }

}

export default PayeerInput

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
