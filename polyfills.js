// import '@walletconnect/react-native-compat' =>

// Polyfill TextEncode / TextDecode
// import 'fast-text-encoding'
import '@assets/fast-text-encoding.min'

// Polyfill crypto.getRandomvalues
// import 'react-native-get-random-values'

// Polyfill Buffer
if (typeof Buffer === 'undefined') {
    global.Buffer = require('buffer').Buffer
}

// end import '@walletconnect/react-native-compat'

if (typeof BigInt === 'undefined') {
    global.BigInt = require('big-integer');
}