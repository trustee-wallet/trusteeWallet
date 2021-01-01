/**
 * @version 0.20
 */
import { BlocksoftBlockchainTypes } from '../../BlocksoftBlockchainTypes'
import BtcTxInputsOutputs from '../../btc/tx/BtcTxInputsOutputs'
import BlocksoftBN from '../../../common/BlocksoftBN'
import BlocksoftUtils from '../../../common/BlocksoftUtils'
import BlocksoftCryptoLog from '../../../common/BlocksoftCryptoLog'
import DaemonCache from '../../../../app/daemons/DaemonCache'

export default class UsdtTxInputsOutputs extends BtcTxInputsOutputs implements BlocksoftBlockchainTypes.TxInputsOutputs {

    DUST_FIRST_TRY = 546
    SIZE_FOR_BASIC = 442

    _coinSelectTargets(data: BlocksoftBlockchainTypes.TransferData, unspents: BlocksoftBlockchainTypes.UnspentTx[], feeForByte: string, multiAddress: string[], subtitle: string) {
        const targets = [
            { address: data.addressTo, value: 0 },
            { address: data.addressTo, value: this.DUST_FIRST_TRY }
        ]
        return targets
    }

    _usualTargets(data: BlocksoftBlockchainTypes.TransferData, unspents: BlocksoftBlockchainTypes.UnspentTx[]) {
        const basicWishedAmountBN = new BlocksoftBN(0)
        const wishedAmountBN = new BlocksoftBN(basicWishedAmountBN)

        const outputs = []

        outputs.push({
            'to': data.addressTo,
            'amount': 0
        })

        return {
            multiAddress: [],
            basicWishedAmountBN,
            wishedAmountBN,
            outputs
        }
    }

    getInputsOutputs(data: BlocksoftBlockchainTypes.TransferData, unspents: BlocksoftBlockchainTypes.UnspentTx[],
                     feeToCount: { feeForByte?: string, feeForAll?: string, autoFeeLimitReadable?: string | number },
                     subtitle: string = 'default')
        : {
        inputs: BlocksoftBlockchainTypes.UnspentTx[],
        outputs: BlocksoftBlockchainTypes.OutputTx[],
        multiAddress: [],
        msg: string,
    } {
        const res = super.getInputsOutputs(data, unspents, feeToCount, subtitle + ' usdted')
        let inputIsFound = false
        let newInputs = []
        let oldInputs = []
        let addressFromUsdtOutputs = 0
        for (const input of res.inputs) {
            if (input.address === data.addressFrom) {
                if (!inputIsFound) {
                    newInputs.push(input)
                } else {
                    oldInputs.push(input)
                }
                inputIsFound = true
                addressFromUsdtOutputs++
            } else {
                oldInputs.push(input)
            }
        }
        if (!inputIsFound) {
            for (const unspent of unspents) {
                if (unspent.address === data.addressFrom) {
                    if (!inputIsFound) {
                        newInputs.push(unspent)
                    }
                    inputIsFound = true
                    addressFromUsdtOutputs++
                }
            }
        }
        for (const input of oldInputs) {
            newInputs.push(input)
        }
        const tmp = DaemonCache.getCacheAccountStatiс(data.walletHash, 'USDT')
        let needOneOutput = false
        if (tmp.balance > 0) {
            const diff = BlocksoftUtils.diff(tmp.balance, data.amount)
            BlocksoftCryptoLog.log('USDT addressFromUsdtOutputs = ' + addressFromUsdtOutputs + ' balance ' + tmp.balance + ' diff ' + diff + '>0=' + (diff > 0 ? 'true' : 'false'))
            if (addressFromUsdtOutputs < 2 && diff > 0) {
                needOneOutput = true
            }
        }
        res.inputs = newInputs
        if (res.inputs.length === 0 || !inputIsFound) {
           throw new Error('SERVER_RESPONSE_LEGACY_BALANCE_NEEDED_USDT')
        }

        const totalOuts = res.outputs.length
        if (totalOuts === 0) {
            res.outputs = []
            if (needOneOutput) {
                res.outputs.push({
                    isUsdt: true,
                    amount: this.DUST_FIRST_TRY.toString(),
                    to: data.addressFrom
                })
            }
            res.outputs.push({
                isUsdt: true,
                amount: this.DUST_FIRST_TRY.toString(),
                to: data.addressTo
            })
            res.outputs.push({
                isUsdt: true,
                tokenAmount: data.amount,
                amount: '0',
                to: data.addressTo
            })
            return res
        }

        BlocksoftCryptoLog.log('UsdtTxInputsOutputs old outputs ' + JSON.stringify(res.outputs))
        if (res.outputs[0].amount !== '0') {
            if (totalOuts > 1) {
                if (res.outputs[0].to !== data.addressTo) {
                    throw new Error('usdt addressTo is invalid1.1 ' + JSON.stringify(res.outputs))
                }
                if (res.outputs[1].to !== res.outputs[0].to) {
                    throw new Error('usdt addressTo is invalid1.2 ' + JSON.stringify(res.outputs))
                }
                res.outputs[1].amount = BlocksoftUtils.add(res.outputs[0].amount, res.outputs[1].amount).toString()
            } else {
                if (res.outputs[0].to !== data.addressTo) {
                    throw new Error('usdt addressTo is invalid2 ' + JSON.stringify(res.outputs))
                }
                res.outputs[1] = JSON.parse(JSON.stringify(res.outputs[0]))
            }
            res.outputs[1].isChange = true
            res.outputs[1].isUsdt = true
            res.outputs[0].isChange = false
            res.outputs[0].isUsdt = true
            res.outputs[0].tokenAmount = data.amount
            res.outputs[1].tokenAmount = '0'
            res.outputs[0].amount = '0'
        } else {
            res.outputs[0].isUsdt = true
            res.outputs[0].tokenAmount = data.amount
            res.outputs[0].amount = '0'
            if (totalOuts > 1) {
                if (res.outputs[1].to !== data.addressTo) {
                    throw new Error('usdt addressTo is invalid3 ' + JSON.stringify(res.outputs))
                }
                res.outputs[1].isUsdt = true
            } else {
                throw new Error('usdt addressTo is empty ' + JSON.stringify(res.outputs))
            }
        }
        const newOutputs = []
        if (needOneOutput) {
            newOutputs.push({
                isUsdt: true,
                amount: this.DUST_FIRST_TRY.toString(),
                to: data.addressFrom
            })
        }
        for (let i = res.outputs.length - 1; i--; i >=0) {
            newOutputs.push(res.outputs[i])
        }
        res.outputs = newOutputs
        BlocksoftCryptoLog.log('UsdtTxInputsOutputs new outputs ' + JSON.stringify(res.outputs))
        return res
    }
}
