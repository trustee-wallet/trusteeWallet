/**
 * @version 0.9
 */
import React, { Component } from 'react'
import { View, Text, Dimensions } from 'react-native'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

export default class LetterSpacing extends Component {

    letterSpacingCheck = (value) => {
        switch (value) {
            case 1:
            case .7:
                return '2006'
            case 0.5:
                return '200A'
            default:
                return '2006'
        }
    }

    prepareString = (string, letterSpacing) => {

        let tmpArray = string.split(' ')

        tmpArray = tmpArray.map(item => {
            return item.split('').join(String.fromCodePoint(parseInt(this.letterSpacingCheck(letterSpacing), 16)))
        })

        return tmpArray
    }

    render() {

        const { text, textStyle, letterSpacing, containerStyle, numberOfLines = 1, underline } = this.props

        const isUnderline = typeof underline !== 'undefined' && underline

        if (typeof text.split === 'undefined') {
            return <Text>...</Text>
        }

        return (
            SCREEN_WIDTH < 350 ?
                <View style={{ flexDirection: 'row', ...containerStyle, textDecorationLine: isUnderline ? 'underline' : 'none' }} numberOfLines={1}>
                    {
                        text.split('').map((item, index) => {
                            return <Text numberOfLines={2} style={{ ...textStyle, marginRight: letterSpacing }} key={index}>{item}</Text>
                        })
                    }
                </View>
                :
                <View style={{ flexDirection: 'row', flexWrap: numberOfLines !== 1 ? 'wrap' : 'nowrap', ...containerStyle }}>
                    {
                        numberOfLines === 1 ?
                            <Text style={[textStyle, isUnderline ? { color: '#864DD9' } : null]} numberOfLines={numberOfLines}>{this.prepareString(text, letterSpacing).join('  ')}</Text>
                            :
                            this.prepareString(text, letterSpacing).map((item, index) => {
                                return (
                                    <Text style={{ ...textStyle, marginRight: this.prepareString(text, letterSpacing).length - 1 === index ? 0 : 5 }} key={index}>{item}</Text>
                                )
                            })
                    }
                </View>
        )
    }
}
