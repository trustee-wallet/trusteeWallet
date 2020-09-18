/**
 * @version 0.5
 */
import BlocksoftUtils from '../../../common/BlocksoftUtils'
import BlocksoftCryptoLog from '../../../common/BlocksoftCryptoLog'
import BlocksoftBN from '../../../common/BlocksoftBN'

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
     * @param {string} data.multiply
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
        let feeForTx = 0
        let multiply = 0
        if (typeof data.feeForTx !== 'undefined' && typeof data.feeForTx.feeForTx !== 'undefined') {
            if (subtitle.indexOf('getFeeRate') === -1) {
                autocalculateFee = false
                feeForByte = data.feeForTx.feeForByte
            }
            feeForTx = data.feeForTx.feeForTx
        }
        if (typeof data.multiply !== 'undefined' && data.multiply * 1 > 0) {
            multiply = data.multiply * 1
            feeForByte = feeForByte * multiply
            feeForTx = feeForTx * multiply
        }

        let filteredUnspents = []
        const unconfirmedBN = new BlocksoftBN(0)
        let unspent
        if (useOnlyConfirmed) {
            for (unspent of precached.unspents) {
                if (unspent.confirmations > 0) {
                    filteredUnspents.push(unspent)
                } else {
                    unconfirmedBN.add(unspent.value)
                }
            }
        } else {
            filteredUnspents = precached.unspents
        }

        const totalBalanceBN = new BlocksoftBN(0)
        for (unspent of filteredUnspents) {
            totalBalanceBN.add(unspent.value)
        }


        let multiAddress = false
        const basicWishedAmountBN = new BlocksoftBN(data.amount)
        const wishedAmountBN = new BlocksoftBN(basicWishedAmountBN)

        const outputs = []
        let plus = 0
        if (data.addressTo.indexOf(';') === -1) {
            outputs.push({
                'to': data.addressTo,
                'amount': data.amount.toString()
            })
        } else {
            const addresses = data.addressTo.replace(/\s+/g, ';').split(';')
            multiAddress = []
            let total = 0
            for (let i = 0, ic = addresses.length; i < ic; i++) {
                const address = addresses[i].trim()
                if (!address) continue
                outputs.push({
                    'to': address,
                    'amount': data.amount.toString()
                })
                multiAddress.push(address)
                if (total > 0) {
                    wishedAmountBN.add(basicWishedAmountBN)
                    plus += data.amount * 1
                }
                total++
            }
            if (multiAddress.length <= 1) {
                multiAddress = false
            }
        }

        if (!autocalculateFee) {
            wishedAmountBN.add(feeForTx)
        }

        const ic = filteredUnspents.length
        let msg = 'totalInputs ' + ic + ' for wishedAmount ' + wishedAmountBN.get() + ' = ' + BlocksoftUtils.toUnified(wishedAmountBN.get(), this._settings.decimals)
        if (autocalculateFee) {
            msg += ' and autocalculate fee'
        } else {
            msg += ' and prefee ' + feeForTx + ' = ' + BlocksoftUtils.toUnified(feeForTx.toString(), this._settings.decimals)
        }
        if (multiply > 0) {
            msg += ' multy ' + multiply
        }

        const inputs = []
        const inputsBalanceBN = new BlocksoftBN(0)
        const leftBalanceBN = new BlocksoftBN(totalBalanceBN)


        let someUnusedOutput = false
        for (let i = 0; i < ic; i++) {
            if (!isTransferAll && BlocksoftUtils.diff(wishedAmountBN, inputsBalanceBN) * 1 < 0) {
                msg += ' finished by collectedAmount ' + inputsBalanceBN.get()
                break
            }

            const unspent = filteredUnspents[i]
            if (
                isTransferAll
                ||
                (BlocksoftUtils.add(BlocksoftUtils.diff(inputsBalanceBN, wishedAmountBN), unspent.value)*1 <= 0)
                ||
                (BlocksoftUtils.diff(BlocksoftUtils.diff(leftBalanceBN, wishedAmountBN), unspent.value)*1 < 0) // left of not included outputs will be less than needed
            ) {
                inputs.push(unspent)
                inputsBalanceBN.add(unspent.value)
                msg += ' ' + i + ') added ' + unspent.value + ' = ' + inputsBalanceBN
            } else {
                msg += ' ' + i + ') skipped ' + unspent.value
                leftBalanceBN.diff(unspent.value)
                if (unspent.value > this._minOutputToBeDusted) {
                    someUnusedOutput = unspent
                }
            }
        }

        const inputsMinusWishedBN = new BlocksoftBN(inputsBalanceBN).diff(wishedAmountBN)
        if (inputsMinusWishedBN.get() - this._minChangeThreshold > 0) {
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
                const change = Math.ceil(BlocksoftUtils.diff(BlocksoftUtils.diff(inputsBalanceBN, wishedAmountBN), fee) * 1)
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
                                    'amount': BlocksoftUtils.add(someUnusedOutput.value, change),
                                    'type': 'change'
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
                                'type': 'change'
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
                    data.feeForTx = { feeForTx: fee, feeForByte: feeForByte }
                    return this._tryToFind(data, size, precached, 'autofee 1.1 => fixed tryToFind')
                }
            } else {
                const change = inputsMinusWishedBN.get()
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
                                'amount': BlocksoftUtils.add(someUnusedOutput.value, change),
                                'type': 'change'
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
                            'type': 'change'
                        })
                        msg += ' change will be ' + change
                    }
                }
                msg += ' fee [1.2] will be ' + feeForTx
                data.feeForTx.feeForTx = feeForTx
                BlocksoftCryptoLog.log(this._settings.currencyCode + ' DogeTxInputsOutputs.getInputsOutputs ' + subtitle + ' 1.2 with change ' + change + ' ' + msg)
            }
        } else {
            msg += ' no outputs for change as ' + inputsMinusWishedBN.get() + '-' + this._minChangeThreshold + ' = ' + (inputsMinusWishedBN.get() - this._minChangeThreshold) + ' // '
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
                    outputs[0].amount = Math.ceil(BlocksoftUtils.diff(inputsBalanceBN, fee) * 1)
                    msg += ' TRANSFER_ALL '
                } else {
                    const leftAfterFee = Math.ceil(BlocksoftUtils.diff(inputsMinusWishedBN, fee) * 1)
                    if (leftAfterFee * 1 < 0 && subtitle.indexOf('tryToFind') === -1) {
                        BlocksoftCryptoLog.log(this._settings.currencyCode + ' DogeTxInputsOutputs.getInputsOutputs ' + subtitle + ' 2.1 with leftAfterAutoFee ' + leftAfterFee + ' ' + msg)
                        data.feeForTx = { feeForTx: fee, feeForByte: feeForByte }
                        return this._tryToFind(data, size, precached, 'autofee 2.1 => fixed tryToFind')
                    } else {
                        msg += ' 2.1 leftAfterAutoFee ' + leftAfterFee
                    }
                }
            } else {
                const change = inputsMinusWishedBN.get()
                if (change * 1 < 0) {
                    if (data.addressForChange === 'TRANSFER_ALL') {
                        outputs[0].amount = Math.ceil(BlocksoftUtils.diff(inputsBalanceBN, data.feeForTx.feeForTx) * 1)
                    } else {
                        let canWait = 0
                        let e
                        if (useOnlyConfirmed) {
                            canWait = BlocksoftUtils.add(unconfirmedBN, inputsMinusWishedBN)
                        }
                        if (canWait > 0) {
                            BlocksoftCryptoLog.log(this._settings.currencyCode + ' BtcTxInputsOutputs.getInputsOutputs ' + subtitle + ' 2.2.1 with leftSmallChange ' + change + ' ' + msg + ' canWait ' + canWait)
                            if (data.walletUseUnconfirmed) {
                                return this.getInputsOutputs(data, precached, 'unconfirmed 2')
                            } else {
                                e = new Error('SERVER_RESPONSE_WAIT_FOR_CONFIRM')
                            }
                        } else {
                            BlocksoftCryptoLog.log('fee', { fromData: data.feeForTx.feeForTx, current: feeForTx })
                            BlocksoftCryptoLog.log(this._settings.currencyCode + ' BtcTxInputsOutputs.getInputsOutputs ' + subtitle + ' 2.2.2 with leftSmallChange ' + change + ' ' + msg + ' canWait ' + canWait)
                            if (feeForTx >= -1 * change) {
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
                msg += ' fees started ' + feeForTx
                data.feeForTx.feeForTx = feeForTx
            }
        }

        BlocksoftCryptoLog.log(this._settings.currencyCode + ' DogeTxInputsOutputs.getInputsOutputs ' + subtitle + ' ' + msg)
        if (outputs[0].amount < 0) {
            let canWait = 0
            if (useOnlyConfirmed) {
                canWait = unconfirmedBN.get()
            }
            if (canWait * 1 > 0) {
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
            correctedAmountFrom: outputs[0].amount * 1 + plus,
            feeForByte,
            msg,
            multiAddress,
            multiply
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
