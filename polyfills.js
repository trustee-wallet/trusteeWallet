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

if (typeof global?.Linking === 'undefined') {
    try {
        global.Linking = require('react-native').Linking
    } catch (e) {
        // eslint-disable-next-line no-console
        console.error('react-native-compat: react-native.Linking is not available')
    }
}
// end import '@walletconnect/react-native-compat'

if (typeof BigInt === 'undefined') {
    global.BigInt = require('big-integer');
}