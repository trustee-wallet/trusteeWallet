/**
 * @version 0.9
 */
import React, { Component } from 'react'
import { Text, View } from 'react-native'
import GradientView from '../../components/elements/GradientView'
import TouchableDebounce from './new/TouchableDebounce'


export default class Button extends Component {

    render() {

        const { btnWrapStyle, styleText, backgroundColorArray, touchableOpacityStyle, disabled } = this.props

        return (
            <View style={{ ...styles.wrapper, ...this.props.styles }}>
                <TouchableDebounce disabled={typeof disabled !== 'undefined' ? disabled : false} onPress={this.props.press || this.props.onPress} style={[touchableOpacityStyle]}>
                    <View style={[styles.btnWrap, btnWrapStyle]}>
                        <GradientView style={{ ...styles.btn, ...this.props.innerStyle }} array={typeof backgroundColorArray === 'undefined' ? styles_.array : backgroundColorArray} start={styles_.start} end={styles_.end}>
                            <Text style={{ ...styles.btn__text, ...styleText }}>
                                {this.props.children}
                            </Text>
                        </GradientView>
                    </View>
                </TouchableDebounce>
            </View>
        )
    }
}

const styles_ = {
    array: ['#43156d', '#7127ab'],
    start: { x: 0.0, y: 0.5 },
    end: { x: 1, y: 0.5 }
}

const styles = {
    wrapper: {
        backgroundColor: '#fff',
        borderRadius: 10
    },
    btnWrap: {
        width: '100%',
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.23,
        shadowRadius: 2.62,

        elevation: 4,
        borderRadius: 10
    },
    btn: {
        justifyContent: 'center',
        height: 42,
        borderRadius: 10
    },
    btn__text: {
        fontSize: 19,
        fontFamily: 'SFUIDisplay-Regular',
        textAlign: 'center',
        color: '#fff'
    }
}
