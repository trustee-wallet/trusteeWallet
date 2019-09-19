module.exports = {
    'LTC' : {
        messagePrefix: '\x19Litecoin Signed Message:\n',
        pubKeyHash: 0x30,    // change to 0x6f
        scriptHash: 0x32,
        wif: 0xb0,
        bip32: {
            public: 0x019da462,
            private: 0x019d9cfe
        }
    }
}
