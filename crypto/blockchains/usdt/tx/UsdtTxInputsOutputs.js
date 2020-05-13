/**
 * @version 0.5
 */
import BlocksoftUtils from '../../../common/BlocksoftUtils'
import BlocksoftCryptoLog from '../../../common/BlocksoftCryptoLog'

const DUST_FIRST_TRY = 546

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
     * @param {Object} data
     * @param {string} data.addressFrom
     * @param {string} data.addressFromLegacy
     * @param {string} data.addressTo
     * @param {string} data.walletUseUnconfirmed
     * @param {string} data.walletUseLegacy
     * @param {string|number} data.amount
     * @param {string|boolean} data.addressForChange
     * @param {string|boolean} data.addressForChangeHD.id
     * @param {string|boolean} data.addressForChangeHD.address
     * @param {string|number} data.feeForTx.feeForTx
     * @param {string|number} data.feeForTx.feeForByte
     * @param {Object} precached
     * @param {string} precached.blocks_2
     * @param {UnifiedUnspent[]} precached.unspents
     * @param {string} subtitle
     * @returns {{outputs: [], inputs: [], correctedAmountFrom: string, feeForByte: (number|string)}}
     */
    getInputsOutputs(data, precached, subtitle) {
        BlocksoftCryptoLog.log('UsdtTxInputsOutputs.getInputsOutputs ' + subtitle + ' stared ', {addressFrom : data.addressFrom, addressFromLegacy : data.addressFromLegacy, walletUseUnconfirmed : data.walletUseUnconfirmed})

        if (!data.addressFromLegacy && data.addressFrom) {
            if (data.addressFrom.substr(0, 1) === '1') {
                data.addressFromLegacy = data.addressFrom
                BlocksoftCryptoLog.log('UsdtTxInputsOutputs.getInputsOutputs ' + subtitle + ' fixed addressFromLegacy=' + data.addressFrom)
            } else {
                BlocksoftCryptoLog.err('UsdtTxInputsOutputs.getInputsOutputs ' + subtitle + ' could not fix addressFromLegacy=' + data.addressFrom)
            }
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
        let addressForChange = data.addressFrom
        if (data.walletUseLegacy > 0) {
            addressForChange = data.addressFromLegacy
        }
        if (typeof data.addressForChange !== 'undefined' && data.addressForChange !== 'TRANSFER_ALL' && data.addressForChange) {
            addressForChange = data.addressForChange
        }

        if (typeof data.addressForChangeHD !== 'undefined' && data.addressForChangeHD) {
            addressForChange = data.addressForChangeHD
        }
        const useOnlyConfirmed = data.walletUseUnconfirmed > 0 ? false : true
        let autocalculateFee = true
        let feeForByte = precached.blocks_2
        if (subtitle.indexOf('getFeeRate') === -1 && typeof data.feeForTx !== 'undefined' && typeof data.feeForTx.feeForTx !== 'undefined') {
            autocalculateFee = false
            feeForByte = data.feeForTx.feeForByte
        }

        let filteredUnspents = []
        let uncomfirmedInputs = 0
        let uncomfirmedLegacyInputs = 0
        let unspent
        if (useOnlyConfirmed) {
            for (unspent of precached.unspents) {
                if (unspent.confirmations > 0) {
                    filteredUnspents.push(unspent)
                } else {
                    if (unspent.address === data.addressFromLegacy) {
                        uncomfirmedLegacyInputs++
                    }
                    uncomfirmedInputs++
                }
            }
        } else {
            filteredUnspents = precached.unspents
        }

        let totalBalanceBN = BlocksoftUtils.toBigNumber(0)
        for (unspent of filteredUnspents) {
            totalBalanceBN = totalBalanceBN.add(unspent.valueBN)
        }
        let wishedAmountBN = BlocksoftUtils.toBigNumber(DUST_FIRST_TRY)

        const outputs = [{
            'to': data.addressTo,
            'amount': '0',
            'usdt': data.amount.toString()
        }, {
            'to': data.addressTo,
            'amount': (DUST_FIRST_TRY).toString()
        }]

        const correctedAmountFrom = wishedAmountBN.toString()

        if (!autocalculateFee) {
            wishedAmountBN = wishedAmountBN.add(BlocksoftUtils.toBigNumber(data.feeForTx.feeForTx))
        }

        const ic = filteredUnspents.length
        let msg = 'totalInputs ' + ic + ' for wishedAmount ' + wishedAmountBN.toString() + ' = ' + BlocksoftUtils.toUnified(wishedAmountBN.toString(), this._settings.decimals)

        let inputs = []
        let inputsBalanceBN = BlocksoftUtils.toBigNumber(0)
        let foundOnlyOne = false
        let wishedAmountForOneBN = wishedAmountBN
        if (autocalculateFee) {
            wishedAmountForOneBN = wishedAmountForOneBN.add(BlocksoftUtils.toBigNumber(precached.blocks_2 * 128))
        }

        let legacyTotal = 0
        let legacyInputed = 0
        let legacyAnyInput = false
        for (let i = 0; i < ic; i++) {
            const unspent = filteredUnspents[i]
            if (unspent.address !== data.addressFromLegacy) continue
            legacyTotal++
            legacyAnyInput = unspent
            if (
                inputsBalanceBN.sub(wishedAmountForOneBN).toString() - 1000 < 0
            ) {
                inputs.push(unspent)
                inputsBalanceBN = inputsBalanceBN.add(unspent.valueBN)
                msg += ' ' + i + ') added as only one Legacy ' + unspent.value + ' for ' + wishedAmountForOneBN
                foundOnlyOne = true
                legacyInputed++
            }
        }
        msg += ' legacyInputed ' + legacyInputed + ' legacyTotal = ' + legacyTotal
        if (legacyTotal === 0 || !legacyAnyInput) {
            BlocksoftCryptoLog.log('UsdtTxInputsOutputs.getInputsOutputs ' + subtitle + ' error SERVER_RESPONSE_LEGACY_BALANCE_NEEDED_USDT ', {useOnlyConfirmed, legacyTotal, legacyAnyInput, uncomfirmedLegacyInputs, filteredUnspents})
            if (useOnlyConfirmed && uncomfirmedLegacyInputs > 0) {
                throw new Error('SERVER_RESPONSE_LEGACY_BALANCE_NEEDED_USDT_WAIT_FOR_CONFIRM')
            } else {
                throw new Error('SERVER_RESPONSE_LEGACY_BALANCE_NEEDED_USDT')
            }
        }
        BlocksoftCryptoLog.log('UsdtTxInputsOutputs.getInputsOutputs ' + subtitle + ' checked ok SERVER_RESPONSE_LEGACY_BALANCE_NEEDED_USDT ', {useOnlyConfirmed, legacyTotal, legacyAnyInput, filteredUnspents})

        if (legacyTotal < 2) {
            foundOnlyOne = false
            legacyInputed = 0
            inputs = []
            inputsBalanceBN = BlocksoftUtils.toBigNumber(0)
            msg += ' reset only one by legacyTotal ]]]] '
        }

        if (legacyInputed === 0) {
            inputs.push(legacyAnyInput)
            inputsBalanceBN = inputsBalanceBN.add(legacyAnyInput.valueBN)
            msg += ' added as first Legacy ' + legacyAnyInput.value
        }

        if (!foundOnlyOne) {
            for (let i = 0; i < ic; i++) {
                const unspent = filteredUnspents[i]
                if (unspent.address === data.addressFromLegacy) continue
                if (
                    inputsBalanceBN.sub(wishedAmountForOneBN) < 1000
                ) {
                    inputs.push(unspent)
                    inputsBalanceBN = inputsBalanceBN.add(unspent.valueBN)
                    msg += ' ' + i + ') added as only one ' + unspent.value + ' for ' + wishedAmountForOneBN
                    foundOnlyOne = true
                }
            }
        }

        if (!foundOnlyOne) {
            let leftBalanceBN = totalBalanceBN
            for (let i = 0; i < ic; i++) {

                if (wishedAmountBN.sub(inputsBalanceBN) < 0) {
                    msg += ' finished by collectedAmount ' + inputsBalanceBN.toString()
                    break
                }

                const unspent = filteredUnspents[i]
                if (legacyAnyInput && unspent.txid === legacyAnyInput.txid) {
                    continue
                }
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

        const inputsMinusWishedBN = inputsBalanceBN.sub(wishedAmountBN)
        if (inputsMinusWishedBN.toString() - 10000 > 0) {
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
                const changeBasic = inputsBalanceBN.sub(wishedAmountBN).sub(BlocksoftUtils.toBigNumber(fee))
                const change = changeBasic.toString()
                if (legacyTotal === 1) {
                    const change2 = changeBasic.sub(legacyAnyInput.valueBN).toString()
                    if (change2 - 1000 > 0) {
                        outputs.push({
                            'to': data.addressFromLegacy,
                            'amount': legacyAnyInput.value
                        })
                        outputs.push({
                            'to': addressForChange,
                            'amount': change2,
                            'type' : 'change'
                        })
                        msg += ' with legacy1.1 ' + legacyAnyInput.value
                        msg += ' change1.1 will be ' + change2
                        msg += ' fee1.1 will be ' + fee
                    } else {
                        outputs.push({
                            'to': data.addressFromLegacy,
                            'amount': change, // all change will go to legacy to make new input for next txs
                            'type' : 'change'
                        })
                        msg += ' with legacy1.2 ' + change
                        msg += ' fee1.2 will be ' + fee
                    }
                    msg += ' feeAutoCalculate 1.1: size' + sizeMsg + ' = ' + size + ' bytes = ' + fee + ' satoshi '
                } else if (change - 10000 > 0) {
                    outputs.push({
                        'to': addressForChange,
                        'amount': change,
                        'type' : 'change'
                    })
                    msg += ' change1.2 will be ' + change
                    msg += ' fee1.2 will be ' + fee
                    msg += ' feeAutoCalculate 1.2: size' + sizeMsg + ' = ' + size + ' bytes = ' + fee + ' satoshi '
                } else {
                    msg += ' fee1.3 will be ' + (fee + change)
                    msg += ' feeAutoCalculate 1.3: size' + sizeMsg + ' = ' + size + ' bytes = ' + fee + ' satoshi '
                }
                if (change < 0) {
                    BlocksoftCryptoLog.log(this._settings.currencyCode + ' UsdtTxInputsOutputs.getInputsOutputs ' + subtitle + ' 1.01 with leftChange ' + change + ' ' + msg)
                    data.feeForTx = { feeForTx: fee, feeForByte: feeForByte }
                    return this._tryToFind(data, size, precached, 'autofee 1.1 => fixed' )
                }
            } else if (legacyTotal === 1) {
                const change = inputsMinusWishedBN.sub(legacyAnyInput.valueBN).toString()
                if (change > 0) {
                    outputs.push({
                        'to': data.addressFromLegacy,
                        'amount': legacyAnyInput.value
                    })
                    if (change > 1000) {
                        outputs.push({
                            'to': addressForChange,
                            'amount': change,
                            'type' : 'change'
                        })
                        msg += ' change1.02.1 will be ' + change
                    } else {
                        msg += ' change1.02.2 will be skipped'
                    }
                } else {
                    outputs.push({
                        'to': data.addressFromLegacy,
                        'amount': inputsMinusWishedBN.toString()
                    })
                    msg += ' change1.02 will be skipped ' + change + ' only legacy will left'
                }
                msg += ' fee1.02 will be ' + data.feeForTx.feeForTx
                BlocksoftCryptoLog.log(this._settings.currencyCode + ' UsdtTxInputsOutputs.getInputsOutputs ' + subtitle + ' 1.02 with legacy ' + legacyAnyInput.value + ' change ' + change + ' ' + msg)
            } else {
                const change = inputsMinusWishedBN.toString()
                if (change > 0) {
                    outputs.push({
                        'to': addressForChange,
                        'amount': change,
                        'type' : 'change'
                    })
                    msg += ' change1.03 will be ' + change
                } else {
                    msg += ' change1.03 will be skipped ' + change
                }
                msg += ' fee1.03 will be ' + data.feeForTx.feeForTx
                BlocksoftCryptoLog.log(this._settings.currencyCode + ' UsdtTxInputsOutputs.getInputsOutputs ' + subtitle + ' 1.03 with change ' + change + ' ' + msg)
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
                msg += ' fee2.1 will be ' + fee
                msg += ' feeAutoCalculate: size' + sizeMsg + ' = ' + size + ' bytes = ' + fee + ' satoshi '

                let leftAfterFee = inputsMinusWishedBN.sub(BlocksoftUtils.toBigNumber(fee))
                const minusLimit = -1 * Math.round(fee / 5) // 20 %
                if (leftAfterFee - minusLimit < 0 || leftAfterFee - 10000 > 0) {
                    BlocksoftCryptoLog.log(this._settings.currencyCode + ' UsdtTxInputsOutputs.getInputsOutputs ' + subtitle + ' 2.1.1 with inputsBalanceBN ' + inputsBalanceBN + ' minusLimit ' + minusLimit + ' leftAfterAutoFee ' + leftAfterFee + ' ' + msg)
                    data.feeForTx = { feeForTx: fee, feeForByte: feeForByte }
                    return this._tryToFind(data, size, precached, 'autofee 2.1.1 => fixed' )
                } else if (legacyTotal === 1) {
                    outputs.push({
                        'to': data.addressFromLegacy,
                        'amount': legacyAnyInput.value
                    })
                    leftAfterFee = leftAfterFee.sub(legacyAnyInput.valueBN)
                    if (leftAfterFee.toString() < 0) {
                        BlocksoftCryptoLog.log(this._settings.currencyCode + ' UsdtTxInputsOutputs.getInputsOutputs ' + subtitle + ' 2.1.2 with legacy ' + legacyAnyInput.value + ' inputsBalanceBN ' + inputsBalanceBN + ' minusLimit ' + minusLimit + ' leftAfterAutoFee ' + leftAfterFee + ' ' + msg)
                        data.feeForTx = { feeForTx: fee, feeForByte: feeForByte }
                        return this._tryToFind(data, size, precached, 'autofee 2.1.2 => fixed' )
                    } else {
                        msg += ' legacy2.1 ' + legacyAnyInput.value
                    }
                }
            } else {

                let change = inputsMinusWishedBN.toString()
                const fee = data.feeForTx.feeForTx*1
                const minusLimit = -1 * Math.round(fee / 5) // 20 %
                if (change < 0 && fee + change < minusLimit) {
                    BlocksoftCryptoLog.log(this._settings.currencyCode + ' UsdtTxInputsOutputs.getInputsOutputs ' + subtitle + ' 2.2.1 ' + (fee+change) + '<' + minusLimit + ' with inputsBalanceBN ' + inputsBalanceBN + ' minusLimit ' + minusLimit + ' change ' + change + ' fee ' + fee + ' ' + msg)

                    if (uncomfirmedInputs > 0) {
                        const e = new Error('SERVER_RESPONSE_NOT_ENOUGH_CONFIRMED_FEE')
                        e.code = 'ERROR_USER'
                        throw e
                    } else {
                        const e = new Error('SERVER_RESPONSE_NOT_ENOUGH_FEE')
                        e.code = 'ERROR_USER'
                        throw e
                    }
                } else if (legacyTotal === 1) {
                    const change2 = inputsMinusWishedBN.sub(legacyAnyInput.valueBN).toString()
                    if (change2 < 0) {
                        outputs.push({
                            'to': data.addressFromLegacy,
                            'amount': '546'
                        })
                        msg += ' legacy2.2.1 546'
                    } else if (change < 0) {
                        outputs.push({
                            'to': data.addressFromLegacy,
                            'amount': change2
                        })
                        change = 0
                        msg += ' legacy2.2.2 ' + change2
                    } else {
                        outputs.push({
                            'to': data.addressFromLegacy,
                            'amount': legacyAnyInput.value
                        })
                        change = change2
                        msg += ' legacy2.2.3 ' + legacyAnyInput.value
                    }
                }
                msg += ' change2.2 will be added to fee ' + change
                msg += ' fees2.2 started ' + data.feeForTx.feeForTx
            }
        }

        BlocksoftCryptoLog.log(this._settings.currencyCode + ' UsdtTxInputsOutputs.getInputsOutputs ' + subtitle + ' ' + msg)
        BlocksoftCryptoLog.log(this._settings.currencyCode + ' UsdtTxInputsOutputs.getInputsOutputs outputs[0].amount ' + outputs[0].amount)

        if (inputs.length === 0) {
            const e = new Error('SERVER_RESPONSE_NOT_ENOUGH_FEE')
            e.code = 'ERROR_USER'
            throw e
        }
        if (outputs[0].amount < 0) {
            const e = new Error('SERVER_RESPONSE_NOT_ENOUGH_FEE')
            e.code = 'ERROR_USER'
            throw e
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


        if (!tryToFind && data.amount < 10) {
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
