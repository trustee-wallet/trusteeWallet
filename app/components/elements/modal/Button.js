/**
 * @version 0.9
 */
import React, { Component } from 'react'
import { TouchableOpacity, StyleSheet, Text } from 'react-native'

export default class Button extends Component {

    constructor(props) {
        super(props)
    }

    render() {
        return (
            <TouchableOpacity onPress={this.props.onPress} style={styles.btn}>
                <Text style={styles.text}>
                    {this.props.children}
                </Text>
            </TouchableOpacity>
        )
    }
}

const styles = StyleSheet.create({
    btn: {
        flexGrow: 1,
        padding: 10,
        alignSelf: 'center'
    },
    text: {
        fontSize: 18,
        // fontFamily: 'SanFran-Semibold',
        color: '#864dd9',
        textAlign: 'center'
    }
})
