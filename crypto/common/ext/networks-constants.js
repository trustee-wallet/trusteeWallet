let bitcoin = require('bitcoinjs-lib')

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
    }
}
