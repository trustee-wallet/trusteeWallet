/**
 * @version 0.20
 */
import { BlocksoftBlockchainTypes } from '../../BlocksoftBlockchainTypes'
import BlocksoftBN from '../../../common/BlocksoftBN'
import BlocksoftUtils from '../../../common/BlocksoftUtils'
import BlocksoftCryptoLog from '../../../common/BlocksoftCryptoLog'
import MarketingEvent from '../../../../app/services/Marketing/MarketingEvent'

export namespace DogeLogs {
    export const logInputsOutputs = function (data: BlocksoftBlockchainTypes.TransferData,
                      unspents: BlocksoftBlockchainTypes.UnspentTx[],
                      preparedInputsOutputs: {
                          inputs: BlocksoftBlockchainTypes.UnspentTx[],
                          outputs: BlocksoftBlockchainTypes.OutputTx[],
                          multiAddress: [],
                          msg: string,
                      }, settings: any, title: string): any {
        const logInputsOutputs = {
            inputs: [],
            outputs: [],
            totalIn: 0,
            totalOut: 0,
            diffInOut: 0,
            msg: preparedInputsOutputs.msg || 'none'
        }
        const totalInBN = new BlocksoftBN(0)
        const totalOutBN = new BlocksoftBN(0)
        const totalBalanceBN = new BlocksoftBN(0)
        if (typeof unspents !== 'undefined' && unspents && unspents.length > 0) {
            for (const unspent of unspents) {
                totalBalanceBN.add(unspent.value)
            }
        }

        const leftBalanceBN = new BlocksoftBN(totalBalanceBN)
        const sendBalanceBN = new BlocksoftBN(0)
        let input, output
        if (preparedInputsOutputs) {
            for (input of preparedInputsOutputs.inputs) {
                logInputsOutputs.inputs.push({
                    txid: input.txid,
                    vout: input.vout,
                    value: input.value,
                    confirmations: input.confirmations,
                    address: input.address || 'none'
                })
                totalInBN.add(input.value)
                leftBalanceBN.diff(input.value)
            }
            for (output of preparedInputsOutputs.outputs) {
                if (output.amount === 'removed') continue
                logInputsOutputs.outputs.push(output)
                totalOutBN.add(output.amount)
                if (typeof output.isChange === 'undefined' || !output.isChange) {
                    sendBalanceBN.add(output.amount)
                }
            }
        }
        logInputsOutputs.totalIn = totalInBN.get()
        logInputsOutputs.totalOut = totalOutBN.get()
        logInputsOutputs.diffInOut = totalInBN.diff(totalOutBN).get()
        logInputsOutputs.diffInOutReadable = BlocksoftUtils.toUnified(logInputsOutputs.diffInOut, settings.decimals)

        const tmpBN = new BlocksoftBN(totalOutBN).diff(data.amount)
        if (logInputsOutputs.diffInOut > 0) {
            tmpBN.add(logInputsOutputs.diffInOut)
        }
        logInputsOutputs.totalOutMinusAmount = tmpBN.get()
        logInputsOutputs.totalBalance = totalBalanceBN.get()
        logInputsOutputs.leftBalance = leftBalanceBN.get()
        logInputsOutputs.leftBalanceAndChange = BlocksoftUtils.add(leftBalanceBN, tmpBN)
        logInputsOutputs.sendBalance = sendBalanceBN.get()

        logInputsOutputs.data = JSON.parse(JSON.stringify(data))
        if (typeof data.feeForTx === 'undefined' || typeof data.feeForTx.feeForByte === 'undefined' || data.feeForTx.feeForByte < 0) {
            BlocksoftCryptoLog.log(title + ' preparedInputsOutputs with autofee ', logInputsOutputs)
        } else {
            BlocksoftCryptoLog.log(title + ' preparedInputsOutputs with fee ' + data.feeForTx.feeForTx, logInputsOutputs)
        }
        // console.log('btc_info ' + this._settings.currencyCode + ' ' + data.addressFrom  + ' => ' + data.addressTo, logInputsOutputs)
        // noinspection JSIgnoredPromiseFromCall
        MarketingEvent.logOnlyRealTime('v30_doge_info_' + settings.currencyCode, {
            ...logInputsOutputs,
            title : data.addressFrom + ' => ' + data.addressTo
        })
        return logInputsOutputs
    }
}
