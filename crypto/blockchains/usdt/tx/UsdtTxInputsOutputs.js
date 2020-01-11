/**
 * @version 0.5
 */
import BlocksoftUtils from '../../../common/BlocksoftUtils'
import BlocksoftCryptoLog from '../../../common/BlocksoftCryptoLog'


const DUST_FIRST_TRY = 546
const DUST_SECOND_TRY = 600

export default class UsdtTxInputsOutputs {
    /**
     *
     * @param settings
     */
    constructor(settings) {
        this._settings = settings
    }

    /**
     * @type {number}
     * @private
     */
    _minFee = 1000

    /**
     * @param {string} data.addressFrom
     * @param {string} data.addressTo
     * @param {string|number} data.amount
     * @param {string|boolean} data.addressForChange
     * @param {string|number} data.feeForTx.feeForTx
     * @param {string|number} data.feeForTx.feeForByte
     * @param {string} precached.blocks_2
     * @param {UnifiedUnspent[]} precached.unspents
     * @param {string} subtitle
     * @returns {{outputs: [], inputs: [], correctedAmountFrom: string, feeForByte: (number|string)}}
     */
    getInputsOutputs(data, precached, subtitle) {
        if (typeof data.privateKey === 'undefined') {
            throw new Error('UsdtTxInputsOutputs.getInputsOutputs requires privateKey')
        }
        if (typeof data.addressFrom === 'undefined') {
            throw new Error('UsdtTxInputsOutputs.getInputsOutputs requires addressFrom')
        }
        if (typeof data.addressTo === 'undefined') {
            throw new Error('UsdtTxInputsOutputs.getInputsOutputs requires addressTo')
        }
        if (typeof data.amount === 'undefined') {
            throw new Error('UsdtTxInputsOutputs.getInputsOutputs requires amount')
        }
        let addressForChange = (typeof data.addressForChange != 'undefined' && data.addressForChange !== 'TRANSFER_ALL' && data.addressForChange) ? data.addressForChange : data.addressFrom
        let useOnlyConfirmed = true //take from DB
        let autocalculateFee = true
        let feeForByte = precached.blocks_2
        if (typeof data.feeForTx !== 'undefined' && typeof data.feeForTx.feeForTx !== 'undefined') {
            autocalculateFee = false
            feeForByte = data.feeForTx.feeForByte
        }

        let filteredUnspents = []
        let uncomfirmedInputs = 0
        if (useOnlyConfirmed) {
            for (let unspent of precached.unspents) {
                if (unspent.confirmations > 0) {
                    filteredUnspents.push(unspent)
                } else {
                    uncomfirmedInputs++
                }
            }
        } else {
            filteredUnspents = precached.unspents
        }

        let totalBalanceBN = BlocksoftUtils.toBigNumber(0)
        for (let unspent of filteredUnspents) {
            totalBalanceBN = totalBalanceBN.add(unspent.valueBN)
        }
        let basicWishedAmountBN = BlocksoftUtils.toBigNumber(DUST_FIRST_TRY)
        let wishedAmountBN = basicWishedAmountBN

        let outputs = [{
            'to': data.addressTo,
            'amount': '0',
            'usdt': data.amount.toString()
        }, {
            'to': data.addressTo,
            'amount': (DUST_FIRST_TRY).toString()
        }]

        let correctedAmountFrom = wishedAmountBN.toString()

        if (!autocalculateFee) {
            wishedAmountBN = wishedAmountBN.add(BlocksoftUtils.toBigNumber(data.feeForTx.feeForTx))
        }

        let ic = filteredUnspents.length
        let msg = 'totalInputs ' + ic + ' for wishedAmount ' + wishedAmountBN.toString() + ' = ' + BlocksoftUtils.toUnified(wishedAmountBN.toString(), this._settings.decimals)

        let inputs = []
        let inputsBalanceBN = BlocksoftUtils.toBigNumber(0)
        let foundOnlyOne = false
        let wishedAmountForOneBN = wishedAmountBN
        if (autocalculateFee) {
            wishedAmountForOneBN = wishedAmountForOneBN.add(BlocksoftUtils.toBigNumber(precached.blocks_2 * 128))
        }
        for (let i = 0; i < ic; i++) {

            let unspent = filteredUnspents[i]
            if (
                inputsBalanceBN.sub(wishedAmountForOneBN) < 1000
            ) {
                inputs.push(unspent)
                inputsBalanceBN = inputsBalanceBN.add(unspent.valueBN)
                msg += ' ' + i + ') added as only one ' + unspent.value + ' for ' + wishedAmountForOneBN
                foundOnlyOne = true
            }
        }

        if (!foundOnlyOne) {
            let leftBalanceBN = totalBalanceBN
            for (let i = 0; i < ic; i++) {
                if (wishedAmountBN.sub(inputsBalanceBN) < 0) {
                    msg += ' finished by collectedAmount ' + inputsBalanceBN.toString()
                    break
                }

                let unspent = filteredUnspents[i]
                if (
                    (inputsBalanceBN.add(unspent.valueBN).sub(wishedAmountBN) <= 0)
                    ||
                    (leftBalanceBN.sub(unspent.valueBN).sub(wishedAmountBN) < 0) // left of not included outputs will be less than needed
                ) {
                    inputs.push(unspent)
                    inputsBalanceBN = inputsBalanceBN.add(unspent.valueBN)
                    msg += ' ' + i + ') added ' + unspent.value + ' = ' + inputsBalanceBN
                } else {
                    msg += ' ' + i + ') skipped ' + unspent.value
                    leftBalanceBN = leftBalanceBN.sub(unspent.valueBN)
                }
            }
        }

        let inputsMinusWishedBN = inputsBalanceBN.sub(wishedAmountBN)
        if (inputsMinusWishedBN > 10000) {
            if (autocalculateFee) {
                let size = 257
                let sizeMsg = ' basic 257'
                size += 40
                sizeMsg += ' +40 for change'
                size += 150 * (inputs.length - 1)
                sizeMsg += ' +150*' + (inputs.length - 1)
                let fee = precached.blocks_2 * size / 2
                if (fee < this._minFee) {
                    fee = this._minFee
                }
                let change = inputsBalanceBN.sub(wishedAmountBN).sub(BlocksoftUtils.toBigNumber(fee)).toString()
                if (change > 10000) {
                    outputs.push({
                        'to': addressForChange,
                        'amount': change
                    })
                    msg += ' change will be ' + change
                    msg += ' fee will be ' + fee
                    msg += ' feeAutoCalculate: size' + sizeMsg + ' = ' + size + ' bytes = ' + fee + ' satoshi '
                } else {
                    msg += ' fee will be ' + (fee + change)
                    msg += ' feeAutoCalculate: size' + sizeMsg + ' = ' + size + ' bytes = ' + fee + ' satoshi '
                }
                if (change < 0) {
                    BlocksoftCryptoLog.log(this._settings.currencyCode + ' UsdtTxInputsOutputs.getInputsOutputs ' + subtitle + ' 1.1 with leftChange ' + change + ' ' + msg)
                    data.feeForTx = { feeForTx: fee, feeForByte: feeForByte }
                    return this._tryToFind(data, size, precached, 'autofee 1.1 => fixed' )
                }
            } else {
                let change = inputsMinusWishedBN.toString()
                outputs.push({
                    'to': addressForChange,
                    'amount': change
                })
                msg += ' change will be ' + change
                msg += ' fee will be ' + data.feeForTx.feeForTx
                BlocksoftCryptoLog.log(this._settings.currencyCode + ' UsdtTxInputsOutputs.getInputsOutputs ' + subtitle + ' 1.2 with change ' + change + ' ' + msg)
            }
        } else {
            if (autocalculateFee) {
                let size = 257
                let sizeMsg = ' basic 257'
                size += 150 * (inputs.length - 1)
                sizeMsg += ' +150*' + (inputs.length - 1)
                let fee = feeForByte * size / 2
                if (fee < this._minFee) {
                    fee = this._minFee
                }
                msg += ' fee will be ' + fee
                msg += ' feeAutoCalculate: size' + sizeMsg + ' = ' + size + ' bytes = ' + fee + ' satoshi '

                let leftAfterFee = inputsMinusWishedBN.sub(BlocksoftUtils.toBigNumber(fee))
                let minusLimit = -1 * Math.round(fee / 5) //20 %
                if (leftAfterFee < minusLimit || leftAfterFee > 10000) {
                    BlocksoftCryptoLog.log(this._settings.currencyCode + ' UsdtTxInputsOutputs.getInputsOutputs ' + subtitle + ' 2.1 with inputsBalanceBN ' + inputsBalanceBN + ' minusLimit ' + minusLimit + ' leftAfterAutoFee ' + leftAfterFee + ' ' + msg)
                    data.feeForTx = { feeForTx: fee, feeForByte: feeForByte }
                    return this._tryToFind(data, size, precached, 'autofee 2.1 => fixed' )
                }
            } else {
                let change = inputsMinusWishedBN.toString()
                let fee = data.feeForTx.feeForTx
                let leftAfterFee = inputsMinusWishedBN.sub(BlocksoftUtils.toBigNumber(fee))
                let minusLimit = -1 * Math.round(fee / 5) //20 %
                if (leftAfterFee < minusLimit || leftAfterFee > 10000) {
                    BlocksoftCryptoLog.log(this._settings.currencyCode + ' UsdtTxInputsOutputs.getInputsOutputs ' + subtitle + ' 2.2 with inputsBalanceBN ' + inputsBalanceBN + ' minusLimit ' + minusLimit + ' leftAfterFee ' + leftAfterFee + ' ' + msg)
                    if (uncomfirmedInputs > 0) {
                        let e = new Error('SERVER_RESPONSE_NOT_ENOUGH_CONFIRMED_FEE')
                        e.code = 'ERROR_USER'
                        throw e
                    } else {
                        let e = new Error('SERVER_RESPONSE_NOT_ENOUGH_FEE')
                        e.code = 'ERROR_USER'
                        throw e
                    }
                }

                msg += ' fees will be ' + change
                msg += ' fees started ' + data.feeForTx.feeForTx
            }
        }

        BlocksoftCryptoLog.log(this._settings.currencyCode + ' UsdtTxInputsOutputs.getInputsOutputs ' + subtitle + ' ' + msg)
        if (outputs[0].amount < 0) {
            let e = new Error('SERVER_RESPONSE_NOT_ENOUGH_FEE')
            e.code = 'ERROR_USER'
            throw e
        }
        return {
            inputs,
            outputs,
            correctedAmountFrom,
            feeForByte
        }
    }
}
