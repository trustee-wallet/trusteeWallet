// https://developers.tron.network/reference/sendtransaction
// https://justlend.org/static/js/utils/blockchain.js
const meta = document.createElement('meta')
meta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0')
meta.setAttribute('name', 'viewport')
document.getElementsByTagName('head')[0].appendChild(meta)

window.ReactNativeWebView.postMessage('ScriptWeb3 loaded')

try {
    const trustee = {
        _received: {},
        _setInterval :{},
        _callbackOnEvent: {},

        receiveBridge: (data) => {
            try {
                const tmp = JSON.parse(data)
                if (typeof tmp.req !== 'undefined' && typeof tmp.req.main !== 'undefined' && tmp.req.main) {
                    trustee._received[tmp.req.id] = tmp
                }
            } catch (e) {
                window.ReactNativeWebView.postMessage('receiveBridge parse error ' + e.message + ' on data ' + data)
            }
        },

        sendBridge: async (data) => {
            let res
            try {
                data.id = new Date().getTime() + '_' + Math.random()
                window.ReactNativeWebView.postMessage(JSON.stringify(data))
                res = await new Promise((resolve, reject) => {
                    trustee._setInterval[data.id] = setInterval(() => {
                        if (typeof trustee._received[data.id] !== 'undefined') {
                            if (typeof trustee._received[data.id].res.error !== 'undefined') {
                                const tmp = trustee._received[data.id].res.error
                                delete trustee._received[data.id]
                                reject(new Error(tmp))
                            } else {
                                const tmp = JSON.parse(JSON.stringify(trustee._received[data.id].res))
                                delete trustee._received[data.id]
                                resolve(tmp)
                            }
                        }
                    }, 1000)
                })
                clearInterval(trustee._setInterval[data.id])
            } catch (e) {
                clearInterval(trustee._setInterval[data.id])
                window.ReactNativeWebView.postMessage('sendBridge error11 ' + e.message)
                throw new Error(e)
            }

            return res
        },

        tronWeb: {
            defaultAddress: {
                base58: 'TRX_ADDRESS_BASE58',
                hex: 'TRX_ADDRESS_HEX'
            },
            transactionBuilder: {
                triggerSmartContract: async (address, functionSelector, options, parameters) => {
                    return trustee.sendBridge({ main: 'tronWeb', action: 'triggerSmartContract', address, functionSelector, options, parameters })
                }
            },
            trx: {
                sign: async (data) => {
                    return trustee.sendBridge({ main: 'tronWeb', action: 'sign', data })
                },
                sendRawTransaction: async (data) => {
                    return trustee.sendBridge({ main: 'tronWeb', action: 'sendRawTransaction', data })
                },
                getBalance: async (data) => {
                    return trustee.sendBridge({ main: 'tronWeb', action: 'getBalance', data })
                },
                getConfirmedTransaction: async (data) => {
                    return trustee.sendBridge({ main: 'tronWeb', action: 'getConfirmedTransaction', data })
                }
            }
        },

        ethereum: {
            selectedAddress: 'ETH_ADDRESS_HEX',
            chainId: 'ETH_CHAIN_ID_HEX',
            networkVersion: 'ETH_CHAIN_ID_INTEGER',
            isMetaMask: true,
            isConnected: () => {
                return true
            },
            activate: () => {
                return true
            },
            enable: async () => {
                return true
            },

            on: (event, funcOnEvent) => {
                if (typeof funcOnEvent !== 'undefined' && funcOnEvent !== 'undefined') {
                    trustee._callbackOnEvent[event] = funcOnEvent;
                }
            },

            onCallback: (event, result) => {
                if (typeof trustee._callbackOnEvent[event] !== 'undefined' && JSON.stringify(trustee._callbackOnEvent[event]) !== 'undefined') {
                    trustee._callbackOnEvent[event](JSON.parse(JSON.stringify(result)))
                }
            },

            request: async (data) => {
                const tmp = await trustee.sendBridge({ main: 'ethereum', action: 'request', data })
                if (typeof tmp.onEvent !== 'undefined' && tmp.onEvent) {
                    trustee.ethereum.onCallback(tmp.onEvent, tmp.result)
                }
                return tmp.result
            },
            send: async (data) => {
                const tmp = await trustee.sendBridge({ main: 'ethereum', action: 'send', data })
                if (typeof tmp.onEvent !== 'undefined' && tmp.onEvent) {
                    trustee.ethereum.onCallback(tmp.onEvent, tmp.rpc.result)
                }
                return tmp.rpc
            },
            sendAsync: async (data, callback) => {
                const tmp = await trustee.sendBridge({ main: 'ethereum', action: 'sendAsync', data })
                if (typeof callback !== 'undefined') {
                    callback(false, tmp.rpc)
                }
                if (typeof tmp.onEvent !== 'undefined' && tmp.onEvent) {
                    trustee.ethereum.onCallback(tmp.onEvent, tmp.rpc.result)
                }
                return tmp.rpc
            },
            getAccounts : async () => {
                console.log('GEEET ACCOUNTS?')
            },

        }
    }
    window.tronWeb = trustee.tronWeb

    window.tronLink = {
        ready: true,
        request: (data) => {
            window.ReactNativeWebView.postMessage('trustee.tronLink request ')
        },
        tronWeb: trustee.tronWeb
    }
    
    window.ethereum = trustee.ethereum;

    (function() {
        window.dispatchEvent(new Event('ethereum#initialized'))

        window.addEventListener('message', (event) => {
            if (typeof event.data !== 'undefined' && event.data) {
                if (event.data.indexOf('fromTrustee') !== -1) {
                    trustee.receiveBridge(event.data)
                }
            }
        })

        document.addEventListener('message', (event) => {
            if (typeof event.data !== 'undefined' && event.data) {
                if (event.data.indexOf('fromTrustee') !== -1) {
                    trustee.receiveBridge(event.data)
                }
            }
        })

        console.log = (txt, data) => {
            window.ReactNativeWebView.postMessage('console.log general ' + (txt ? JSON.stringify(txt) : '') + ' ' + (data ? JSON.stringify(data) : ''))
        }

        console.info = (txt, data) => {
            window.ReactNativeWebView.postMessage('console.info general ' + (txt ? JSON.stringify(txt) : '') + ' ' + (data ? JSON.stringify(data) : ''))
        }

        console.error = (e, data) => {
            window.ReactNativeWebView.postMessage('console.error general ' + (e && typeof e.message !== 'undefined' ? JSON.stringify(e.message) : '') + ' ' + (data ? JSON.stringify(data) : ''))
        }
    })()


} catch (e) {
    window.ReactNativeWebView.postMessage('injected error ' + e.message)
}
