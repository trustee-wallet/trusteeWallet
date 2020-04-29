// https://github.com/iancoleman/bip39/blob/0a23f51792722f094328d695242556c4c0195a8b/src/js/bitcoinjs-extensions.js
const bitcoin = require('bitcoinjs-lib')

module.exports = {
    'mainnet': {
        network: bitcoin.networks.bitcoin,
        langPrefix: 'btc'
    },
    'testnet': {
        network: bitcoin.networks.testnet,
        langPrefix: 'btc'
    },
    'litecoin': {
        network: {
            bech32: 'ltc',
            messagePrefix: '\x19Litecoin Signed Message:\n',
            pubKeyHash: 0x30,    // change to 0x6f
            scriptHash: 0x32,
            wif: 0xb0,
            bip32: {
                public: 0x019da462,
                private: 0x019d9cfe
            }
        },
        langPrefix: 'ltc'
    },
    'dogecoin': {
        network: {
            messagePrefix: '\x19Dogecoin Signed Message:\n',
            bip32: {
                public: 0x02facafd,
                private: 0x02fac398
            },
            pubKeyHash: 0x1e,
            scriptHash: 0x16,
            wif: 0x9e
        },
        langPrefix: 'ltc'
    },
    'verge': {
        network: {
            messagePrefix: '\x18VERGE Signed Message:\n',
            bip32: {
                public: 0x0488b21e,
                private: 0x0488ade4
            },
            pubKeyHash: 0x1e,
            scriptHash: 0x21,
            wif: 0x9e
        },
        langPrefix: 'ltc'
    },
    'bitcoincash': {
        network: {

            /* messagePrefix: 'unused',
            bip32: {
                public: 0x0488b21e,
                private: 0x0488ade4
            },
            pubKeyHash: 0x00,
            scriptHash: 0x05,
            wif: 0x80
            */
            messagePrefix: '\u0018Bitcoin Signed Message:\n',
            bech32: 'bc',
            bip32: { public: 76067358, private: 76066276 },
            pubKeyHash: 0,
            scriptHash: 5,
            wif: 128,
            BTCFork : 'BCH'
        },
        langPrefix: 'bch'
    },
    'bitcoinsv': {
        network: {
            messagePrefix: 'unused',
            bip32: {
                public: 0x0488b21e,
                private: 0x0488ade4
            },
            pubKeyHash: 0x00,
            scriptHash: 0x05,
            wif: 0x80,
            BTCFork : 'BCH'
        },
        langPrefix: 'bch'
    },
    'bitcoingold': {
        network: {
            bech32: 'btg',
            messagePrefix: '\x1DBitcoin Gold Signed Message:\n',
            bip32: {
                public: 0x0488b21e,
                private: 0x0488ade4
            },
            pubKeyHash: 38,
            scriptHash: 23,
            wif: 128,
            BTCFork : 'BTG'
        },
        langPrefix: 'ltc'
    }
}
