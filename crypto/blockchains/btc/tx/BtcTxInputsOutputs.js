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
     * minimal autocalculated fee in satoshis, if less - make this fee
     * @type {number}
     * @private
     */
    _minFee = 1000

    /**
     * inputs-wished minimal threshold that will be considered as "needed for change output"
     * @type {number}
     * @private
     */
    _minChangeThreshold = 10000

    /**
     * @param {Object} data
     * @param {string} data.walletUseUnconfirmed
     * @param {string} data.walletUseLegacy
     * @param {string} data.addressFrom
     * @param {string} data.addressFromLegacy
     * @param {string} data.addressTo
     * @param {string|number} data.amount
     * @param {string|boolean} data.addressForChange
     * @param {string|boolean} data.addressForChangeHD.id
     * @param {string|boolean} data.addressForChangeHD.address
     * @param {string|number} data.feeForTx.feeForTx
     * @param {string|number} data.feeForTx.feeForByte
     * @param {Object} precached
     * @param {string} precached.blocks_2
     * @param {int} precached.usdtBalance
     * @param {UnifiedUnspent[]} precached.unspents
     * @param {string} subtitle
     * @returns {{outputs: [], inputs: [], correctedAmountFrom: string, feeForByte: (number|string), msg: string}}
     */
    getInputsOutputs(data, precached, subtitle) {
        if (typeof data.addressFrom === 'undefined') {
            throw new Error('BtcTxInputsOutputs.getInputsOutputs requires addressFrom')
        }
        if (typeof data.addressTo === 'undefined') {
            throw new Error('BtcTxInputsOutputs.getInputsOutputs requires addressTo')
        }
        if (typeof data.amount === 'undefined') {
            throw new Error('BtcTxInputsOutputs.getInputsOutputs requires amount')
        }

        let addressForChange = data.addressFrom
        if (data.walletUseLegacy > 0) {
            addressForChange = data.addressFromLegacy
        }
        let isTransferAll = false
        let skipAddress = false
        let usdtAddress = false
        if (typeof data.addressForChange !== 'undefined') {
            if (data.addressForChange === 'TRANSFER_ALL') {
                isTransferAll = true
            } else {
                if (typeof data.addressForChangeHD !== 'undefined' && data.addressForChangeHD) {
                    addressForChange = data.addressForChangeHD
                } else if (data.addressForChange) {
                    addressForChange = data.addressForChange
                }
            }
        } else {
            if (typeof data.addressForChangeHD !== 'undefined' && data.addressForChangeHD) {
                addressForChange = data.addressForChangeHD
            }
        }

        if (!(data.walletUseLegacy > 0) && !isTransferAll && precached.usdtBalance > 0 && data.addressFromLegacy !== data.addressTo) {
            usdtAddress = data.addressFromLegacy
            if (subtitle.indexOf('usdtnoskip') === -1) {
                skipAddress = data.addressFromLegacy
            }
        }

        const useOnlyConfirmed = !data.walletUseUnconfirmed || subtitle.indexOf('unconfirmed') === -1
        let autocalculateFee = true
        let feeForByte = precached.blocks_2
        if (subtitle.indexOf('getFeeRate') === -1 && typeof data.feeForTx !== 'undefined' && typeof data.feeForTx.feeForTx !== 'undefined') {
            autocalculateFee = false
            feeForByte = data.feeForTx.feeForByte
        }

        const filteredUnspents = []
        let unconfirmedBN = BlocksoftUtils.toBigNumber(0)
        let skippedBN = BlocksoftUtils.toBigNumber(0)
        let usdtInputsTotal = 0
        let unspent
        if (useOnlyConfirmed) {
            for (unspent of precached.unspents) {
                if (skipAddress && skipAddress === unspent.address) {
                    skippedBN = unconfirmedBN.add(unspent.valueBN)
                } else if (unspent.confirmations > 0) {
                    if (usdtAddress && usdtAddress === unspent.address) {
                        usdtInputsTotal++
                    }
                    filteredUnspents.push(unspent)
                } else {
                    unconfirmedBN = unconfirmedBN.add(unspent.valueBN)
                }
            }
        } else {
            for (unspent of precached.unspents) {
                if (skipAddress && skipAddress === unspent.address) {
                    skippedBN = unconfirmedBN.add(unspent.valueBN)
                } else {
                    if (usdtAddress && usdtAddress === unspent.address) {
                        usdtInputsTotal++
                    }
                    filteredUnspents.push(unspent)
                }
            }
        }

        let totalBalanceBN = BlocksoftUtils.toBigNumber(0)
        for (unspent of filteredUnspents) {
            totalBalanceBN = totalBalanceBN.add(unspent.valueBN)
        }

        let wishedAmountBN =  BlocksoftUtils.toBigNumber(data.amount)

        const outputs = []
        outputs.push({
            'to': data.addressTo,
            'amount': data.amount.toString()
        })
        let correctedAmountFrom = wishedAmountBN.toString()

        if (!autocalculateFee) {
            wishedAmountBN = wishedAmountBN.add(BlocksoftUtils.toBigNumber(data.feeForTx.feeForTx))
        }

        const ic = filteredUnspents.length
        let msg = 'totalInputs ' + ic + ' for wishedAmount ' + wishedAmountBN.toString() + ' = ' + BlocksoftUtils.toUnified(wishedAmountBN.toString(), this._settings.decimals)

        const inputs = []
        let inputsBalanceBN = BlocksoftUtils.toBigNumber(0)
        let leftBalanceBN = totalBalanceBN


        let usdtInputsUsed = 0
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
                if (usdtAddress && usdtAddress === unspent.address) {
                    usdtInputsUsed++
                }
                inputs.push(unspent)
                inputsBalanceBN = inputsBalanceBN.add(unspent.valueBN)
                msg += ' ' + i + ') added ' + unspent.value + ' = ' + inputsBalanceBN
            } else {
                msg += ' ' + i + ') skipped ' + unspent.value
                leftBalanceBN = leftBalanceBN.sub(unspent.valueBN)
            }
        }
        BlocksoftCryptoLog.log(this._settings.currencyCode + ' BtcTxInputsOutputs.getInputsOutputs ' + subtitle + ' usdtCheck ' + JSON.stringify({usdtAddress, usdtInputsTotal, usdtInputsUsed}))


        let inputsMinusWishedBN = inputsBalanceBN.sub(wishedAmountBN)

        let size = 192
        let usdtAmount = 0
        if (usdtAddress && usdtInputsUsed >= usdtInputsTotal) {
            usdtAmount = 546
            if (inputsMinusWishedBN.toString() - this._minChangeThreshold > 0) {
                usdtAmount = 1546
            }
            const usdtAmountBN = BlocksoftUtils.toBigNumber(usdtAmount + '')
            outputs.push({
                'to': data.addressFromLegacy,
                'amount': usdtAmount
            })
            wishedAmountBN = wishedAmountBN.add(usdtAmountBN)
            inputsMinusWishedBN = inputsMinusWishedBN.sub(usdtAmountBN)
            size += 40
        }

        if (inputsMinusWishedBN.toString() - this._minChangeThreshold > 0) {
            if (autocalculateFee) {
                let sizeMsg = ' basic ' + size
                size += 40
                sizeMsg += ' +40 for change'
                size += 150 * (inputs.length - 1)
                sizeMsg += ' +150*' + (inputs.length - 1)
                let fee = precached.blocks_2 * size / 2
                if (fee < this._minFee) {
                    fee = this._minFee
                }
                const change = inputsBalanceBN.sub(wishedAmountBN).sub(BlocksoftUtils.toBigNumber(fee)).toString()
                if (change - this._minChangeThreshold > 0) {
                    if (addressForChange === outputs[0].to) {
                        outputs[0].amount = outputs[0].amount * 1 + change * 1
                        msg += ' change1.1.1.1 is added to first output '
                    } else {
                        outputs.push({
                            'to': addressForChange,
                            'amount': change
                        })
                        msg += ' change1.1.1.2 will be ' + change
                    }
                    msg += ' fee [1.1.1] will be ' + fee
                    msg += ' feeAutoCalculate: size' + sizeMsg + ' = ' + size + ' bytes = ' + fee + ' satoshi '
                } else {
                    msg += ' fee [1.1.2] will be ' + (fee + change)
                    msg += ' feeAutoCalculate: size' + sizeMsg + ' = ' + size + ' bytes = ' + fee + ' satoshi '
                }
                if (change < 0 && subtitle.indexOf('tryToFind') === -1) {
                    BlocksoftCryptoLog.log(this._settings.currencyCode + ' BtcTxInputsOutputs.getInputsOutputs ' + subtitle + ' with leftChange ' + change + ' ' + msg)
                    return this._tryToFind(data, size, precached, 'autofee 1.1 => fixed tryToFind' )
                }
            } else {
                const change = inputsMinusWishedBN.toString()
                if (addressForChange === outputs[0].to) {
                    if (outputs[0].amount * 1 > 0) {
                        outputs[0].amount = outputs[0].amount * 1 + change * 1
                    } else {
                        outputs[0].amount = change * 1
                    }
                    msg += ' change1.2.1 is added to first output '
                } else {
                    outputs.push({
                        'to': addressForChange,
                        'amount': change
                    })
                    msg += ' change1.2.2 will be ' + change
                }
                msg += ' fee [1.2] will be ' + data.feeForTx.feeForTx
                BlocksoftCryptoLog.log(this._settings.currencyCode + ' BtcTxInputsOutputs.getInputsOutputs ' + subtitle + ' 1.2 with change ' + change + ' ' + msg)
            }
        } else {
            if (autocalculateFee) {
                let sizeMsg = ' basic ' + size
                size += 150 * (inputs.length - 1)
                sizeMsg += ' +150*' + (inputs.length - 1)
                let fee = feeForByte * size / 2
                if (fee < this._minFee) {
                    fee = this._minFee
                }
                msg += ' fee [2.1] will be ' + fee
                msg += ' feeAutoCalculate: size' + sizeMsg + ' = ' + size + ' bytes = ' + fee + ' satoshi '
                if (isTransferAll) {
                    outputs[0].amount = inputsBalanceBN.sub(BlocksoftUtils.toBigNumber(fee)).toString()
                    correctedAmountFrom = outputs[0].amount
                } else {
                    const leftAfterFee = inputsMinusWishedBN.sub(BlocksoftUtils.toBigNumber(fee))
                    if (leftAfterFee < 0 && subtitle.indexOf('tryToFind') === -1) {
                        BlocksoftCryptoLog.log(this._settings.currencyCode + ' BtcTxInputsOutputs.getInputsOutputs ' + subtitle + ' 2.1 with leftAfterAutoFee ' + leftAfterFee + ' ' + msg)
                        data.feeForTx = { feeForTx: fee, feeForByte: feeForByte }
                        return this._tryToFind(data, size, precached, 'autofee 2.1 => fixed tryToFind' )
                    }
                }
            } else {
                const change = inputsMinusWishedBN.toString()
                if (change < 0) {
                    if (isTransferAll) {
                        outputs[0].amount = inputsBalanceBN.sub(BlocksoftUtils.toBigNumber(data.feeForTx.feeForTx)).toString()
                    } else {
                        const diff = inputsMinusWishedBN.add(BlocksoftUtils.toBigNumber(data.feeForTx.feeForTx)).toString()
                        if (diff > 188) {
                            BlocksoftCryptoLog.log(this._settings.currencyCode + ' BtcTxInputsOutputs.getInputsOutputs ' + subtitle + ' 2.2.01 diff ' + diff + ' with leftSmallChange ' + change + ' fee ' + data.feeForTx.feeForTx + ' ' + msg)
                        } else {
                            let canWait = 0
                            let usdtSkipped = 0
                            let e
                            if (useOnlyConfirmed) {
                                BlocksoftCryptoLog.log('unconfirmed', unconfirmedBN.toString())
                                canWait = unconfirmedBN.add(inputsMinusWishedBN).toString()
                            }
                            if (skipAddress) {
                                usdtSkipped = skippedBN.toString()
                                BlocksoftCryptoLog.log('skipped', usdtSkipped)
                            }
                            if (usdtSkipped > 0) {
                                BlocksoftCryptoLog.log(this._settings.currencyCode + ' BtcTxInputsOutputs.getInputsOutputs ' + subtitle + ' 2.2.02 diff + ' + diff + ' with leftSmallChange ' + change + ' ' + msg + ' usdtSkipped ' + usdtSkipped)
                                return this.getInputsOutputs(data, precached, 'usdtnoskip 2' + subtitle)
                            } else if (canWait > 0) {
                                BlocksoftCryptoLog.log(this._settings.currencyCode + ' BtcTxInputsOutputs.getInputsOutputs ' + subtitle + ' 2.2.03 diff + ' + diff + ' with leftSmallChange ' + change + ' ' + msg + ' canWait ' + canWait)
                                if (data.walletUseUnconfirmed) {
                                    return this.getInputsOutputs(data, precached, 'unconfirmed 2 ' + subtitle)
                                } else {
                                    e = new Error('SERVER_RESPONSE_WAIT_FOR_CONFIRM')
                                    e.code = 'ERROR_USER'
                                    throw e
                                }
                            } else {
                                BlocksoftCryptoLog.log(this._settings.currencyCode + ' BtcTxInputsOutputs.getInputsOutputs ' + subtitle + ' 2.2.03 diff ' + diff + ' with leftSmallChange ' + change + ' fee ' + data.feeForTx.feeForTx + ' ' + msg + ' canWait ' + canWait)
                                if (data.feeForTx.feeForTx >= 1) {
                                    e = new Error('SERVER_RESPONSE_NOTHING_LEFT_FOR_FEE')
                                } else {
                                    e = new Error('SERVER_RESPONSE_NOTHING_TO_TRANSFER')
                                }
                                e.code = 'ERROR_USER'
                                throw e
                            }
                        }
                    }
                }
                msg += ' fees [2.2] will be ' + change
                msg += ' fees started ' + data.feeForTx.feeForTx
            }
        }

        BlocksoftCryptoLog.log(this._settings.currencyCode + ' BtcTxInputsOutputs.getInputsOutputs ' + subtitle + ' ' + msg)

        if (outputs[0].amount < 0) {
            let canWait = 0
            let usdtSkipped = 0
            if (useOnlyConfirmed) {
                canWait = unconfirmedBN.toString()
            }
            if (skipAddress) {
                usdtSkipped = skippedBN.toString()
                BlocksoftCryptoLog.log('skipped', usdtSkipped)
            }
            if (usdtSkipped > 0) {
                return this.getInputsOutputs(data, precached, 'usdtnoskip 3 ' + subtitle)
            } else if (canWait > 0) {
                if (data.walletUseUnconfirmed) {
                    return this.getInputsOutputs(data, precached, 'unconfirmed 3 ' + subtitle)
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


        if (!tryToFind && data.amount < 1000) {
            const fee = precached.blocks_12 * size / 2
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
                const e = new Error('SERVER_RESPONSE_NOT_ENOUGH_AMOUNT_FOR_ANY_FEE')
                e.code = 'ERROR_USER'
                throw e
            }
        }

        return tryToFind
    }
}
