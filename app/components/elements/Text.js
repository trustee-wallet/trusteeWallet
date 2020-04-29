/**
 * @version 0.9
 */
import React, { Component } from 'react'

import { Platform, Text } from 'react-native'

export default class TextView extends Component {

    constructor(props) {
        super(props)
        this.state = {
            height: 0,
            script: `
            (function() {
                var mainTextEl = document.getElementById('mainText');
              
                window.ReactNativeWebView.postMessage(JSON.stringify(mainTextEl.offsetHeight));
            })();
            `
        }
    }

    render() {

        const source = {
            html: `
                <html style="background-color: #f9f9f9;">
                    <head>
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <meta charset="utf-8">
                    </head>
                    <body>
                        <p id="mainText" style="position: fixed; top: 0; left: 0; width: 100%; text-align: justify; padding-bottom: 30px; color: #999999; font-size: 16px;
                         font-family: Arial, sans-serif;">
                            ${this.props.children}
                        </p>
                    </body>
                </html>
            `
        }

        if (Platform.OS === 'android') {
            source.baseUrl = ''
        }

        return (
            <Text style={{ fontFamily: 'SFUIDisplay-Regular', color: '#999', fontSize: 16, textAlign: 'justify', marginBottom: 5 }}>
                {this.props.children}
            </Text>
        )
    }
}
