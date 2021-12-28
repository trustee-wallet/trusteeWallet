// https://developers.tron.network/reference/sendtransaction
// https://justlend.org/static/js/utils/blockchain.js
export const INJECTEDJAVASCRIPT = `
const meta = document.createElement('meta'); meta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0'); meta.setAttribute('name', 'viewport');
document.getElementsByTagName('head')[0].appendChild(meta);


window.ReactNativeWebView.postMessage('ScriptWeb3 loaded');

try {
    const trustee = {
        _received : false,
        _setInterval : false,
        
        receiveBridge : (data) => {
            try {
                const tmp = JSON.parse(data);
                if (typeof tmp.req !== 'undefined' && typeof tmp.req.main !== 'undefined' && tmp.req.main) {
                    trustee._received = tmp;
                }
            } catch (e) {
                window.ReactNativeWebView.postMessage('receiveBridge parse error ' + e.message);
            }
        },
        
        sendBridge: async (data) => {
            try {
                if (trustee._setInterval) {
                   clearInterval(trustee._setInterval)
                }
                data.id = new Date().getTime()
                window.ReactNativeWebView.postMessage(JSON.stringify(data));           
                const res = await new Promise((resolve, reject) => {
                    trustee._setInterval = setInterval(() => {
                        if (trustee._received && trustee._received.req.main === data.main && trustee._received.req.id === data.id) {
                            if (typeof trustee._received.res.error !== 'undefined') {
                                reject(new Error(trustee._received.res.error));
                            } else {
                                resolve(trustee._received.res);
                            }
                        }
                    }, 1000)
               });
               return res;
            } catch (e) {
              window.ReactNativeWebView.postMessage('sendBridge error1 ' + e.message);
              throw new Error(e);
            }
        },
        
        tronWeb : {
            defaultAddress : {
                base58: 'TRX_ADDRESS_BASE58',
                hex : 'TRX_ADDRESS_HEX'
            },
            transactionBuilder : {
                triggerSmartContract : async (address, functionSelector, options, parameters) => {
                    return trustee.sendBridge({main: 'tronWeb', action: 'triggerSmartContract', address, functionSelector, options, parameters});
                },
            },
            trx : {
                sign : async (data) => {
                    return trustee.sendBridge({main: 'tronWeb', action: 'sign', data});
                },
                sendRawTransaction : async (data) => {
                    return trustee.sendBridge({main: 'tronWeb', action: 'sendRawTransaction', data});
                },
                getBalance : async (data) => {
                    return trustee.sendBridge({main: 'tronWeb', action: 'getBalance', data});
                },
                getConfirmedTransaction : async (data) => {
                    return trustee.sendBridge({main: 'tronWeb', action: 'getConfirmedTransaction', data});
                }
            }
        }
    }
    window.tronWeb = trustee.tronWeb;
    
    window.tronLink = {
      ready: true,
      request: (data) => {
        window.ReactNativeWebView.postMessage('trustee.tronLink request ');
      },
      tronWeb: trustee.tronWeb
    };
    
    (function() {
        window.addEventListener('message', (event) => {
            if (typeof event.data !== 'undefined' && event.data) {
                trustee.receiveBridge(event.data)
            }
        });
    
        document.addEventListener('message', (event) => {
            if (typeof event.data !== 'undefined' && event.data) {
                trustee.receiveBridge(event.data)
            }
        });
        
        console.log = (txt, data) => {
            window.ReactNativeWebView.postMessage('console.log ' + txt + (data ? JSON.stringify(data) : ''));
        }
    })();
    

} catch (e) {
    window.ReactNativeWebView.postMessage('injected error ' + e.message);
}
`


// here will be code later
/*

 window.ReactNativeWebView.postMessage('trustee.tronWeb.transactionBuilder.triggerSmartContract ' + JSON.stringify({address, functionSelector, options, parameters});
                sendTrx : (to, amount, from) => {
                    window.ReactNativeWebView.postMessage('trustee.tronWeb.transactionBuilder.sendTrx ' + to + ' ' + amount + ' ' + from);
                },

        trx : {
            getContract : (tx) => {
               window.ReactNativeWebView.postMessage('trustee.tronWeb.trx.getContract ' + JSON.stringify(tx));
            },
            sendRawTransaction: (tx) => {
               window.ReactNativeWebView.postMessage('trustee.tronWeb.trx.sendRawTransaction ' + JSON.stringify(tx));
            },
            sendTransaction: (tx) => {
               window.ReactNativeWebView.postMessage('trustee.tronWeb.trx.sendTransaction ' + JSON.stringify(tx));
            },
            sendToken: (tx) => {
               window.ReactNativeWebView.postMessage('trustee.tronWeb.trx.sendToken ' + JSON.stringify(tx));
            },
            sign : (tx) => {
                window.ReactNativeWebView.postMessage('trustee.tronWeb.trx.sign ' + JSON.stringify(tx));
            }
        },
        contract : (tx) => {
              window.ReactNativeWebView.postMessage('trustee.tronWeb.contract ' + JSON.stringify(tx));
        }

const trustee = {
    personal : {
        sign : () => {
            window.ReactNativeWebView.postMessage('trustee.personal.sign');
        },
    },
    ethereum : {
        request : (data) => {
            window.ReactNativeWebView.postMessage('trustee.ethereum.request ' + JSON.stringify(data));
        },
        isConnected : () => {
           window.ReactNativeWebView.postMessage('trustee.ethereum.isConnected')
        },
        on : (name, fnc) => {
           window.ReactNativeWebView.postMessage('trustee.ethereum.on ' + name)
        },
        removeListener : (name, fnc) => {
           window.ReactNativeWebView.postMessage('trustee.ethereum.removeListener ' + name)
        }
    }
}
window.web3 = trustee;
window.ethereum = trustee;
 */

