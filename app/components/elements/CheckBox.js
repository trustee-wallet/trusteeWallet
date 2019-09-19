import React, { Component } from 'react'
import { Platform, View } from 'react-native'

import Ionicons from "react-native-vector-icons/Ionicons"


export default class Button extends Component {

    constructor(props){
        super(props)
    }

    render() {

        const { value } = this.props

        return (
            <View style={{...styles.checkbox}}>
                { value ? <View style={{ position: 'relative', top: Platform.OS === 'ios' ? -2 : 0 }}><Ionicons name='ios-checkmark' size={20} color='#404040' /></View> : null }
                { console.log('Button.checkbox.value', value) }
            </View>
        )
    }
}

const styles = {
    checkbox: {
        alignItems: 'center',
        justifyContent: 'center',

        width: 16,
        height: 16,

        backgroundColor: '#fff',
        borderRadius: 2
    },
}
