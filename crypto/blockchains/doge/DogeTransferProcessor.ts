/**
 * @version 0.20
 */
import { BlocksoftBlockchainTypes } from '../BlocksoftBlockchainTypes'
import BlocksoftCryptoLog from '../../common/BlocksoftCryptoLog'
import BlocksoftUtils from '../../common/BlocksoftUtils'

import DogeNetworkPrices from './basic/DogeNetworkPrices'
import DogeUnspentsProvider from './providers/DogeUnspentsProvider'
import DogeTxInputsOutputs from './tx/DogeTxInputsOutputs'
import DogeTxBuilder from './tx/DogeTxBuilder'
import DogeSendProvider from './providers/DogeSendProvider'
import DogeRawDS from './stores/DogeRawDS'
import { DogeLogs } from './basic/DogeLogs'

import MarketingEvent from '../../../app/services/Marketing/MarketingEvent'
import config from '../../../app/config/config'
import { err } from 'react-native-svg/lib/typescript/xml'
import { sublocale } from '../../../app/services/i18n'
import settingsActions from '../../../app/appstores/Stores/Settings/SettingsActions'


const networksConstants = require('../../common/ext/networks-constants')


export default class DogeTransferProcessor implements BlocksoftBlockchainTypes.TransferProcessor {

    _trezorServerCode = 'DOGE_TREZOR_SERVER'

    _builderSettings: BlocksoftBlockchainTypes.BuilderSettings = {
        minOutputDustReadable: 0.001,
        minChangeDustReadable: 0.5,
        feeMaxForByteSatoshi: 100000000, // for tx builder
        feeMaxAutoReadable2: 300, // for fee calc,
        feeMaxAutoReadable6: 150, // for fee calc
        feeMaxAutoReadable12: 100, // for fee calc
        changeTogether: true,
        minRbfStepSatoshi: 50,
        minSpeedUpMulti: 1.5,
        feeMinTotalReadable : 1
    }

    _initedProviders: boolean = false

    _settings: BlocksoftBlockchainTypes.CurrencySettings

    _langPrefix: string

    // @ts-ignore
    networkPrices: BlocksoftBlockchainTypes.NetworkPrices

    // @ts-ignore
    unspentsProvider: BlocksoftBlockchainTypes.UnspentsProvider

    // @ts-ignore
    sendProvider: BlocksoftBlockchainTypes.SendProvider

    // @ts-ignore
    txPrepareInputsOutputs: BlocksoftBlockchainTypes.TxInputsOutputs

    // @ts-ignore
    txBuilder: BlocksoftBlockchainTypes.TxBuilder

    constructor(settings: BlocksoftBlockchainTypes.CurrencySettings) {
        this._settings = settings
        this._langPrefix = networksConstants[settings.network].langPrefix
        this.networkPrices = new DogeNetworkPrices()
    }

    _initProviders() {
        if (this._initedProviders) return false
        this.unspentsProvider = new DogeUnspentsProvider(this._settings, this._trezorServerCode)
        this.sendProvider = new DogeSendProvider(this._settings, this._trezorServerCode)
        this.txPrepareInputsOutputs = new DogeTxInputsOutputs(this._settings, this._builderSettings)
        this.txBuilder = new DogeTxBuilder(this._settings, this._builderSettings)
        this._initedProviders = true
    }

    needPrivateForFee(): boolean {
        return true
    }

    checkSendAllModal(data: { currencyCode: any }): boolean {
        return true
    }

    async getFeeRate(data: BlocksoftBlockchainTypes.TransferData, privateData: BlocksoftBlockchainTypes.TransferPrivateData, additionalData: BlocksoftBlockchainTypes.TransferAdditionalData = {})
        : Promise<BlocksoftBlockchainTypes.FeeRateResult> {
        this._initProviders()

        let txRBF = false
        let transactionSpeedUp = false
        let transactionReplaceByFee = false
        let transactionRemoveByFee = false
        if (typeof data.transactionRemoveByFee !== 'undefined' && data.transactionRemoveByFee) {
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' DogeTransferProcessor.getFeeRate remove started ' + data.addressFrom + ' => ' + data.amount)
            transactionRemoveByFee = data.transactionRemoveByFee
            txRBF = transactionRemoveByFee
        } else if (typeof data.transactionReplaceByFee !== 'undefined' && data.transactionReplaceByFee) {
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' DogeTransferProcessor.getFeeRate resend started ' + data.addressFrom + ' => ' + data.amount)
            transactionReplaceByFee = data.transactionReplaceByFee
            txRBF = transactionReplaceByFee
        } else if (typeof data.transactionSpeedUp !== 'undefined' && data.transactionSpeedUp) {
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' DogeTransferProcessor.getFeeRate speedup started ' + data.addressFrom + ' => ' + data.amount)
            transactionSpeedUp = data.transactionSpeedUp
            txRBF = transactionSpeedUp
        } else {
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' DogeTransferProcessor.getFeeRate started ' + data.addressFrom + ' => ' + data.amount)
        }

        if (txRBF) {
            const savedData = await DogeRawDS.getJson({
                address: data.addressFrom,
                currencyCode: this._settings.currencyCode,
                transactionHash: txRBF
            }) // sometimes replaced in db or got from server
            if (savedData) {
                if (typeof data.transactionJson === 'undefined') {
                    data.transactionJson = {}
                }
                for (const key in savedData) {
                    // @ts-ignore
                    data.transactionJson[key] = savedData[key]
                }
            }
        }
        let prices = {}
        let autocorrectFee = false
        if (typeof additionalData.feeForByte === 'undefined') {
            prices = typeof additionalData.prices !== 'undefined' ? additionalData.prices : await this.networkPrices.getNetworkPrices(this._settings.currencyCode)
        } else {
            // @ts-ignore
            prices.speed_blocks_12 = additionalData.feeForByte
            autocorrectFee = true
        }

        let unspents = []
        if (transactionRemoveByFee) {
            if (typeof this.unspentsProvider.getTx === 'undefined') {
                throw new Error('No DogeTransferProcessor unspentsProvider.getTx for transactionRemoveByFee')
            }
            unspents = await this.unspentsProvider.getTx(data.transactionRemoveByFee, data.addressFrom, [], data.walletHash)
            data.isTransferAll = true
        } else {
            unspents = typeof additionalData.unspents !== 'undefined' ? additionalData.unspents : await this.unspentsProvider.getUnspents(data.addressFrom)
            if (transactionReplaceByFee) {
                if (typeof this.unspentsProvider.getTx === 'undefined') {
                    throw new Error('No DogeTransferProcessor unspentsProvider.getTx for transactionReplaceByFee')
                }
                unspents = await this.unspentsProvider.getTx(data.transactionReplaceByFee, data.addressFrom, unspents, data.walletHash)
            }
        }

        if (unspents.length > 1) {
            unspents.sort((a, b) => {
                return BlocksoftUtils.diff(b.value, a.value) * 1
            })
            // @ts-ignore
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' DogeTransferProcessor.getFeeRate unspents sorted', unspents)
        } else {
            // @ts-ignore
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' DogeTransferProcessor.getFeeRate unspents no need to sort', unspents)
        }

        const result: BlocksoftBlockchainTypes.FeeRateResult = {
            selectedFeeIndex: -1,
            fees: [] as BlocksoftBlockchainTypes.Fee[]
        } as BlocksoftBlockchainTypes.FeeRateResult

        const keys = ['speed_blocks_12', 'speed_blocks_6', 'speed_blocks_2']
        const checkedPrices = {}
        let prevFeeForByte = 0

        if (transactionSpeedUp) {
            autocorrectFee = true
        }

        const stepSatoshi = transactionRemoveByFee ? this._builderSettings.minRbfStepSatoshi * 2 : this._builderSettings.minRbfStepSatoshi
        let pricesTotal = 0
        for (const key of keys) {
            // @ts-ignore
            if (typeof prices[key] === 'undefined' || !prices[key]) continue
            pricesTotal++
            // @ts-ignore
            let feeForByte = prices[key]
            if (typeof additionalData.feeForByte === 'undefined') {
                if (transactionReplaceByFee || transactionRemoveByFee) {
                    if (typeof data.transactionJson !== 'undefined' && data.transactionJson !== null && typeof data.transactionJson.feeForByte !== 'undefined') {
                        if (feeForByte * 1 < data.transactionJson.feeForByte * 1) {
                            feeForByte = Math.ceil(data.transactionJson.feeForByte * 1 + stepSatoshi)
                        }
                    } else {
                        feeForByte = Math.ceil(feeForByte * 1 + stepSatoshi)
                    }
                    if (feeForByte * 1 <= prevFeeForByte * 1) {
                        feeForByte = Math.ceil(prevFeeForByte * 1 + stepSatoshi)
                    }
                } else if (transactionSpeedUp) {
                    feeForByte = Math.ceil(feeForByte * this._builderSettings.minSpeedUpMulti)
                    if (feeForByte * 1 <= prevFeeForByte * 1) {
                        feeForByte = Math.ceil(prevFeeForByte * 1.2)
                    }
                }
            }
            // @ts-ignore
            checkedPrices[key] = feeForByte
            prevFeeForByte = feeForByte
        }

        let uniqueFees = {}
        let isError = false
        for (const key of keys) {
            // @ts-ignore
            if (typeof checkedPrices[key] === 'undefined' || !checkedPrices[key]) continue
            // @ts-ignore
            const feeForByte = checkedPrices[key]
            let preparedInputsOutputs
            const subtitle = 'getFeeRate_' + key + ' ' + feeForByte
            let autoFeeLimitReadable = this._builderSettings.feeMaxAutoReadable2
            if (key === 'speed_blocks_6') {
                autoFeeLimitReadable = this._builderSettings.feeMaxAutoReadable6
            } else if (key === 'speed_blocks_12') {
                autoFeeLimitReadable = this._builderSettings.feeMaxAutoReadable12
            }

            let logInputsOutputs, blockchainData, txSize, actualFeeForByte, actualFeeForByteNotRounded
            try {
                preparedInputsOutputs = await this.txPrepareInputsOutputs.getInputsOutputs(data, unspents, {
                    feeForByte,
                    autoFeeLimitReadable
                },
                    additionalData,
                    subtitle)

                if (typeof additionalData.feeForByte === 'undefined' && typeof this._builderSettings.feeMinTotalReadable !== 'undefined') {
                    logInputsOutputs = DogeLogs.logInputsOutputs(data, unspents, preparedInputsOutputs, this._settings, subtitle)
                    if (logInputsOutputs.diffInOutReadable * 1 < this._builderSettings.feeMinTotalReadable) {
                        BlocksoftCryptoLog.log(this._settings.currencyCode + ' DogeTransferProcessor.getFeeRate_' + key + ' ' + feeForByte + '  less minTotalReadable ' + logInputsOutputs.diffInOutReadable )
                        preparedInputsOutputs = await this.txPrepareInputsOutputs.getInputsOutputs(data, unspents, {
                            feeForAll : BlocksoftUtils.fromUnified(this._builderSettings.feeMinTotalReadable, this._settings.decimals),
                            autoFeeLimitReadable
                        },
                            additionalData,
                            subtitle)
                        autocorrectFee = false
                    }
                }
                // @ts-ignore
                BlocksoftCryptoLog.log(this._settings.currencyCode + ' DogeTransferProcessor.getFeeRate_' + key + ' ' + feeForByte + ' preparedInputsOutputs', preparedInputsOutputs)
                if (preparedInputsOutputs.inputs.length === 0) {
                    // do noting
                    continue
                }
            } catch (e) {
                if (config.debug.cryptoErrors) {
                    console.log(this._settings.currencyCode + ' DogeTransferProcessor.getFeeRate_' + key + ' ' + feeForByte + '  getInputsOutputs error', e)
                }
                // noinspection ES6MissingAwait
                MarketingEvent.logOnlyRealTime('v20_doge_error_getfeerate_' + key + ' ' + feeForByte + ' ' + this._settings.currencyCode + ' ' + data.addressFrom + ' => ' + data.addressTo + ' ' + e.message, unspents)
                throw e
            }

            try {
                let doBuild = false
                let actualFeeRebuild = false
                do {
                    doBuild = false
                    logInputsOutputs = DogeLogs.logInputsOutputs(data, unspents, preparedInputsOutputs, this._settings, subtitle)
                    blockchainData = await this.txBuilder.getRawTx(data, privateData, preparedInputsOutputs)
                    txSize = Math.ceil(blockchainData.rawTxHex.length / 2)
                    actualFeeForByteNotRounded = BlocksoftUtils.div(logInputsOutputs.diffInOut, txSize)
                    actualFeeForByte = Math.floor(actualFeeForByteNotRounded)
                    let needAutoCorrect = false
                    if (autocorrectFee) {
                        needAutoCorrect = actualFeeForByte.toString() !== feeForByte.toString()
                    }
                    if (!actualFeeRebuild && needAutoCorrect) {
                        BlocksoftCryptoLog.log(this._settings.currencyCode + ' DogeTransferProcessor.getFeeRate will correct as ' + actualFeeForByte.toString() + ' != ' + feeForByte.toString())
                        let outputForCorrecting = -1
                        for (let i = 0, ic = preparedInputsOutputs.outputs.length; i < ic; i++) {
                            const output = preparedInputsOutputs.outputs[i]
                            if (typeof output.isUsdt !== 'undefined') continue
                            if (typeof output.isChange !== 'undefined' && output.isChange) {
                                outputForCorrecting = i
                            }
                        }
                        if (outputForCorrecting >= 0) {
                            const diff = BlocksoftUtils.diff(actualFeeForByteNotRounded.toString(), feeForByte.toString())

                            const part = BlocksoftUtils.mul(txSize.toString(), diff.toString()).toString()
                            let newAmount
                            if (part.indexOf('-') === 0) {
                                newAmount = BlocksoftUtils.diff(preparedInputsOutputs.outputs[outputForCorrecting].amount, part.replace('-', ''))
                            } else {
                                newAmount = BlocksoftUtils.add(preparedInputsOutputs.outputs[outputForCorrecting].amount, part)
                            }


                            BlocksoftCryptoLog.log(this._settings.currencyCode + ' DogeTransferProcessor.getFeeRate diff ' + diff + ' part ' + part + ' amount ' + preparedInputsOutputs.outputs[outputForCorrecting].amount + ' => ' + newAmount)

                            // @ts-ignore
                            if (newAmount * 1 < 0) {
                                preparedInputsOutputs.outputs[outputForCorrecting].amount = 'removed'
                                outputForCorrecting = -1
                            } else {
                                preparedInputsOutputs.outputs[outputForCorrecting].amount = newAmount
                            }
                        }
                        doBuild = true
                        actualFeeRebuild = true
                        if (outputForCorrecting === -1) {
                            let foundToMore = false
                            for (let i = 0, ic = unspents.length; i < ic; i++) {
                                const unspent = unspents[i]
                                if (unspent.confirmations > 0 && !unspent.isRequired) {
                                    unspents[i].isRequired = true
                                    foundToMore = true
                                }
                            }
                            if (!foundToMore) {
                                for (let i = 0, ic = unspents.length; i < ic; i++) {
                                    const unspent = unspents[i]
                                    if (!unspent.isRequired) {
                                        unspents[i].isRequired = true
                                        foundToMore = true
                                    }
                                }
                            }
                            BlocksoftCryptoLog.log(this._settings.currencyCode + ' DogeTransferProcessor.getFeeRate foundToMore ' + JSON.stringify(foundToMore))
                            if (foundToMore) {
                                try {
                                    const preparedInputsOutputs2 = await this.txPrepareInputsOutputs.getInputsOutputs(data, unspents, {
                                        feeForByte,
                                        autoFeeLimitReadable
                                    },
                                        additionalData, subtitle + ' foundToMore')
                                    actualFeeRebuild = false
                                    if (preparedInputsOutputs2.inputs.length > 0) {
                                        preparedInputsOutputs = preparedInputsOutputs2
                                    }
                                } catch (e) {
                                    // do nothing
                                }
                            }
                        }
                    }
                } while (doBuild)
            } catch (e) {
                if (config.debug.cryptoErrors) {
                    console.log(this._settings.currencyCode + ' DogeTransferProcessor.getRawTx error ' + e.message)
                    /*
                    console.log('')
                    console.log('')
                    if (preparedInputsOutputs.inputs) {
                        let i = 0
                        for (let input of preparedInputsOutputs.inputs) {
                            console.log('ERR inputs [' + i + ']', JSON.parse(JSON.stringify(input)))
                            i++
                        }
                    }
                    if (preparedInputsOutputs.outputs) {
                        let i = 0
                        for (let output of preparedInputsOutputs.outputs) {
                            console.log('ERR outputs [' + i + ']', JSON.parse(JSON.stringify(output)))
                            i++
                        }
                    }
                    console.log('ERR fee msg ', preparedInputsOutputs.msg)
                    console.log('ERR diffInOutS', logInputsOutputs.diffInOut)
                    console.log('ERR diffInOutR', logInputsOutputs.diffInOutReadable)
                    console.log('---------------------')
                    console.log('')
                    */
                }
                BlocksoftCryptoLog.log(this._settings.currencyCode + ' DogeTransferProcessor.getRawTx error '+ e.message)
                MarketingEvent.logOnlyRealTime('v20_doge_error_tx_builder_fees ' + this._settings.currencyCode + ' ' + data.addressFrom + ' => ' + data.addressTo + ' ' + e.message.toString(), logInputsOutputs)

                if (e.message.indexOf('Transaction has absurd fees') !== -1) {
                    isError = 'SERVER_RESPONSE_TOO_BIG_FEE_PER_BYTE_FOR_TRANSACTION'
                    continue
                } else {
                    throw e
                }
            }

            isError = false
            // @ts-ignore
            blockchainData.unspents = unspents
            // @ts-ignore
            blockchainData.isTransferAll = data.isTransferAll
            blockchainData.isRBFed = { transactionRemoveByFee, transactionReplaceByFee, transactionSpeedUp }


            if (typeof uniqueFees[logInputsOutputs.diffInOut] !== 'undefined') {
                continue
            }
            result.fees.push(
                {
                    langMsg: this._langPrefix + '_' + key,
                    feeForByte: actualFeeForByte.toString(),
                    needSpeed: feeForByte.toString(),
                    feeForTx: logInputsOutputs.diffInOut,
                    amountForTx: logInputsOutputs.sendBalance,
                    addressToTx: data.addressTo,
                    blockchainData
                }
            )
            uniqueFees[logInputsOutputs.diffInOut] = true
        }
        if (isError) {
            throw new Error(isError)
        }
        result.selectedFeeIndex = result.fees.length - 1

        if (!transactionReplaceByFee && !transactionRemoveByFee) {
            let foundFast = false
            for (const fee of result.fees) {
                if (fee.langMsg === this._langPrefix + '_speed_blocks_2') {
                    foundFast = true
                }
            }
            if (!foundFast) {
                result.showSmallFeeNotice = new Date().getTime()
            }
        }

        return result
    }

    async getTransferAllBalance(data: BlocksoftBlockchainTypes.TransferData, privateData: BlocksoftBlockchainTypes.TransferPrivateData, additionalData: BlocksoftBlockchainTypes.TransferAdditionalData = {}): Promise<BlocksoftBlockchainTypes.TransferAllBalanceResult> {
        data.isTransferAll = true
        const result = await this.getFeeRate(data, privateData, additionalData)
        // @ts-ignore
        if (!result || result.selectedFeeIndex < 0) {
            return {
                selectedTransferAllBalance: '0',
                selectedFeeIndex: -2,
                fees: [],
                countedForBasicBalance: data.amount
            }
        }
        // @ts-ignore
        return {
            ...result,
            selectedTransferAllBalance: result.fees[result.selectedFeeIndex].amountForTx,
            countedForBasicBalance: data.amount
        }
    }

    async sendTx(data: BlocksoftBlockchainTypes.TransferData, privateData: BlocksoftBlockchainTypes.TransferPrivateData, uiData: BlocksoftBlockchainTypes.TransferUiData): Promise<BlocksoftBlockchainTypes.SendTxResult> {
        if (typeof uiData.selectedFee.blockchainData === 'undefined' && typeof uiData.selectedFee.feeForTx === 'undefined') {
            throw new Error('SERVER_RESPONSE_PLEASE_SELECT_FEE')
        }

        if (typeof privateData.privateKey === 'undefined') {
            throw new Error('DOGE transaction required privateKey')
        }
        if (typeof data.addressTo === 'undefined') {
            throw new Error('DOGE transaction required addressTo')
        }

        let txRBFed = ''
        let txRBF = false
        if (typeof data.transactionRemoveByFee !== 'undefined' && data.transactionRemoveByFee) {
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' DogeTransferProcessor.sendTx remove started ' + data.transactionRemoveByFee)
            txRBF = data.transactionRemoveByFee
            txRBFed = 'RBFremoved'
        } else if (typeof data.transactionReplaceByFee !== 'undefined' && data.transactionReplaceByFee) {
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' DogeTransferProcessor.sendTx resend started ' + data.transactionReplaceByFee)
            txRBF = data.transactionReplaceByFee
            txRBFed = 'RBFed'
        } else {
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' DogeTransferProcessor.sendTx started')
            txRBFed = 'usualSend'
        }


        const logData = {}
        logData.currencyCode = this._settings.currencyCode
        logData.selectedFee = uiData.selectedFee
        logData.from = data.addressFrom
        logData.basicAddressTo = data.addressTo
        logData.basicAmount = data.amount
        logData.pushLocale = sublocale()
        logData.pushSetting = await settingsActions.getSetting('transactionsNotifs')

        let result = {} as BlocksoftBlockchainTypes.SendTxResult
        try {
            result = await this.sendProvider.sendTx(uiData.selectedFee.blockchainData.rawTxHex, txRBFed, txRBF, logData)
            result.transactionFee = uiData.selectedFee.feeForTx
            result.transactionFeeCurrencyCode = this._settings.currencyCode
            result.transactionJson = {
                nSequence: uiData.selectedFee.blockchainData.nSequence,
                txAllowReplaceByFee: uiData.selectedFee.blockchainData.txAllowReplaceByFee,
                feeForByte: uiData.selectedFee.feeForByte
            }
            if (txRBF) {
                await DogeRawDS.cleanRaw({
                    address: data.addressFrom,
                    currencyCode: this._settings.currencyCode,
                    transactionHash: txRBF
                })
            }
            const transactionLog = typeof result.logData !== 'undefined' ? result.logData : logData
            const inputsLog = JSON.stringify(uiData.selectedFee.blockchainData.preparedInputsOutputs.inputs)
            const transactionRaw = uiData.selectedFee.blockchainData.rawTxHex + ''
            //if (typeof transactionLog.selectedFee !== 'undefined' && typeof transactionLog.selectedFee.blockchainData !== 'undefined') {
            //    transactionLog.selectedFee.blockchainData = '*'
            //}
            await DogeRawDS.saveRaw({
                address: data.addressFrom,
                currencyCode: this._settings.currencyCode,
                transactionHash: result.transactionHash,
                transactionRaw,
                transactionLog
            })
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' DogeTransferProcessor.sendTx hex ', uiData.selectedFee.blockchainData.rawTxHex)
            // @ts-ignore
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' DogeTransferProcessor.sendTx result ', result)
            await DogeRawDS.saveInputs({
                address: data.addressFrom,
                currencyCode: this._settings.currencyCode,
                transactionHash: result.transactionHash,
                transactionRaw: inputsLog
            })
            await DogeRawDS.saveJson({
                address: data.addressFrom,
                currencyCode: this._settings.currencyCode,
                transactionHash: result.transactionHash,
                transactionRaw: JSON.stringify(result.transactionJson)
            })

            BlocksoftCryptoLog.log(this._settings.currencyCode + ' DogeTransferProcessor.sent ' + data.addressFrom + ' done ' + JSON.stringify(result.transactionJson))
        } catch (e) {
            if (config.debug.cryptoErrors) {
                console.log(this._settings.currencyCode + ' DogeTransferProcessor.sent error', e, uiData)
            }
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' DogeTransferProcessor.sent error '+ e.message)
            // noinspection ES6MissingAwait
            MarketingEvent.logOnlyRealTime('v20_doge_tx_error ' + this._settings.currencyCode + ' ' + data.addressFrom + ' => ' + data.addressTo + ' ' + e.message, logData)
            throw e
        }
        // noinspection ES6MissingAwait
        MarketingEvent.logOnlyRealTime('v20_doge_tx_success ' + this._settings.currencyCode + ' ' + data.addressFrom + ' => ' + data.addressTo, logData)

        if (config.debug.cryptoErrors) {
            console.log(this._settings.currencyCode + ' DogeTransferProcessor.sendTx result', JSON.parse(JSON.stringify(result)))
        }
        return result
    }

    async sendRawTx(data: BlocksoftBlockchainTypes.DbAccount, rawTxHex: string, txRBF : any, logData : any): Promise<string> {
        this._initProviders()
        const result = await this.sendProvider.sendTx(rawTxHex, 'rawSend', txRBF, logData)
        return result.transactionHash
    }

    async setMissingTx(data: BlocksoftBlockchainTypes.DbAccount, transaction: BlocksoftBlockchainTypes.DbTransaction): Promise<boolean> {
        DogeRawDS.cleanRaw({
            address: data.address,
            transactionHash: transaction.transactionHash,
            currencyCode: this._settings.currencyCode
        })
        MarketingEvent.logOnlyRealTime('v20_doge_tx_set_missing ' + this._settings.currencyCode + ' ' + data.address + ' => ' + transaction.addressTo, transaction)
        return true
    }

    canRBF(data: BlocksoftBlockchainTypes.DbAccount, transaction: BlocksoftBlockchainTypes.DbTransaction): boolean {
        if (transaction.transactionDirection === 'income') {
            return true
        }
        if (typeof transaction.transactionJson !== 'undefined') {
            // console.log('transaction.transactionJson', JSON.stringify(transaction.transactionJson))
        }
        return true
    }
}
