import React, { Component } from 'react'
import { Text, TouchableOpacity, View } from "react-native"


export default class ButtonLine extends Component {

    constructor(props){
        super(props)
    }

    render() {

        const { styleText, touchableOpacityStyle, disabled } = this.props

        return (
            <View style={{ backgroundColor: '#fff', ...this.props.styles}}>
                <TouchableOpacity onPress={this.props.press} style={touchableOpacityStyle} disabled={typeof disabled != 'undefined' ? disabled : false }>
                    <View style={{...styles.btn, ...this.props.innerStyle}}>
                        <Text style={{...styles.btn__text, ...styleText}}>
                            { this.props.children }
                        </Text>
                    </View>
                </TouchableOpacity>
            </View>
        )
    }
}

const styles = {
    btn: {
        justifyContent: 'center',
        height: 42,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#732bb1',
    },
    btn__text:{
        fontSize: 19,
        fontFamily: 'SFUIDisplay-Regular',
        textAlign: 'center',
        color: '#732bb1'
    }
}
