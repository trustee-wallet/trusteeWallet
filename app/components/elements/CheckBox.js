import React, { Component } from 'react'
import { Platform, View, TouchableOpacity } from 'react-native'

import Ionicons from "react-native-vector-icons/Ionicons"


export default class Checkbox extends Component {

    constructor(props){
        super(props)
        this.state = {
            value: false
        }
    }

    changeValue = () => {
        this.setState({ value: !this.state.value })
        this.props.changeCallback()
    }

    getState = () => this.state.value

    render() {

        const { value } = this.state

        return (
            <TouchableOpacity style={styles.wrapper} onPress={this.changeValue}>
                <View style={{...styles.checkbox}}>
                    { value ? <View style={{ position: 'relative', top: Platform.OS === 'ios' ? -2 : 0 }}><Ionicons name='ios-checkmark' size={28} color='#7127AC' /></View> : null }
                    { console.log('Button.checkbox.value', value) }
                </View>
            </TouchableOpacity>
        )
    }
}

const styles = {
    wrapper: {
        padding: 20
    },
    checkbox: {
        alignItems: 'center',
        justifyContent: 'center',

        width: 24,
        height: 24,

        backgroundColor: '#fff',
        borderRadius: 2
    },
}
