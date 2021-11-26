/**
 * @version 0.9
 */
import React, { Component } from 'react'
import LinearGradient from 'react-native-linear-gradient'

export default class GradientView extends Component {

    constructor(props) {
        super(props)
        this.state = {}
    }

    render() {

        return (
            <LinearGradient
                style={this.props.style}
                colors={this.props.array}
                start={this.props.start}
                end={this.props.end}
                locations={this.props.locations}
                useAngle={this.props.useAngle}
                angleCenter={this.props.angleCenter}
                angle={this.props.angle}
                renderToHardwareTextureAndroid
                shouldRasterizeIOS
            >
                {this.props.children}
            </LinearGradient>
        )
    }
}
