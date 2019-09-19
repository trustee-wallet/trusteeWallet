const TransactionController = require('./estimateGas/index.js');

export default async function(provider, gasPrice, from, to, value) {
    let gasPriceHex = '0x' + (+gasPrice).toString(16)
    let valueHex = '0x' + (+value).toString(16)

    let txController = new TransactionController({
        provider: provider,
        getGasPrice: gasPriceHex
    })

    let res = await txController.addTxGasDefaults({
        txParams: {
            from: from,
            to: to,
            value: valueHex
        },
        history: [{}]
    })

    return parseInt(res.txParams.gas, 16)
}
