/**
 * @version 0.5
 */
import BlocksoftUtils from '../../../common/BlocksoftUtils'
import BlocksoftCryptoLog from '../../../common/BlocksoftCryptoLog'

export default class DogeTxInputsOutputs {

    /**
     * @param {int} settings.decimals
     * @param {int} inputsOutputsSettings.minFee
     * @param {int} inputsOutputsSettings.minChangeThresholdReadable
     * @param {int} inputsOutputsSettings.minOutputToBeDustedReadable
     */
    constructor(settings, inputsOutputsSettings) {
        this._settings = settings
        this._minFee = inputsOutputsSettings.minFee // minimal autocalculated fee in satoshis, if less - make this fee
        this._minChangeThreshold = BlocksoftUtils.fromUnified(inputsOutputsSettings.minChangeThresholdReadable, settings.decimals)  // inputs-wished minimal threshold that will be considered as "needed for change output"
        this._minOutputToBeDusted = BlocksoftUtils.fromUnified(inputsOutputsSettings.minOutputToBeDustedReadable, settings.decimals)  // output amout that will be considered as "dust" so we dont need it
    }

    /**
     * @param {Object} data
     * @param {string} data.walletUseUnconfirmed
     * @param {string} data.addressFrom
     * @param {string} data.addressTo
     * @param {string|number} data.amount
     * @param {string|boolean} data.addressForChange
     * @param {string|number} data.feeForTx.feeForTx
     * @param {string|number} data.feeForTx.feeForByte
     * @param {Object} precached
     * @param {string} precached.blocks_2
     * @param {UnifiedUnspent[]} precached.unspents
     * @param {string} subtitle
     * @returns {{outputs: [], inputs: [], correctedAmountFrom: string, feeForByte: (number|string), msg: string}}
     */
    getInputsOutputs(data, precached, subtitle) {
        if (typeof data.addressFrom === 'undefined') {
            throw new Error('DogeTxInputsOutputs.getInputsOutputs requires addressFrom')
        }
        if (typeof data.addressTo === 'undefined') {
            throw new Error('DogeTxInputsOutputs.getInputsOutputs requires addressTo')
        }
        if (typeof data.amount === 'undefined') {
            throw new Error('DogeTxInputsOutputs.getInputsOutputs requires amount')
        }
        let addressForChange = data.addressFrom
        let isTransferAll = false
        if (typeof data.addressForChange !== 'undefined' && data.addressForChange) {
            if (data.addressForChange === 'TRANSFER_ALL') {
                isTransferAll = true
            } else {
                addressForChange = data.addressForChange
            }
        }
        const useOnlyConfirmed = !data.walletUseUnconfirmed || subtitle.indexOf('unconfirmed') === -1
        let autocalculateFee = true
        let feeForByte = precached.blocks_2
        if (subtitle.indexOf('getFeeRate') === -1 && typeof data.feeForTx !== 'undefined' && typeof data.feeForTx.feeForTx !== 'undefined') {
            autocalculateFee = false
            feeForByte = data.feeForTx.feeForByte
        }

        let filteredUnspents = []
        let unconfirmedBN = BlocksoftUtils.toBigNumber(0)
        let unspent
        if (useOnlyConfirmed) {
            for (unspent of precached.unspents) {
                if (unspent.confirmations > 0) {
                    filteredUnspents.push(unspent)
                } else {
                    unconfirmedBN = unconfirmedBN.add(unspent.valueBN)
                }
            }
        } else {
            filteredUnspents = precached.unspents
        }

        let totalBalanceBN = BlocksoftUtils.toBigNumber(0)
        for (unspent of filteredUnspents) {
            totalBalanceBN = totalBalanceBN.add(unspent.valueBN)
        }


        const basicWishedAmountBN = BlocksoftUtils.toBigNumber(data.amount)
        let wishedAmountBN = basicWishedAmountBN

        const outputs = []
        if (data.addressTo.indexOf(';') === -1) {
            outputs.push({
                'to': data.addressTo,
                'amount': data.amount.toString()
            })
        } else {
            const addresses = data.addressTo.split(';')
            for (let i = 0, ic = addresses.length; i < ic; i++) {
                const address = addresses[i].trim()
                outputs.push({
                    'to': address,
                    'amount': data.amount.toString()
                })
                if (i > 0) {
                    wishedAmountBN = wishedAmountBN.add(basicWishedAmountBN)
                }
                i++
            }
        }
        let correctedAmountFrom = wishedAmountBN.toString()

        if (!autocalculateFee) {
            wishedAmountBN = wishedAmountBN.add(BlocksoftUtils.toBigNumber(data.feeForTx.feeForTx))
        }

        const ic = filteredUnspents.length
        let msg = 'totalInputs ' + ic + ' for wishedAmount ' + wishedAmountBN.toString() + ' = ' + BlocksoftUtils.toUnified(wishedAmountBN.toString(), this._settings.decimals)
        if (autocalculateFee) {
            msg += ' and autocalculate fee'
        } else {
            msg += ' and fee ' + data.feeForTx.feeForTx + ' = ' + BlocksoftUtils.toUnified(data.feeForTx.feeForTx.toString(), this._settings.decimals)
        }

        const inputs = []
        let inputsBalanceBN = BlocksoftUtils.toBigNumber(0)
        let leftBalanceBN = totalBalanceBN


        let someUnusedOutput = false
        for (let i = 0; i < ic; i++) {
            if (!isTransferAll && wishedAmountBN.sub(inputsBalanceBN) < 0) {
                msg += ' finished by collectedAmount ' + inputsBalanceBN.toString()
                break
            }

            const unspent = filteredUnspents[i]
            if (
                isTransferAll
                ||
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
                if (unspent.value > this._minOutputToBeDusted) {
                    someUnusedOutput = unspent
                }
            }
        }

        const inputsMinusWishedBN = inputsBalanceBN.sub(wishedAmountBN)
        if (inputsMinusWishedBN.toString() - this._minChangeThreshold > 0) {
            if (autocalculateFee) {
                let size = 192
                let sizeMsg = ' basic 192'
                size += 40
                sizeMsg += ' +40 for change'
                size += 150 * (inputs.length - 1)
                sizeMsg += ' +150*' + (inputs.length - 1)
                let fee = precached.blocks_2 * size / 2
                if (fee < this._minFee) {
                    fee = this._minFee
                }
                const changeBN = inputsBalanceBN.sub(wishedAmountBN).sub(BlocksoftUtils.toBigNumber(fee))
                const change = changeBN.toString()
                if (change - this._minChangeThreshold > 0) {
                    if (addressForChange === outputs[0].to) {
                        if (outputs[0].amount * 1 > 0) {
                            outputs[0].amount = outputs[0].amount * 1 + change * 1
                        } else {
                            outputs[0].amount = change * 1
                        }
                        msg += ' change is added to first output '
                    } else {
                        if (change - this._minOutputToBeDusted < 0) {
                            if (someUnusedOutput) {
                                outputs.push({
                                    'to': addressForChange,
                                    'amount': someUnusedOutput.valueBN.add(changeBN).toString(),
                                    'type' : 'change'
                                })
                                inputs.push(someUnusedOutput)
                                msg += ' change will be ' + change + ' + one input ' + someUnusedOutput.value
                            } else {
                                msg += ' change will go also to the fee as no more inputs to use  (min dusted = ' + this._minOutputToBeDusted + ' = ' + BlocksoftUtils.toUnified(this._minOutputToBeDusted, this._settings.decimals) + ')'
                            }
                        } else {
                            outputs.push({
                                'to': addressForChange,
                                'amount': change,
                                'type' : 'change'
                            })
                            msg += ' change will be ' + change
                        }
                    }
                    msg += ' fee [1.1.1] will be ' + fee
                    msg += ' feeAutoCalculate: size' + sizeMsg + ' = ' + size + ' bytes = ' + fee + ' satoshi '
                } else {
                    msg += ' fee [1.1.2] will be ' + (fee + change)
                    msg += ' feeAutoCalculate: size' + sizeMsg + ' = ' + size + ' bytes = ' + fee + ' satoshi '
                }
                if (change < 0 && subtitle.indexOf('tryToFind') === -1) {
                    BlocksoftCryptoLog.log(this._settings.currencyCode + ' DogeTxInputsOutputs.getInputsOutputs ' + subtitle + ' 1.1 with leftChange ' + change + ' ' + msg)
                    data.feeForTx = {feeForTx : fee, feeForByte : feeForByte}
                    return this._tryToFind(data, size, precached, 'autofee 1.1 => fixed tryToFind' )
                }
            } else {
                const changeBN = inputsMinusWishedBN
                const change = inputsMinusWishedBN.toString()
                if (addressForChange === outputs[0].to) {
                    if (outputs[0].amount * 1 > 0) {
                        outputs[0].amount = outputs[0].amount * 1 + change * 1
                    } else {
                        outputs[0].amount = change * 1
                    }
                    msg += ' change is added to first output '
                } else {
                    if (change - this._minOutputToBeDusted < 0) {
                        if (someUnusedOutput) {
                            outputs.push({
                                'to': addressForChange,
                                'amount': someUnusedOutput.valueBN.add(changeBN).toString(),
                                'type' : 'change'
                            })
                            inputs.push(someUnusedOutput)
                            msg += ' change will be ' + change + ' + one input ' + someUnusedOutput.value
                        } else {
                            msg += ' change will go also to the fee as no more inputs to use'
                        }
                    } else {
                        outputs.push({
                            'to': addressForChange,
                            'amount': change,
                            'type' : 'change'
                        })
                        msg += ' change will be ' + change
                    }
                }
                msg += ' fee [1.2] will be ' + data.feeForTx.feeForTx
                BlocksoftCryptoLog.log(this._settings.currencyCode + ' DogeTxInputsOutputs.getInputsOutputs ' + subtitle + ' 1.2 with change ' + change + ' ' + msg)
            }
        } else {
            msg += ' no outputs for change as ' + inputsMinusWishedBN.toString() + '-' + this._minChangeThreshold + ' = ' + (inputsMinusWishedBN.toString() - this._minChangeThreshold) + ' // '
            if (autocalculateFee) {
                let size = 192
                let sizeMsg = ' basic 192'
                size += 150 * (inputs.length - 1)
                sizeMsg += ' +150*' + (inputs.length - 1)
                let fee = feeForByte * size / 2
                if (fee < this._minFee) {
                    fee = this._minFee
                }
                msg += ' fee [2.1] will be ' + fee
                msg += ' feeAutoCalculate: size' + sizeMsg + ' = ' + size + ' bytes = ' + fee + ' satoshi '
                if (data.addressForChange === 'TRANSFER_ALL') {
                    outputs[0].amount = inputsBalanceBN.sub(BlocksoftUtils.toBigNumber(fee)).toString()
                    correctedAmountFrom = outputs[0].amount
                    msg += ' TRANSFER_ALL '
                } else {
                    const leftAfterFee = inputsMinusWishedBN.sub(BlocksoftUtils.toBigNumber(fee))
                    if (leftAfterFee < 0 && subtitle.indexOf('tryToFind') === -1) {
                        BlocksoftCryptoLog.log(this._settings.currencyCode + ' DogeTxInputsOutputs.getInputsOutputs ' + subtitle + ' 2.1 with leftAfterAutoFee ' + leftAfterFee + ' ' + msg)
                        data.feeForTx = {feeForTx : fee, feeForByte : feeForByte}
                        return this._tryToFind(data, size, precached, 'autofee 2.1 => fixed tryToFind' )
                    } else {
                        msg += ' 2.1 leftAfterAutoFee ' + leftAfterFee
                    }
                }
            } else {
                const change = inputsMinusWishedBN.toString()
                if (change < 0) {
                    if (data.addressForChange === 'TRANSFER_ALL') {
                        outputs[0].amount = inputsBalanceBN.sub(BlocksoftUtils.toBigNumber(data.feeForTx.feeForTx)).toString()
                    } else {
                        let canWait = 0
                        let e
                        if (useOnlyConfirmed) canWait = unconfirmedBN.add(inputsMinusWishedBN).toString()
                        if (canWait > 0) {
                            BlocksoftCryptoLog.log(this._settings.currencyCode + ' BtcTxInputsOutputs.getInputsOutputs ' + subtitle + ' 2.2.1 with leftSmallChange ' + change + ' ' + msg + ' canWait ' + canWait)
                            if (data.walletUseUnconfirmed) {
                                return this.getInputsOutputs(data, precached, 'unconfirmed 2')
                            } else {
                                e = new Error('SERVER_RESPONSE_WAIT_FOR_CONFIRM')
                            }
                        } else {
                            BlocksoftCryptoLog.log('fee', data.feeForTx.feeForTx)
                            BlocksoftCryptoLog.log(this._settings.currencyCode + ' BtcTxInputsOutputs.getInputsOutputs ' + subtitle + ' 2.2.2 with leftSmallChange ' + change + ' ' + msg + ' canWait ' + canWait)
                            if (data.feeForTx.feeForTx >= -1 * change) {
                                e = new Error('SERVER_RESPONSE_NOTHING_LEFT_FOR_FEE')
                            } else {
                                e = new Error('SERVER_RESPONSE_NOTHING_TO_TRANSFER')
                            }

                        }
                        e.code = 'ERROR_USER'
                        throw e
                    }
                }
                msg += ' fees [2.2] will be ' + change
                msg += ' fees started ' + data.feeForTx.feeForTx
            }
        }

        BlocksoftCryptoLog.log(this._settings.currencyCode + ' DogeTxInputsOutputs.getInputsOutputs ' + subtitle + ' ' + msg)
        if (outputs[0].amount < 0) {
            let canWait = 0
            if (useOnlyConfirmed) canWait = unconfirmedBN.toString()
            if (canWait > 0) {
                if (data.walletUseUnconfirmed) {
                    return this.getInputsOutputs(data, precached, 'unconfirmed 3')
                } else {
                    const e = new Error('SERVER_RESPONSE_WAIT_FOR_CONFIRM')
                    e.code = 'ERROR_USER'
                    throw e
                }
            } else {
                const e = new Error('SERVER_RESPONSE_NOT_ENOUGH_AMOUNT_FOR_ANY_FEE')
                e.code = 'ERROR_USER'
                throw e
            }
        }
        return {
            inputs,
            outputs,
            correctedAmountFrom,
            feeForByte,
            msg
        }
    }

    _tryToFind(data, size, precached, subtitle) {

        let tryToFind
        let error = false

        try {
            tryToFind = this.getInputsOutputs(data, precached, subtitle)
        } catch (e) {
            error = e
        }

        if (!tryToFind) {
            const fee = precached.blocks_6 * size / 2
            data.feeForTx = { feeForTx: fee, feeForByte: precached.blocks_6 }
            try {
                tryToFind = this.getInputsOutputs(data, precached, subtitle)
            } catch (e) {
                error = e
            }
        }


        if (!tryToFind) {
            const fee = precached.blocks_12 * size / 2
            data.feeForTx = { feeForTx: fee, feeForByte: precached.blocks_12 }
            try {
                tryToFind = this.getInputsOutputs(data, precached, subtitle)
            } catch (e) {
                error = e
            }
        }

        if (!tryToFind) {
            const fee = 1 * size
            data.feeForTx = { feeForTx: fee, feeForByte: 1 }
            try {
                tryToFind = this.getInputsOutputs(data, precached, subtitle)
            } catch (e) {
                error = e
            }
        }

        if (!tryToFind) {
            if (error) {
                throw error
            } else {
                const e = new Error('SERVER_RESPONSE_NOT_ENOUGH_AMOUNT_FOR_ANY_FEE')
                e.code = 'ERROR_USER'
                throw e
            }
        }

        return tryToFind
    }
}
