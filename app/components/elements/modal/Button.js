/**
 * @version 0.43
 */
import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import TouchableDebounce from '../new/TouchableDebounce'

export default class Button extends React.PureComponent {

    render() {
        return (
            <TouchableDebounce onPress={this.props.onPress} style={styles.btn}>
                <View style={this.props.shadow ? { ...styles.btn__wrapper__shadow, ...this.props.style, backgroundColor: this.props.color, shadowColor: this.props.color } : { ...styles.btn__wrapper, ...this.props.style, backgroundColor: this.props.color, shadowColor: this.props.color }}>
                    <Text style={{...styles.text, ...this.props.style}}>
                        {this.props.children}
                    </Text>
                </View>
            </TouchableDebounce>
        )
    }
}

const styles = StyleSheet.create({
    btn: {
        flexGrow: 1,
        padding: 10,
        alignSelf: 'center',
    },
    btn__wrapper: {
        width: 281,
        height: 50,
        alignSelf: 'center',
        borderRadius: 10,
        color: '#000',
    },
    btn__wrapper__shadow: {
        width: 281,
        height: 50,
        alignSelf: 'center',
        borderRadius: 10,
        color: '#000',
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,

        elevation: 5,
    },
    text: {
        marginTop: 5,
        textAlign: 'center',
        fontFamily: 'Montserrat-Semibold',
        fontStyle: 'normal',
        fontWeight: '600',
        fontSize: 16,
        lineHeight: 16,
        letterSpacing: 0.5,
        color: '#F7F7F7'
    }
})
