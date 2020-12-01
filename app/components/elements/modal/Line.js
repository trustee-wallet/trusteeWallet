/**
 * @version 0.9
 */
import React, { Component } from 'react'
import { View, StyleSheet } from 'react-native'

export default class Line extends Component {
    render() {
        return (
            <View style={styles.line}></View>
        )
    }
}

const styles = StyleSheet.create({
    line: {
        height: '100%',
        borderLeftColor: '#8e96b5',
        borderLeftWidth: 1
    }
})
