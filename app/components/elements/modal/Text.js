/**
 * @version 0.43
 */
import React from 'react'
import { Text, StyleSheet, View } from 'react-native'

export default class Text_ extends React.PureComponent {
    render() {
        return (
            <View style={this.props.style}>
                <Text style={{...styles.text, ...this.props.style }}>{this.props.children}</Text>
            </View>
        )
    }
}

const styles = StyleSheet.create({
    text: {
        paddingLeft: 30,
        paddingRight: 30,
        alignSelf: 'center',
        fontSize: 14,
        textAlign: 'center',
        fontFamily: 'SFUIDisplay-Regular',
        color: '#252742'
    }
})
