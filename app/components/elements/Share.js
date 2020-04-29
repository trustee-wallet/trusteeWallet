/**
 * @version 0.9
 */
import React, { Component } from 'react'
import { View } from 'react-native'

import WebView from 'react-native-webview'


export default class Share extends Component {

    constructor(props) {
        super(props)
        this.state = {
            source: `
                <html>
                    <head>
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <meta charset="utf-8">
                    </head>
                    <body>
                        <a href="tel:+38033113332">
                    </body>
                </html>
            `,
            show: false,
            link: ''
        }
    }

    UNSAFE_componentWillReceiveProps(nextProps, nextContext) {
        if (typeof nextProps.link != 'undefined' && nextProps.link && nextProps.link !== '...') {
            this.setState({
                show: true,
                link: nextProps.link
            })
        }
    }

    handleShare = (social) => {
        this.webref.postMessage(social)
    }

    createScript = (link) => {
        return `
            (function() {
                window.addEventListener("message", function(event) {
                    switch(event.data){
                        case 'TELEGRAM':
                            window.open("https://telegram.me/share/url?url=${link}","_self");
                            break;
                        case 'VIBER':
                            window.open("viber://forward?text=${link}","_self");
                            break;
                        default:
                            break;
                    }
                }, false);
                
                document.addEventListener("message", function(event) {
                    switch(event.data){
                        case 'TELEGRAM':
                            window.open("https://telegram.me/share/url?url=${link}","_self");
                            break;
                        case 'VIBER':
                            window.open("viber://forward?text=${link}","_self");
                            break;
                        default:
                            break;
                    }
                }, false);
            })();
        `
    }

    render() {

        const { source } = this.props

        return (
            <View style={{ height: 0, maxHeight: 0, overflow: 'hidden' }}>
                {
                    this.state.show ?
                        <WebView
                            ref={r => (this.webref = r)}
                            javaScriptEnabled={true}
                            onLoadEnd={() => this.webref.injectJavaScript(this.createScript(this.state.link))}
                            showsVerticalScrollIndicator={false}
                            source={source}
                            useWebKit={true}
                        /> : null
                }
            </View>

        )
    }
}
