const TransactionController = require('./index.js')

it('estimateGas is ok', async () => {
    let txController = new TransactionController({
        provider: 'https://ropsten.infura.io/v3/478e48mushyfgsdfryumlrynh', // e.g. 'https://mainnet.infura.io/...'
        getGasPrice: '0xee6b2800'// gasPrice in hex e.g. '0xee6b2800' (4gwei)
    })

    let res = await txController.addTxGasDefaults({
        txParams: {
            from: '0x78c1908407E2f0adbfe30b544d4C8C55c8937935', // e.g. '0x78c1908407E2f0adbfe30b544d4C8C55c8937935'
            to: '0xB8c77482e45F1F44dE1745F52C74426C631bDD52', // e.g. '0xB8c77482e45F1F44dE1745F52C74426C631bDD52'
            value: '0xE8D4A51000' // e.g. '0xE8D4A51000'
        },
        history: [{}]
    })

    expect(res).not.toEqual({})

})
