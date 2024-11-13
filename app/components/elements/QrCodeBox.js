/**
 * @version 0.9
 */
import React, { Component } from 'react'
import QRCode from 'react-native-qrcode-svg'

export default class QrCodeBox extends Component {
    constructor(props) {
        super(props)
        this.state = {}
    }

    render() {
        if (!this.props.value || this.props.value === '') {
            return null
        }
        return (
            <QRCode
                getRef={this.props.getRef}
                value={this.props.value}
                size={this.props.size}
                color={this.props.color}
                backgroundColor={this.props.backgroundColor}
                logo={this.props.logo}
                logoSize={this.props.logoSize}
                logoBackgroundColor={this.props.logoBackgroundColor}
                quietZone={10}
                style={this.props.style}
                onError={this.props.onError}
            />
        )
    }
}
