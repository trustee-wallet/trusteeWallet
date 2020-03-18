import React, { Component } from "react"
import { View, Text, Dimensions } from "react-native"

const { width: SCREEN_WIDTH } = Dimensions.get("window")

export default class LetterSpacing extends Component {
    render(){

        const { text, textStyle, letterSpacing, containerStyle, numberOfLines, underline } = this.props

        const isUnderline = typeof underline !== "undefined" && underline

        if(typeof text.split === "undefined"){
            return <Text>...</Text>
        }

        return (
            SCREEN_WIDTH < 350 ?
                <Text style={{ flexDirection: "row", ...containerStyle, textDecorationLine: isUnderline ? "underline" : "none" }} numberOfLines={1}>
                    {
                        text.split('').map((item, index) => {
                            return <Text numberOfLines={2} style={{...textStyle, marginRight: letterSpacing }} key={index}>{ item }</Text>
                        })
                    }
                </Text>
                :
                <View style={{ flexDirection: "row", ...containerStyle }}>
                    {
                        text.split('').map((item, index) => {
                           return <View style={[isUnderline ? { borderBottomWidth: 1, borderBottomColor: "#864DD9" } : null]} key={index}><Text style={[textStyle, { marginRight: letterSpacing }, isUnderline ? { color: "#864DD9" } : null ]}>{ item }</Text></View>
                        })
                    }
                </View>
        )
    }
}
