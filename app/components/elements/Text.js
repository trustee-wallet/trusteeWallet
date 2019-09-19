import React, { Component } from 'react'

import {
    View,
    Platform
} from "react-native"

import { WebView } from 'react-native-webview'

export default class Text extends Component {

    constructor(props){
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

        const { style } = this.props

        const source = {
            html: `
                <html>
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
            `,
        }

        if(Platform.OS === 'android'){
            source.baseUrl = ''
        }

        return (
            <View style={{ height: +this.state.height == 0 ? this.props.style.height: +this.state.height, marginBottom: 5 }}>
                <WebView
                    ref={r => (this.webref = r)}
                    javaScriptEnabled={true}
                    onLoadEnd={() => this.webref.injectJavaScript(this.state.script)}
                    showsVerticalScrollIndicator={false}
                    onMessage={event => {
                        this.setState({
                            height: event.nativeEvent.data
                        })
                    }}
                    source={source}
                    useWebKit={true}
                />
            </View>
        )
    }
}