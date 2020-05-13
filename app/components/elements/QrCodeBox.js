/**
 * @version 0.9
 */
import React, { Component } from 'react'
import { Platform, View, Text } from 'react-native'
import QRCode from 'react-native-qrcode-svg'
import QRCodeOld from 'react-native-qrcode'

export default class QrCodeBox extends Component {

    constructor(props) {
        super(props)
        this.state = {}
    }

    render() {
        let platform = Platform.OS + ' v' + Platform.Version
        platform = platform.toLowerCase()
        if (platform.indexOf('ios v10.') === 0 || platform.indexOf('ios v9.') === 0) {
            return (
                <QRCodeOld
                    getRef={this.props.getRef}
                    value={this.props.value}
                    fgColor={this.props.color}
                    bgColor='#FFF'
                    size={this.props.size}
                    onError={this.props.onError}
                />
            )
        }

        return (
            <QRCode
                getRef={this.props.getRef}
                value={this.props.value}
                size={this.props.size}
                color={this.props.color}
                logo={this.props.logo}
                logoSize={this.props.logoSize}
                logoBackgroundColor={this.props.logoBackgroundColor}
                onError={this.props.onError}
            />
        )
    }
}
