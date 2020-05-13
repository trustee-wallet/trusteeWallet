/**
 * @version 0.9
 */
import React, { Component } from 'react'
import LinearGradient from 'react-native-linear-gradient'
import { Platform, View } from 'react-native'

export default class GradientView extends Component {

    constructor(props) {
        super(props)
        this.state = {}
    }

    render() {

        let platform = Platform.OS + ' v' + Platform.Version
        platform = platform.toLowerCase()
        if (platform.indexOf('ios v10.') === 0 || platform.indexOf('ios v9.') === 0) {
            return (
                <View style={this.props.style}>
                    {this.props.children}
                </View>
            )
        }

        return (
            <LinearGradient style={this.props.style} colors={this.props.array} start={this.props.start} end={this.props.end}>
                {this.props.children}
            </LinearGradient>
        )
    }
}
