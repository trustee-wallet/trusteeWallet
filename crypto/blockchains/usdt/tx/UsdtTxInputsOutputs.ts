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
            { address: data.addressTo, value: 0, logType: 'FOR_USDT_AMOUNT' },
            { address: data.addressTo, value: this.DUST_FIRST_TRY, logType: 'FOR_USDT_BTC_OUTPUT' }
        ]
        return targets
    }

    _usualTargets(data: BlocksoftBlockchainTypes.TransferData, unspents: BlocksoftBlockchainTypes.UnspentTx[]) {
        const basicWishedAmountBN = new BlocksoftBN(0)
        const wishedAmountBN = new BlocksoftBN(basicWishedAmountBN)

        const outputs = []

        outputs.push({
            to: data.addressTo,
            amount: 0,
            logType: 'FOR_USDT_AMOUNT'
        })

        return {
            multiAddress: [],
            basicWishedAmountBN,
            wishedAmountBN,
            outputs
        }
    }

    _addressForChange(data: BlocksoftBlockchainTypes.TransferData): string {
        return data.addressFrom
    }

    async getInputsOutputs(data: BlocksoftBlockchainTypes.TransferData, unspents: BlocksoftBlockchainTypes.UnspentTx[],
                           feeToCount: { feeForByte?: string, feeForAll?: string, autoFeeLimitReadable?: string | number },
                           additionalData: BlocksoftBlockchainTypes.TransferAdditionalData,
                           subtitle: string = 'default')
        : Promise<BlocksoftBlockchainTypes.PreparedInputsOutputsTx> {
        let res = await super._getInputsOutputs(data, unspents, feeToCount, additionalData, subtitle + ' usdted')
        let inputIsFound = false
        let newInputs = []
        let oldInputs = []
        let addressFromUsdtOutputs = 0
        let newInputAdded = false
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
                        newInputAdded = unspent
                    }
                    inputIsFound = true
                    addressFromUsdtOutputs++
                }
            }
        }
        for (const input of oldInputs) {
            newInputs.push(input)
        }
        if (newInputAdded) {
            let changeIsFound = false
            for (const output of res.outputs) {
                if (typeof output.isChange !== 'undefined' && output.isChange) {
                    output.amount = BlocksoftUtils.add(output.amount, newInputAdded.value)
                    changeIsFound = true
                }
            }
            if (!changeIsFound && newInputAdded.value !== '546') {
                res.outputs.push({
                    // @ts-ignore
                    to: data.addressFrom,
                    // @ts-ignore
                    amount: newInputAdded.value.toString(),
                    // @ts-ignore
                    isChange: true
                })
            }
        }
        const tmp = typeof additionalData.balance !== 'undefined' && additionalData.balance ? { balance: additionalData.balance } : DaemonCache.getCacheAccountStatic(data.walletHash, 'USDT')
        let needOneOutput = false
        if (tmp.balance > 0) {
            const diff = BlocksoftUtils.diff(tmp.balance, data.amount)
            BlocksoftCryptoLog.log('USDT addressFromUsdtOutputs = ' + addressFromUsdtOutputs + ' balance ' + tmp.balance + ' diff ' + diff + '>0=' + (diff > 0 ? 'true' : 'false'))
            if (addressFromUsdtOutputs < 2 && diff > 0) {
                needOneOutput = true
            }
        }
        if (res.inputs.length === 0 && (!inputIsFound || newInputAdded.value === '546')) {
            throw new Error('SERVER_RESPONSE_NOT_ENOUGH_FEE_JUST_DUST')
        }
        res.inputs = newInputs
        if (res.inputs.length === 0 || !inputIsFound) {
            throw new Error('SERVER_RESPONSE_LEGACY_BALANCE_NEEDED_USDT')
        }

        const totalOuts = res.outputs.length
        if (totalOuts === 0) {
            const newRes = JSON.parse(JSON.stringify(res))
            newRes.outputs = []
            if (needOneOutput &&
                (
                    res.inputs.length > 1 || res.inputs[0].value * 1 >= this.DUST_FIRST_TRY * 2
                )
            ) {
                newRes.outputs.push({
                    isUsdt: true,
                    amount: this.DUST_FIRST_TRY.toString(),
                    to: data.addressFrom,
                    logType: 'FOR_LEGACY_USDT_KEEP'
                })
            }
            newRes.outputs.push({
                isUsdt: true,
                amount: this.DUST_FIRST_TRY.toString(),
                to: data.addressTo,
                logType: 'FOR_USDT_AMOUNT'
            })
            newRes.outputs.push({
                isUsdt: true,
                tokenAmount: data.amount,
                amount: '0',
                to: data.addressTo,
                logType: 'FOR_USDT_BTC_OUTPUT'
            })
            newRes.countedFor = 'USDT'
            return newRes
        } else {
            BlocksoftCryptoLog.log('UsdtTxInputsOutputs ' + data.addressFrom + ' => ' + data.addressTo + ' old outputs ' + JSON.stringify(res.outputs) + ' needOneOutput ' + needOneOutput ? 'true' : 'false')
            res = this._innerResort(res, needOneOutput, data.addressFrom, data.addressTo, data.amount, 'getInputsOutputs ' + subtitle)
            BlocksoftCryptoLog.log('UsdtTxInputsOutputs ' + data.addressFrom + ' => ' + data.addressTo + '  new outputs ' + JSON.stringify(res.outputs))
            res.countedFor = 'USDT'
            return res
        }
    }

    _innerResort(res: any, needOneOutput: boolean, addressFrom: string, addressTo: string, amount: string, source: string = '') {
        const totalOuts = res.outputs.length

        res.outputs = this._innerToUp(res.outputs, addressTo)
        if (res.outputs[0].amount !== '0') {
            if (totalOuts > 1) {
                if (res.outputs[0].to !== addressTo) {
                    throw new Error('usdt addressTo is invalid1.1 ' + JSON.stringify(res.outputs))
                } else if (res.outputs[1].to !== res.outputs[0].to) {
                    throw new Error('usdt addressTo is invalid1.2 ' + JSON.stringify(res))
                }
                if (res.outputs[1].to !== res.outputs[0].to) {
                    throw new Error('usdt addressTo is invalid1.2 ' + JSON.stringify(res.outputs))
                }
                res.outputs[1].amount = BlocksoftUtils.add(res.outputs[0].amount, res.outputs[1].amount).toString()
            } else {
                if (res.outputs[0].to !== addressTo) {
                    throw new Error('usdt addressTo is invalid2 ' + JSON.stringify(res.outputs))
                }
                res.outputs[1] = JSON.parse(JSON.stringify(res.outputs[0]))
            }
            res.outputs[1].isChange = true
            res.outputs[1].isUsdt = true
            res.outputs[0].isChange = false
            res.outputs[0].isUsdt = true
            res.outputs[0].tokenAmount = amount
            res.outputs[1].tokenAmount = '0'
            res.outputs[0].amount = '0'
        } else {
            res.outputs[0].isUsdt = true
            res.outputs[0].tokenAmount = amount
            res.outputs[0].amount = '0'
            if (totalOuts > 1) {
                if (res.outputs[1].to !== addressTo) {
                    throw new Error('usdt addressTo is invalid3 ' + JSON.stringify(res.outputs))
                }
                res.outputs[1].isUsdt = true
            } else {
                throw new Error('usdt addressTo is empty ' + JSON.stringify(res.outputs))
            }
        }
        const newOutputs = []
        if (needOneOutput) {
            if (typeof res.outputs[2] === 'undefined' || res.outputs[2].to !== addressFrom) {
                newOutputs.push({
                    isUsdt: true,
                    amount: this.DUST_FIRST_TRY.toString(),
                    to: addressFrom,
                    logType: 'FOR_LEGACY_USDT_KEEP3'
                })
            }
        }
        for (let i = res.outputs.length - 1; i >= 0; i--) {
            newOutputs.push(res.outputs[i])
        }
        res.outputs = newOutputs
        return res
    }

    _innerToUp(outputs, addressTo) {
        let result = []
        for (const output of outputs) {
            if (output.to === addressTo) {
                result.push(output)
            }
        }
        if (result.length === 1) {
            let amount = result[0].amount.toString()
            if (amount === '0' || BlocksoftUtils.diff(amount, this.DUST_FIRST_TRY.toString()).toString().indexOf('-') !== -1) {
                amount = this.DUST_FIRST_TRY.toString()
            }
            result = []
            result.push({
                isUsdt: true,
                tokenAmount: '?',
                amount: '0',
                to: addressTo,
                logType: 'FOR_USDT_BTC_OUTPUT1'
            })
            result.push({
                isUsdt: true,
                amount,
                to: addressTo,
                logType: 'FOR_USDT_AMOUNT1'
            })
        } else if (result.length === 0) {
            result.push({
                isUsdt: true,
                tokenAmount: '?',
                amount: '0',
                to: addressTo,
                logType: 'FOR_USDT_BTC_OUTPUT2'
            })
            result.push({
                isUsdt: true,
                amount: this.DUST_FIRST_TRY.toString(),
                to: addressTo,
                logType: 'FOR_USDT_AMOUNT2'
            })
        }
        for (const output of outputs) {
            if (output.to !== addressTo) {
                result.push(output)
            }
        }
        BlocksoftCryptoLog.log('USDT addressTo upTo', result)
        return result
    }
}
