/**
 * @version 0.9
 */
import React, { Component } from 'react'
import { StyleSheet, Text, View } from 'react-native'

export default class Title extends Component {
    render() {
        return (
            <View style={this.props.style}>
                <Text style={[styles.text, this.props.textStyles, this.props.style]}>{this.props.children}</Text>
            </View>
        )
    }
}

const styles = StyleSheet.create({
    text: {
        alignSelf: 'center',
        width: 250,
        fontSize: 18,
        textAlign: 'center',
        fontFamily: 'SFUIDisplay-Semibold',
        color: '#252742'
    }
})
