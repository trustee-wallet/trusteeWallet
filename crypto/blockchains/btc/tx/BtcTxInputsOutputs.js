/**
 * @version 0.5
 */
import BlocksoftUtils from '../../../common/BlocksoftUtils'
import BlocksoftCryptoLog from '../../../common/BlocksoftCryptoLog'

export default class BtcTxInputsOutputs {
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
            throw new Error('BtcTxInputsOutputs.getInputsOutputs requires privateKey')
        }
        if (typeof data.addressFrom === 'undefined') {
            throw new Error('BtcTxInputsOutputs.getInputsOutputs requires addressFrom')
        }
        if (typeof data.addressTo === 'undefined') {
            throw new Error('BtcTxInputsOutputs.getInputsOutputs requires addressTo')
        }
        if (typeof data.amount === 'undefined') {
            throw new Error('BtcTxInputsOutputs.getInputsOutputs requires amount')
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
        let unconfirmedBN = BlocksoftUtils.toBigNumber(0)
        if (useOnlyConfirmed) {
            for (let unspent of precached.unspents) {
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
        for (let unspent of filteredUnspents) {
            totalBalanceBN = totalBalanceBN.add(unspent.valueBN)
        }


        let basicWishedAmountBN = BlocksoftUtils.toBigNumber(data.amount)
        let wishedAmountBN = basicWishedAmountBN

        let outputs = []
        if (data.addressTo.indexOf(';') === -1) {
            outputs.push({
                'to': data.addressTo,
                'amount': data.amount.toString()
            })
        } else {
            let addresses = data.addressTo.split(';')
            let index = 0
            for (let address of addresses) {
                address = address.trim()
                outputs.push({
                    'to': address,
                    'amount': data.amount.toString()
                })
                if (index > 0) {
                    wishedAmountBN = wishedAmountBN.add(basicWishedAmountBN)
                }
                index++
            }
        }
        let correctedAmountFrom = wishedAmountBN.toString()

        if (!autocalculateFee) {
            wishedAmountBN = wishedAmountBN.add(BlocksoftUtils.toBigNumber(data.feeForTx.feeForTx))
        }

        let ic = filteredUnspents.length
        let msg = 'totalInputs ' + ic + ' for wishedAmount ' + wishedAmountBN.toString() + ' = ' + BlocksoftUtils.toUnified(wishedAmountBN.toString(), this._settings.decimals)

        let inputs = []
        let inputsBalanceBN = BlocksoftUtils.toBigNumber(0)
        let leftBalanceBN = totalBalanceBN


        for (let i = 0; i < ic; i++) {
            if (data.addressForChange !== 'TRANSFER_ALL' && wishedAmountBN.sub(inputsBalanceBN) < 0) {
                msg += ' finished by collectedAmount ' + inputsBalanceBN.toString()
                break
            }

            let unspent = filteredUnspents[i]
            if (
                data.addressForChange === 'TRANSFER_ALL'
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
            }
        }

        let inputsMinusWishedBN = inputsBalanceBN.sub(wishedAmountBN)
        if (inputsMinusWishedBN > 10000) {
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
                let change = inputsBalanceBN.sub(wishedAmountBN).sub(BlocksoftUtils.toBigNumber(fee)).toString()
                if (change > 10000) {
                    outputs.push({
                        'to':  addressForChange,
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
                    BlocksoftCryptoLog.log(this._settings.currencyCode + ' BtcTxInputsOutputs.getInputsOutputs ' + subtitle + ' with leftChange ' + change + ' ' + msg)
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
                BlocksoftCryptoLog.log(this._settings.currencyCode + ' BtcTxInputsOutputs.getInputsOutputs ' + subtitle + ' 1.2 with change ' + change + ' ' + msg)
            }
        } else {
            if (autocalculateFee) {
                let size = 192
                let sizeMsg = ' basic 192'
                size += 150 * (inputs.length - 1)
                sizeMsg += ' +150*' + (inputs.length - 1)
                let fee = feeForByte * size / 2
                if (fee < this._minFee) {
                    fee = this._minFee
                }
                msg += ' fee will be ' + fee
                msg += ' feeAutoCalculate: size' + sizeMsg + ' = ' + size + ' bytes = ' + fee + ' satoshi '
                if (data.addressForChange === 'TRANSFER_ALL') {
                    outputs[0].amount = inputsBalanceBN.sub(BlocksoftUtils.toBigNumber(fee)).toString()
                    correctedAmountFrom = outputs[0].amount
                } else {
                    let leftAfterFee = inputsMinusWishedBN.sub(BlocksoftUtils.toBigNumber(fee))
                    if (leftAfterFee < 0) {
                        BlocksoftCryptoLog.log(this._settings.currencyCode + ' BtcTxInputsOutputs.getInputsOutputs ' + subtitle + ' 2.1 with leftAfterAutoFee ' + leftAfterFee + ' ' + msg)
                        data.feeForTx = { feeForTx: fee, feeForByte: feeForByte }
                        return this._tryToFind(data, size, precached, 'autofee 2.1 => fixed' )
                    }
                }
            } else {
                let change = inputsMinusWishedBN.toString()
                if (change < 0) {
                    if (data.addressForChange === 'TRANSFER_ALL') {
                        outputs[0].amount = inputsBalanceBN.sub(BlocksoftUtils.toBigNumber(data.feeForTx.feeForTx)).toString()
                    } else {
                        let canWait = 0
                        if (useOnlyConfirmed) canWait = unconfirmedBN.add(inputsMinusWishedBN).toString()
                        if (canWait > 0) {
                            BlocksoftCryptoLog.log(this._settings.currencyCode + ' BtcTxInputsOutputs.getInputsOutputs ' + subtitle + ' 2.2.1 with leftSmallChange ' + change + ' ' + msg + ' canWait ' + canWait)
                            let e = new Error( 'SERVER_RESPONSE_WAIT_FOR_CONFIRM')
                            e.code = 'ERROR_USER'
                            throw e
                        } else {
                            BlocksoftCryptoLog.log(this._settings.currencyCode + ' BtcTxInputsOutputs.getInputsOutputs ' + subtitle + ' 2.2.2 with leftSmallChange ' + change + ' ' + msg + ' canWait ' + canWait)
                            let e = new Error('SERVER_RESPONSE_NOTHING_TO_TRANSFER')
                            e.code = 'ERROR_USER'
                            throw e
                        }

                    }
                }
                msg += ' fees will be ' + change
                msg += ' fees started ' + data.feeForTx.feeForTx
            }
        }

        BlocksoftCryptoLog.log(this._settings.currencyCode + ' BtcTxInputsOutputs.getInputsOutputs ' + subtitle + ' ' + msg)

        if (outputs[0].amount < 0) {
            let e = new Error('SERVER_RESPONSE_NOT_ENOUGH_AMOUNT_FOR_ANY_FEE')
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

    _tryToFind(data, size, precached, subtitle) {
        let tryToFind
        let error = false

        try {
            tryToFind = this.getInputsOutputs(data, precached, subtitle)
        } catch (e) {
            error = e
        }

        if (!tryToFind) {
            let fee = precached.blocks_6 * size / 2
            data.feeForTx = { feeForTx: fee, feeForByte: precached.blocks_6 }
            try {
                tryToFind = this.getInputsOutputs(data, precached, subtitle)
            } catch (e) {
                error = e
            }
        }


        if (!tryToFind && data.amount < 1000) {
            let fee = precached.blocks_12 * size / 2
            data.feeForTx = { feeForTx: fee, feeForByte: precached.blocks_12 }
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
                let e = new Error('SERVER_RESPONSE_NOT_ENOUGH_AMOUNT_FOR_ANY_FEE')
                e.code = 'ERROR_USER'
                throw e
            }
        }

        return tryToFind
    }
}
