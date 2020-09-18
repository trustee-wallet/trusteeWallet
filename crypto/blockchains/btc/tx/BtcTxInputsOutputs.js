/**
 * @version 0.11
 */
import BlocksoftUtils from '../../../common/BlocksoftUtils'
import BlocksoftCryptoLog from '../../../common/BlocksoftCryptoLog'

const coinSelect = require('coinselect')
const coinSplit = require('coinselect/split')

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


    coinSelect(data, filteredUnspents, feeForByte, addressForChange, usdtAddress, usdtInputsTotal, isTransferAll) {
        const utxos = []
        let unspent
        let usdtAdded = 0
        let msg = ''
        for (unspent of filteredUnspents) {
            if (usdtAddress && usdtAddress === unspent.address) {
                if (usdtAdded < usdtInputsTotal - 1) {
                    usdtAdded++
                } else {
                    msg += ' one usdt untouched ' + unspent.txid
                    continue
                }
            }
            if (unspent.isRequired) {
                return false
            }
            utxos.push({
                txId: unspent.txid,
                vout: unspent.vout,
                value: unspent.value * 1,
                my: unspent
            })
        }

        let targets, res
        if (isTransferAll) {
            targets = [{
                address: data.addressTo
            }]
            res = coinSplit(utxos, targets, feeForByte)
        } else {
            targets = [{
                address: data.addressTo,
                value: data.amount * 1
            }]
            res = coinSelect(utxos, targets, feeForByte)
        }
        const { inputs, outputs, fee } = res

        /*
        console.log('CS targets ' + feeForByte, JSON.parse(JSON.stringify(targets)))
        console.log('CS inputs', inputs ? JSON.parse(JSON.stringify(inputs)) : 'none')
        console.log('CS outputs', outputs ? JSON.parse(JSON.stringify(outputs)) : 'none')
        console.log('CS fee ', fee ? JSON.parse(JSON.stringify(fee)) : 'none')
        */
        if (!inputs || typeof inputs === 'undefined') {
            return false
        }
        const formatted = {
            inputs: [],
            outputs: [],
            feeForByte: feeForByte,
            msg: ' coinselect for ' + feeForByte + ' fee ' + fee + ' ' + msg + ' all data ' + JSON.stringify(inputs) + ' ' + JSON.stringify(outputs)
        }

        let input, output
        for (input of inputs) {
            formatted.inputs.push(input.my)
        }
        for (output of outputs) {
            formatted.outputs.push({
                'to': output.address || addressForChange,
                'amount': output.value.toString()
            })
        }

        return formatted
    }

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
     * @param {string} data.customFeeForByte //for auto will be also
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
        BlocksoftCryptoLog.log(this._settings.currencyCode + ' BtcTxInputsOutputs.getInputsOutputs ' + subtitle + ' stared', { addressFrom: data.addressFrom, addressFromLegacy: data.addressFromLegacy, walletUseUnconfirmed: data.walletUseUnconfirmed })

        if (typeof data.addressFrom === 'undefined') {
            throw new Error('BtcTxInputsOutputs.getInputsOutputs requires addressFrom')
        }
        if (typeof data.addressTo === 'undefined') {
            throw new Error('BtcTxInputsOutputs.getInputsOutputs requires addressTo')
        } else if (data.addressTo.indexOf(',') !== -1) {
            const tmp = data.addressTo.split(',')
            data.addressTo = tmp[1]
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

        const weightInput = isTransferAll ? 200 : 150

        const useOnlyConfirmed = !data.walletUseUnconfirmed || subtitle.indexOf('unconfirmed') === -1
        let autocalculateFee = true
        let feeForByte = precached.blocks_2
        if (subtitle.indexOf('getFeeRate') === -1 && typeof data.feeForTx !== 'undefined' && typeof data.feeForTx.feeForTx !== 'undefined') {
            autocalculateFee = false
            feeForByte = data.feeForTx.feeForByte
        } else if (typeof data.customFeeForByte !== 'undefined') {
            feeForByte = data.customFeeForByte
        }

        const filteredUnspents = []
        let unconfirmedBN = BlocksoftUtils.toBigNumber(0)
        let skippedBN = BlocksoftUtils.toBigNumber(0)
        let usdtInputsTotal = 0
        let unspent
        if (useOnlyConfirmed) {
            for (unspent of precached.unspents) {
                if (usdtAddress && usdtAddress === unspent.address) {
                    usdtInputsTotal++
                }
                if (skipAddress && skipAddress === unspent.address) {
                    skippedBN = unconfirmedBN.add(unspent.valueBN)
                } else if (unspent.confirmations > 0) {
                    filteredUnspents.push(unspent)
                } else {
                    unconfirmedBN = unconfirmedBN.add(unspent.valueBN)
                }
            }
        } else {
            for (unspent of precached.unspents) {
                if (usdtAddress && usdtAddress === unspent.address) {
                    usdtInputsTotal++
                }
                if (skipAddress && skipAddress === unspent.address) {
                    skippedBN = unconfirmedBN.add(unspent.valueBN)
                } else {
                    filteredUnspents.push(unspent)
                }
            }
        }


        if (autocalculateFee) {
            const result = this.coinSelect(data, filteredUnspents, feeForByte, addressForChange, usdtAddress, usdtInputsTotal, isTransferAll)
            if (result) {
                return result
            }
        }


        let totalBalanceBN = BlocksoftUtils.toBigNumber(0)
        for (unspent of filteredUnspents) {
            totalBalanceBN = totalBalanceBN.add(unspent.valueBN)
        }

        let wishedAmountBN = BlocksoftUtils.toBigNumber(data.amount)

        const outputs = []
        outputs.push({
            'to': data.addressTo,
            'amount': data.amount.toString()
        })

        if (!autocalculateFee) {
            wishedAmountBN = wishedAmountBN.add(BlocksoftUtils.toBigNumber(data.feeForTx.feeForTx))
        }

        const ic = filteredUnspents.length
        let msg = 'totalInputs ' + ic + ' for wishedAmount ' + wishedAmountBN.toString() + ' = ' + BlocksoftUtils.toUnified(wishedAmountBN.toString(), this._settings.decimals)
        if (usdtAddress) {
            msg += ' usdtInputsTotal ' + usdtInputsTotal
        }
        if (autocalculateFee) {
            msg += ' autofeeForByte ' + feeForByte
        } else {
            msg += ' wishedFee ' + data.feeForTx.feeForTx + ' = ' + BlocksoftUtils.toUnified(data.feeForTx.feeForTx + '', this._settings.decimals)
        }


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
                unspent.isRequired
                ||
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
        BlocksoftCryptoLog.log(this._settings.currencyCode + ' BtcTxInputsOutputs.getInputsOutputs ' + subtitle + ' usdtCheck ' + JSON.stringify({ usdtAddress, usdtInputsTotal, usdtInputsUsed }))


        let inputsMinusWishedBN = inputsBalanceBN.sub(wishedAmountBN)

        let size = 192
        let usdtAmount = 0
        if (usdtAddress && usdtInputsUsed >= usdtInputsTotal) {
            msg += ' added output for usdt ' + usdtInputsUsed + '' + usdtInputsTotal
            usdtAmount = 546
            if (inputsMinusWishedBN.toString() - this._minChangeThreshold > 0) {
                usdtAmount = 2546
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
                size += weightInput * (inputs.length - 1)
                sizeMsg += ' +' + weightInput + '*' + (inputs.length - 1)
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
                            'amount': change,
                            'type': 'change'
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
                    return this._tryToFind(data, size, precached, 'autofee 1.1 => fixed tryToFind')
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
                        'amount': change,
                        'type': 'change'
                    })
                    msg += ' change1.2.2 will be ' + change
                }
                msg += ' fee [1.2] will be ' + data.feeForTx.feeForTx
                BlocksoftCryptoLog.log(this._settings.currencyCode + ' BtcTxInputsOutputs.getInputsOutputs ' + subtitle + ' 1.2 with change ' + change + ' ' + msg)
            }
        } else {
            if (autocalculateFee) {
                let sizeMsg = ' basic ' + size
                size += weightInput * (inputs.length - 1)
                sizeMsg += ' +' + weightInput + '*' + (inputs.length - 1)
                let fee = feeForByte * size / 2
                if (fee < this._minFee) {
                    fee = this._minFee
                }
                msg += ' fee [2.1] will be ' + fee
                msg += ' feeAutoCalculate: size' + sizeMsg + ' = ' + size + ' bytes = ' + fee + ' satoshi '
                if (isTransferAll) {
                    outputs[0].amount = inputsBalanceBN.sub(BlocksoftUtils.toBigNumber(fee)).toString()
                } else {
                    const leftAfterFee = inputsMinusWishedBN.sub(BlocksoftUtils.toBigNumber(fee))
                    if (leftAfterFee < 0 && subtitle.indexOf('tryToFind') === -1) {
                        BlocksoftCryptoLog.log(this._settings.currencyCode + ' BtcTxInputsOutputs.getInputsOutputs ' + subtitle + ' 2.1 with leftAfterAutoFee ' + leftAfterFee + ' ' + msg)
                        data.feeForTx = { feeForTx: fee, feeForByte: feeForByte }
                        return this._tryToFind(data, size, precached, 'autofee 2.1 => fixed tryToFind')
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


        let res = {
            inputs,
            outputs,
            correctedAmountFrom: outputs[0].amount,
            feeForByte,
            msg
        }

        BlocksoftCryptoLog.log(this._settings.currencyCode + ' BtcTxInputsOutputs.getInputsOutputs ' + subtitle + ' msg ' + msg + ' res ' + JSON.stringify(res))

        if (outputs[0].amount * 1 < 0) {
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
                BlocksoftCryptoLog.log(this._settings.currencyCode + ' BtcTxInputsOutputs.getInputsOutputs ' + subtitle + ' result ' + outputs[0].amount + ' will redo 1')
                res = this.getInputsOutputs(data, precached, 'usdtnoskip 3 ' + subtitle)
            } else if (canWait > 0) {
                if (data.walletUseUnconfirmed) {
                    BlocksoftCryptoLog.log(this._settings.currencyCode + ' BtcTxInputsOutputs.getInputsOutputs ' + subtitle + ' result ' + outputs[0].amount + ' will redo 2')
                    res = this.getInputsOutputs(data, precached, 'unconfirmed 3 ' + subtitle)
                } else {
                    throw new Error('SERVER_RESPONSE_WAIT_FOR_CONFIRM')
                }
            } else {
                throw new Error('SERVER_RESPONSE_NOT_ENOUGH_AMOUNT_FOR_ANY_FEE')
            }
        }

        BlocksoftCryptoLog.log(this._settings.currencyCode + ' BtcTxInputsOutputs.getInputsOutputs ' + subtitle + ' result correctedAmount ' + outputs[0].amount)

        return res
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
                throw new Error('SERVER_RESPONSE_NOT_ENOUGH_AMOUNT_FOR_ANY_FEE')
            }
        }

        return tryToFind
    }
}
