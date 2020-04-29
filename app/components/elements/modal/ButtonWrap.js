/**
 * @version 0.9
 */
import React, { Component } from 'react'
import { StyleSheet, View } from 'react-native'

export default class ButtonWrap extends Component {

    constructor(props) {
        super(props)
    }

    render() {
        return (
            <View style={styles.container}>
                {
                    this.props.children
                }
            </View>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        marginTop: 20,
        borderTopColor: '#8e96b5',
        borderTopWidth: 1,
        borderStyle: 'solid'
    }
})
