import React, { Component } from "react"
import { View, Text } from "react-native"

export default class LetterSpacing extends Component {
    render(){

        const { text, textStyle, letterSpacing, containerStyle, numberOfLines } = this.props

        const tmpNumberOfLines = typeof numberOfLines != "undefined" ? numberOfLines : 1

        return (
            <View style={{ flexDirection: "row", ...containerStyle }}>
                {
                    text.split('').map((item, index) => {
                        return <Text style={{...textStyle, marginRight: letterSpacing }} key={index}>{ item }</Text>
                    })
                }
            </View>
        )
    }
}