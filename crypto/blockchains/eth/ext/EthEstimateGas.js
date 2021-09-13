const TransactionController = require('./estimateGas/index.js');

export default async function(provider, gasPrice, from, to, value) {
    if (from === to) return '21000'

    const gasPriceHex = '0x' + (+gasPrice).toString(16)
    const valueHex = '0x' + (+value).toString(16)

    const txController = new TransactionController({
        provider: provider,
        getGasPrice: gasPriceHex
    })

    const res = await txController.addTxGasDefaults({
        txParams: {
            from: from,
            to: to,
            value: valueHex
        },
        history: [{}]
    })

    return parseInt(res.txParams.gas, 16)
}
