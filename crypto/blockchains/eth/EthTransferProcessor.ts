/**
 * @author Ksu
 * @version 0.20
 */
import BlocksoftUtils from '../../common/BlocksoftUtils'
import BlocksoftCryptoLog from '../../common/BlocksoftCryptoLog'

import EthTmpDS from './stores/EthTmpDS'

import EthEstimateGas from './ext/EthEstimateGas'
import EthBasic from './basic/EthBasic'
import EthNetworkPrices from './basic/EthNetworkPrices'
import EthTxSendProvider from './basic/EthTxSendProvider'

import MarketingEvent from '../../../app/services/Marketing/MarketingEvent'
import BlocksoftDispatcher from '../BlocksoftDispatcher'
import { BlocksoftBlockchainTypes } from '../BlocksoftBlockchainTypes'

import config from '../../../app/config/config'
import settingsActions from '../../../app/appstores/Stores/Settings/SettingsActions'
import BlocksoftExternalSettings from '../../common/BlocksoftExternalSettings'
import { sublocale } from '../../../app/services/i18n'

export default class EthTransferProcessor extends EthBasic implements BlocksoftBlockchainTypes.TransferProcessor {


    _useThisBalance: boolean = true

    needPrivateForFee(): boolean {
        return false
    }

    checkSendAllModal(data: { currencyCode: any }): boolean {
        return true
    }

    async getFeeRate(data: BlocksoftBlockchainTypes.TransferData, privateData?: BlocksoftBlockchainTypes.TransferPrivateData, additionalData: BlocksoftBlockchainTypes.TransferAdditionalData = {}): Promise<BlocksoftBlockchainTypes.FeeRateResult> {
        let txRBFed = ''
        let txRBF = false
        if (typeof data.transactionRemoveByFee !== 'undefined' && data.transactionRemoveByFee) {
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthTransferProcessor.getFeeRate remove started ' + data.transactionRemoveByFee)
            txRBF = data.transactionRemoveByFee
            txRBFed = 'RBFremoved'
        } else if (typeof data.transactionReplaceByFee !== 'undefined' && data.transactionReplaceByFee) {
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthTransferProcessor.getFeeRate resend started ' + data.transactionReplaceByFee)
            txRBF = data.transactionReplaceByFee
            txRBFed = 'RBFed'
        } else {
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthTransferProcessor.getFeeRate started')
            txRBFed = 'usualSend'
            if (data.addressTo !== '' && (data.addressTo.indexOf('0x') === -1 || data.addressTo.indexOf('0x') !== 0)) {
                throw new Error('SERVER_RESPONSE_BAD_DESTINATION')
            }
        }

        let oldGasPrice = -1
        let oldNonce = -1
        let nonceLog = ''
        if (txRBF) {
            oldGasPrice = typeof data.transactionJson !== 'undefined' && typeof data.transactionJson.gasPrice !== 'undefined' ? data.transactionJson.gasPrice : false
            oldNonce = typeof data.transactionJson !== 'undefined' && typeof data.transactionJson.nonce !== 'undefined' ? data.transactionJson.nonce : false
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthTransferProcessor.getFeeRate ' + data.addressFrom + ' rbf preset nonceForTx ' + oldNonce)
            if (oldGasPrice === false) {
                try {
                    const ethProvider = BlocksoftDispatcher.getScannerProcessor(data.currencyCode)
                    const scannedTx = await ethProvider.getTransactionBlockchain(txRBF)
                    if (scannedTx) {
                        oldGasPrice = scannedTx.gasPrice
                        oldNonce = scannedTx.nonce
                        BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthTransferProcessor.getFeeRate ' + data.addressFrom + ' rbf reloaded nonceForTx ' + oldNonce)
                    }
                    if (!oldGasPrice) {
                        BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthTransferProcessor.getFeeRate ' + txRBFed + ' no gasPrice for ' + txRBF)
                    }
                } catch (e) {
                    BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthTransferProcessor.getFeeRate ' + txRBFed + 'not loaded gasPrice for ' + txRBF + ' ' + e.message)
                }
            }
            nonceLog += ' txRBFNonce ' + oldNonce
        } else if (typeof additionalData.nonceForTx !== 'undefined' && additionalData.nonceForTx !== -1) {
            oldNonce = additionalData.nonceForTx
            nonceLog += ' customFeeNonce ' + oldNonce
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthTransferProcessor.getFeeRate ' + data.addressFrom + ' custom nonceForTx ' + additionalData.nonceForTx)
        } else {
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthTransferProcessor.getFeeRate ' + data.addressFrom + ' no nonceForTx')
        }


        let gasPrice

        let maxNonceLocal = await EthTmpDS.getMaxNonce(data.addressFrom)
        const ethAllowBlockedBalance = await settingsActions.getSetting('ethAllowBlockedBalance')
        const ethAllowLongQuery = await settingsActions.getSetting('ethAllowLongQuery')

        const proxyPriceCheck = await EthNetworkPrices.getWithProxy(typeof data.addressFrom !== 'undefined' ? data.addressFrom : 'none', {
            data,
            additionalData,
            feesSource: 'EthTransferProcessor',
            feesOldNonce: oldNonce,
            ethAllowBlockedBalance,
            ethAllowLongQuery,
            maxNonceLocal
        })
        if (typeof additionalData.gasPrice !== 'undefined') {
            if (this._settings.currencyCode === 'BNB_SMART') {
                gasPrice = { 'speed_blocks_2': additionalData.gasPrice }
            } else {
                gasPrice = { 'speed_blocks_12': additionalData.gasPrice }
            }
        } else if (typeof additionalData.prices !== 'undefined' && additionalData.prices) {
            gasPrice = additionalData.prices
        } else {
            gasPrice = typeof proxyPriceCheck.gasPrice !== 'undefined' && proxyPriceCheck.gasPrice ? proxyPriceCheck.gasPrice : { 'speed_blocks_12': '10' }
            if (typeof proxyPriceCheck.maxNonceLocal !== 'undefined' && proxyPriceCheck.maxNonceLocal) {
                maxNonceLocal = proxyPriceCheck.maxNonceLocal
            }
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthTransferProcessor.getFeeRate ' + data.addressFrom + ' proxyPriceCheck', proxyPriceCheck)
        }

        let gasLimit
        try {
            if (typeof additionalData === 'undefined' || typeof additionalData.estimatedGas === 'undefined' || !additionalData.estimatedGas) {
                try {
                    let ok = false
                    let i = 0
                    do {
                        try {

                            gasLimit = await EthEstimateGas(this._web3Link, gasPrice.speed_blocks_2 || gasPrice.speed_blocks_12, data.addressFrom, data.addressTo, data.amount) // it doesn't matter what the price of gas is, just a required parameter

                            BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthTransferProcessor.getFeeRate estimatedGas ' + gasLimit)

                            // @ts-ignore
                            MarketingEvent.logOnlyRealTime('v20_eth_gas_limit ' + this._settings.currencyCode + ' ' + data.addressFrom + ' => ' + data.addressTo, {
                                amount: data.amount + '',
                                gasLimit
                            })
                            ok = true
                        } catch (e1) {
                            ok = false
                            i++
                            if (i > 3) {
                                throw e1
                            }
                        }
                    } while (!ok)
                } catch (e) {
                    if (e.message.indexOf('resolve host') !== -1) {
                        throw new Error('SERVER_RESPONSE_NOT_CONNECTED')
                    } else {
                        e.message += ' in EthEstimateGas in getFeeRate'
                        throw e
                    }
                }
            } else {
                gasLimit = additionalData.estimatedGas
                BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthTransferProcessor.getFeeRate preestimatedGas ' + gasLimit)
            }
        } catch (e) {
            throw new Error(e.message + ' in get gasLimit')
        }

        let showBigGasNotice = false
        try {
            if (gasLimit * 1 > BlocksoftExternalSettings.getStatic('ETH_GAS_LIMIT') * 1) {
                showBigGasNotice = true
            }
        } catch (e) {
            throw new Error(e.message + ' in get showBigGasNotice')
        }

        if (!gasLimit) {
            throw new Error('invalid transaction (no gas limit)')
        }

        // @ts-ignore
        BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthTransferProcessor.getFeeRate prefinished', {
            gasPrice,
            gasLimit
        })

        const result: BlocksoftBlockchainTypes.FeeRateResult = {} as BlocksoftBlockchainTypes.FeeRateResult
        result.fees = []

        let balance = '0'
        let actualCheckBalance
        let nonceForTx
        let isNewNonce = true
        if (typeof data.transactionJson !== 'undefined' && typeof data.transactionJson.nonce !== 'undefined' && data.transactionJson.nonce) {
            nonceForTx = data.transactionJson.nonce
            nonceLog += ' from transactionJSON'
        } else {
            let nonceForTxBasic = maxNonceLocal.maxValue * 1 > maxNonceLocal.maxScanned * 1 ? maxNonceLocal.maxValue : maxNonceLocal.maxScanned
            if (proxyPriceCheck && typeof proxyPriceCheck.newNonce !== 'undefined') {
                nonceForTxBasic = proxyPriceCheck.newNonce
                if (typeof proxyPriceCheck.logNonce !== 'undefined') {
                    nonceLog += ' from serverCheck ' + proxyPriceCheck.logNonce
                } else {
                    nonceLog += ' from serverCheckNoLog '
                }
                if (MarketingEvent.DATA.LOG_TESTER && typeof proxyPriceCheck.newNonceDEBUG !== 'undefined') {
                    nonceForTxBasic = proxyPriceCheck.newNonceDEBUG
                    nonceLog += ' used newNonceDEBUG'
                } else {
                    nonceLog += ' used newNonce '
                }

                if (nonceForTxBasic === 'maxValue+1') {
                    if (maxNonceLocal.maxValue * 1 > -1) {
                        nonceForTxBasic = maxNonceLocal.maxValue + 1
                        nonceLog += ' usedMax ' + JSON.stringify(maxNonceLocal)
                    } else {
                        nonceForTxBasic = -1
                        nonceLog += ' noMax => -1 '
                    }
                }
                nonceLog += ' nonceForTxBasic ' + nonceForTxBasic

            } else if (nonceForTxBasic * 1 >= 0) {
                nonceLog += ' used localNonce ' +  JSON.stringify(maxNonceLocal)
                nonceLog += ' nonceForTxBasic ' + nonceForTxBasic
                nonceForTxBasic = nonceForTxBasic * 1 + 1
            } else {
                nonceLog += ' used noLocalNoServer ' + JSON.stringify(nonceForTxBasic)
            }

            if (oldNonce !== false && oldNonce * 1 > -1 && oldNonce !== nonceForTxBasic) {
                nonceForTx = oldNonce
                isNewNonce = false
                nonceLog = 'recheck oldNonce ' + oldNonce + ' with basic ' + nonceForTxBasic + nonceLog
                BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthTransferProcessor.getFeeRate ' + data.addressFrom + ' ' + nonceLog)
            } else {
                nonceForTx = nonceForTxBasic
                isNewNonce = true
                nonceLog = 'recheck nonce ' + oldNonce + ' replaced by basic ' + nonceForTxBasic + nonceLog
                BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthTransferProcessor.getFeeRate ' + data.addressFrom + ' ' + nonceLog)
            }
        }

        if (data.isTransferAll && this._useThisBalance) {
            balance = data.amount
            actualCheckBalance = true
        } else {
            try {
                // @ts-ignore
                balance = additionalData.balance || await this._web3.eth.getBalance(data.addressFrom)
                // @ts-ignore
                if (!balance || balance * 1 === 0) {
                    BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthTxProcessor.getFeeRate balanceFromWeb3 is empty ' + balance)
                    actualCheckBalance = false
                } else {
                    actualCheckBalance = true
                }
            } catch (e) {
                actualCheckBalance = false
            }
        }
        const titles = ['eth_speed_slow', 'eth_speed_medium', 'eth_speed_fast']
        const keys = ['speed_blocks_12', 'speed_blocks_6', 'speed_blocks_2']
        let skippedByOld = false
        let prevGasPrice = 0
        for (let index = 0; index <= 2; index++) {
            const key = keys[index]
            if (typeof gasPrice[key] === 'undefined') continue
            if (gasPrice[key] <= oldGasPrice) {
                skippedByOld = true
                continue
            }
            let fee = BlocksoftUtils.mul(gasPrice[key], gasLimit)
            let amount = data.amount
            let newGasPrice = gasPrice[key].toString()
            if (actualCheckBalance) {
                const tmp = BlocksoftUtils.diff(balance, fee).toString()
                if (this._useThisBalance) {
                    if (tmp * 1 < 0) {
                        continue
                    }
                    if (data.isTransferAll) {
                        amount = tmp
                    } else {
                        const tmp2 = BlocksoftUtils.diff(tmp, amount).toString()
                        if (tmp2 * 1 < 0) {
                            continue
                        }
                    }
                } else {
                    if (tmp * 1 < 0) {
                        const tmpGasPrice = BlocksoftUtils.div(balance, gasLimit).toString()
                        if (BlocksoftUtils.diff(tmpGasPrice, prevGasPrice).toString() * 1 > 0) {
                            fee = balance
                            newGasPrice = tmpGasPrice.split('.')[0]
                        } else {
                            continue
                        }
                    }
                }
            }
            if (typeof newGasPrice === 'undefined' || newGasPrice === 'undefined') {
                newGasPrice = '0'
            } else {
                newGasPrice = newGasPrice.toString()
            }
            const tmp = {
                langMsg: titles[index],
                gasPrice: newGasPrice,
                gasPriceGwei: newGasPrice !== '0' ? BlocksoftUtils.toGwei(newGasPrice).toString() : '0',
                gasLimit: gasLimit.toString(),
                feeForTx: fee.toString(),
                nonceForTx,
                nonceLog,
                amountForTx: amount
            }
            prevGasPrice = tmp.gasPrice
            BlocksoftCryptoLog.log('EthTxProcessor.getFeeRate feeForTx ' + titles[index] + ' ' + tmp.feeForTx + ' with gasPrice ' + tmp.gasPrice + ' / gasLimit ' + tmp.gasLimit)
            result.fees.push(tmp)
        }

        prevGasPrice = 0
        if (txRBF) {
            if (result.fees.length < 2) {
                for (let index = 0; index <= 2; index++) {
                    if (typeof result.fees[index] !== 'undefined') {
                        result.fees[index].langMsg = titles[index]
                        continue
                    }
                    let newGasPrice = Math.round(oldGasPrice * (10 + index + 1) / 10)
                    const title = titles[index]
                    const key = keys[index]
                    const needSpeed = gasPrice[key]
                    if (newGasPrice < gasPrice[key]) {
                        newGasPrice = gasPrice[key]
                    }
                    let fee = BlocksoftUtils.mul(newGasPrice, gasLimit)
                    let amount = data.amount
                    if (actualCheckBalance) {
                        const tmp = BlocksoftUtils.diff(balance, fee).toString()
                        if (this._useThisBalance) {
                            if (tmp * 1 < 0) {
                                continue
                            }
                            if (data.isTransferAll) {
                                amount = tmp
                            } else {
                                const tmp2 = BlocksoftUtils.diff(tmp, amount).toString()
                                if (tmp2 * 1 < 0) {
                                    amount = tmp
                                }
                            }
                        } else {
                            if (tmp * 1 < 0) {
                                const tmpGasPrice = BlocksoftUtils.div(balance, gasLimit).toString()
                                if (BlocksoftUtils.diff(tmpGasPrice, prevGasPrice).toString() * 1 > 0) {
                                    fee = balance
                                    newGasPrice = tmpGasPrice
                                } else {
                                    continue
                                }
                            }
                        }
                    }

                    if (typeof newGasPrice === 'undefined') {
                        newGasPrice = '0'
                    } else {
                        newGasPrice = newGasPrice.toString()
                    }

                    const tmp = {
                        langMsg: title,
                        gasPrice: newGasPrice,
                        gasPriceGwei: newGasPrice !== '0' ? BlocksoftUtils.toGwei(newGasPrice).toString() : '0',
                        gasLimit: gasLimit.toString(),
                        feeForTx: fee.toString(),
                        amountForTx: amount,
                        nonceForTx,
                        nonceLog,
                        needSpeed
                    }
                    // @ts-ignore
                    prevGasPrice = tmp.gasPrice
                    BlocksoftCryptoLog.log('EthTxProcessor.getFeeRate feeForTx rbfFaster ' + tmp.feeForTx + ' with gasPrice ' + tmp.gasPrice + ' / gasLimit ' + tmp.gasLimit)
                    result.fees.push(tmp)
                }
            }
        }


        if (balance !== '0' && result.fees.length === 0) {
            const index = 0
            let feeForTx
            let amountForTx = data.amount
            let leftForFee = balance
            if (this._useThisBalance && !data.isTransferAll) {
                if (txRBF) {
                    leftForFee = BlocksoftUtils.diff(balance, BlocksoftUtils.div(data.amount, 2)) // if eth is transferred and paid in eth - so amount is not changed except send all
                } else {
                    leftForFee = BlocksoftUtils.diff(balance, data.amount) // if eth is transferred and paid in eth - so amount is not changed except send all
                }
            }

            let fee = BlocksoftUtils.div(leftForFee, gasLimit)
            if (fee) {
                const tmp = fee.split('.')
                if (tmp) {
                    fee = tmp[0]
                    feeForTx = BlocksoftUtils.mul(fee, gasLimit)
                    if (this._useThisBalance && (data.isTransferAll || txRBF)) {
                        amountForTx = BlocksoftUtils.diff(balance, feeForTx) // change amount for send all calculations
                        if (txRBF) {
                            result.shouldChangeBalance = true
                        }
                    }
                } else {
                    feeForTx = 0
                }
            } else {
                feeForTx = 0
            }
            if (!feeForTx) {
                throw new Error('SERVER_RESPONSE_NOT_ENOUGH_AMOUNT_FOR_ANY_FEE')
            }
            if (typeof fee === 'undefined') {
                fee = '0'
            } else {
                fee = fee.toString()
            }
            const tmp = {
                langMsg: 'eth_speed_slowest',
                gasPrice: fee,
                gasPriceGwei: fee !== '0' ? BlocksoftUtils.toGwei(fee).toString() : fee,
                gasLimit: gasLimit.toString(),
                feeForTx,
                amountForTx,
                nonceForTx,
                nonceLog,
                needSpeed: gasPrice[keys[index]].toString()
            }

            BlocksoftCryptoLog.log('EthTxProcessor.getFeeRate feeForTx ' + titles[index] + ' ' + tmp.feeForTx + ' corrected for balance ' + balance + ' with gasPrice ' + tmp.gasPrice + ' / gasLimit ' + tmp.gasLimit)
            if (tmp.gasPrice > 0) {
                result.fees.push(tmp)
            } else {
                throw new Error('SERVER_RESPONSE_NOT_ENOUGH_AMOUNT_FOR_ANY_FEE')
            }
        }

        if (!skippedByOld) {
            let foundFast = false
            for (const fee of result.fees) {
                if (fee.langMsg === 'eth_speed_fast') {
                    foundFast = true
                }
            }
            if (!foundFast) {
                result.showSmallFeeNotice = new Date().getTime()
            }
        }

        result.selectedFeeIndex = result.fees.length - 1
        result.countedForBasicBalance = actualCheckBalance ? balance : '0'
        if (!txRBF) {
            let check = ethAllowBlockedBalance !== '1' && isNewNonce && maxNonceLocal.amountBlocked && typeof maxNonceLocal.amountBlocked[this._settings.currencyCode] !== 'undefined'
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthTransferProcessor.getFees ethAllowBlockedBalance '
                + ethAllowBlockedBalance + ' isNewNonce ' + isNewNonce + ' oldNonce ' + oldNonce
                + ' amountBlocked ' + JSON.stringify(maxNonceLocal.amountBlocked) + ' => '
                + (check ? 'true' : 'false'))
            if (check) {
                try {
                    const diff = BlocksoftUtils.diff(result.countedForBasicBalance, maxNonceLocal.amountBlocked[this._settings.currencyCode]).toString()
                    const diffAmount = BlocksoftUtils.diff(diff, data.amount).toString()
                    BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthTransferProcessor.getFees balance '
                        + result.countedForBasicBalance + ' - blocked ' + maxNonceLocal.amountBlocked[this._settings.currencyCode] + ' = left Balance ' + diff + ' => left Amount ' + diffAmount)
                    if (diff.indexOf('-') !== -1) {
                        result.showBlockedBalanceNotice = new Date().getTime()
                        result.showBlockedBalanceFree = '0 ' + this._settings.currencySymbol
                    } else {
                        if (diffAmount.indexOf('-') !== -1) {
                            result.showBlockedBalanceNotice = new Date().getTime()
                            result.showBlockedBalanceFree = BlocksoftUtils.toUnified(diff, this._settings.decimals) + ' ' + this._settings.currencySymbol
                        }
                    }
                } catch (e) {
                    if (config.debug.cryptoErrors) {
                        BlocksoftCryptoLog.log(' EthTransferProcessor.getFees ethAllowBlockedBalance inner error ' + e.message)
                    }
                    BlocksoftCryptoLog.log(' EthTransferProcessor.getFees ethAllowBlockedBalance inner error ' + e.message)
                }
            }
            const LONG_QUERY = await BlocksoftExternalSettings.getStatic('ETH_LONG_QUERY')
            check = maxNonceLocal.queryLength * 1 >= LONG_QUERY * 1
            await BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthTransferProcessor.getFees ethAllowLongQuery '
                + ethAllowLongQuery + ' Query scanned ' + maxNonceLocal.maxScanned + ' success ' + maxNonceLocal.maxSuccess + ' length ' + maxNonceLocal.queryLength
                + ' txs ' + JSON.stringify(maxNonceLocal.queryTxs) + ' => '
                + (check ? 'true' : 'false')
            )
            if (check) {
                result.showLongQueryNotice = new Date().getTime()
                result.showLongQueryNoticeTxs = maxNonceLocal.queryTxs
            }

        } else {
            for (const fee of result.fees) {
                fee.showNonce = true
            }
        }

        result.showBigGasNotice = showBigGasNotice ? new Date().getTime() : 0
        return result
    }


    async getTransferAllBalance(data: BlocksoftBlockchainTypes.TransferData, privateData?: BlocksoftBlockchainTypes.TransferPrivateData, additionalData: BlocksoftBlockchainTypes.TransferAdditionalData = {}): Promise<BlocksoftBlockchainTypes.TransferAllBalanceResult> {
        BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthTransferProcessor.getTransferAllBalance ' + data.addressFrom + ' started')
        let balance = data.amount
        if (!data.amount || data.amount === '0') {
            try {
                // @ts-ignore
                balance = await this._web3.eth.getBalance(data.addressFrom).toString()
            } catch (e) {
                this.checkError(e, data)
            }
        }

        // @ts-ignore
        BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthTransferProcessor.getTransferAllBalance ' + data.addressFrom + ' => ' + balance)
        // noinspection EqualityComparisonWithCoercionJS
        if (balance === '0') {
            return {
                selectedTransferAllBalance: '0',
                selectedFeeIndex: -1,
                fees: [],
                countedForBasicBalance: '0'
            }
        }


        const fees = await this.getFeeRate(data, privateData, additionalData)
        if (!fees || fees.selectedFeeIndex < 0) {
            return {
                selectedTransferAllBalance: '0',
                selectedFeeIndex: -2,
                fees: [],
                countedForBasicBalance: '0'
            }
        }
        return {
            ...fees,
            selectedTransferAllBalance: fees.fees[fees.selectedFeeIndex].amountForTx,
            shouldChangeBalance: true
        }
    }

    async sendTx(data: BlocksoftBlockchainTypes.TransferData, privateData: BlocksoftBlockchainTypes.TransferPrivateData, uiData: BlocksoftBlockchainTypes.TransferUiData): Promise<BlocksoftBlockchainTypes.SendTxResult> {
        if (typeof privateData.privateKey === 'undefined') {
            throw new Error('ETH transaction required privateKey')
        }
        if (typeof data.addressTo === 'undefined') {
            throw new Error('ETH transaction required addressTo')
        }

        BlocksoftCryptoLog.log('sendTx', JSON.parse(JSON.stringify(data)))

        let txRBFed = ''
        let txRBF = false
        if (typeof data.transactionRemoveByFee !== 'undefined' && data.transactionRemoveByFee) {
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthTransferProcessor.sendTx started ' + data.transactionRemoveByFee)
            txRBF = data.transactionRemoveByFee
            txRBFed = 'RBFremoved'
        } else if (typeof data.transactionReplaceByFee !== 'undefined' && data.transactionReplaceByFee) {
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthTransferProcessor.sendTx resend started ' + data.transactionReplaceByFee)
            txRBF = data.transactionReplaceByFee
            txRBFed = 'RBFed'
        } else {
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthTransferProcessor.sendTx started')
            txRBFed = 'usualSend'
            if (data.addressTo !== '' && (data.addressTo.indexOf('0x') === -1 || data.addressTo.indexOf('0x') !== 0)) {
                throw new Error('SERVER_RESPONSE_BAD_DESTINATION')
            }
        }

        let finalGasPrice = 0
        let finalGasLimit = 0

        let selectedFee
        if (typeof uiData.selectedFee !== 'undefined' && typeof uiData.selectedFee.gasPrice !== 'undefined') {
            selectedFee = uiData.selectedFee
            // @ts-ignore
            finalGasPrice = uiData.selectedFee.gasPrice * 1
            // @ts-ignore
            finalGasLimit = Math.ceil(uiData.selectedFee.gasLimit * 1)
        } else {
            const fees = await this.getFeeRate(data, privateData)
            if (fees.selectedFeeIndex < 0) {
                throw new Error('SERVER_RESPONSE_NOTHING_LEFT_FOR_FEE')
            }
            selectedFee = fees.fees[fees.selectedFeeIndex]
            // @ts-ignore
            finalGasPrice = selectedFee.gasPrice * 1
            // @ts-ignoreф
            finalGasLimit = Math.ceil(selectedFee.gasLimit * 1)
        }

        // @ts-ignore
        BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthTransferProcessor.sendTx ' + txRBFed + ' feeForTx', {
            uiData,
            finalGasPrice,
            finalGasLimit
        })
        if (finalGasLimit === 0 || !finalGasLimit) {
            throw new Error('SERVER_PLEASE_SELECT_FEE')
        }
        if (finalGasPrice === 0 || !finalGasPrice) {
            throw new Error('SERVER_PLEASE_SELECT_FEE')
        }

        const tx: BlocksoftBlockchainTypes.EthTx = {
            from: data.addressFrom,
            to: data.addressTo.toLowerCase(),
            gasPrice: finalGasPrice,
            gas: finalGasLimit,
            value: data.amount
        }

        if (typeof data.blockchainData !== 'undefined') {
            tx.data = data.blockchainData // actual value for erc20 etc
        }

        const sender = new EthTxSendProvider(this._web3, this._trezorServerCode, this._settings)
        const logData = JSON.parse(JSON.stringify(tx))
        logData.currencyCode = this._settings.currencyCode
        logData.selectedFee = selectedFee
        logData.basicAddressTo = typeof data.basicAddressTo !== 'undefined' ? data.basicAddressTo.toLowerCase() : data.addressTo.toLowerCase()
        logData.basicAmount = typeof data.basicAmount !== 'undefined' ? data.basicAmount : data.amount
        logData.basicToken = typeof data.basicToken !== 'undefined' ? data.basicToken : ''
        logData.pushLocale = sublocale()
        logData.pushSetting = await settingsActions.getSetting('transactionsNotifs')

        let result = {} as BlocksoftBlockchainTypes.SendTxResult
        try {
            if (txRBF) {
                let oldNonce = typeof uiData.selectedFee.nonceForTx !== 'undefined' ? uiData.selectedFee.nonceForTx : false
                if (oldNonce === false || oldNonce === -1) {
                    // actually could remove as not used without receipt fee
                    oldNonce = typeof data.transactionJson !== 'undefined' && typeof data.transactionJson.nonce !== 'undefined' ? data.transactionJson.nonce : false
                }
                if (oldNonce === false || oldNonce === -1) {
                    try {
                        const ethProvider = BlocksoftDispatcher.getScannerProcessor(data.currencyCode)
                        const scannedTx = await ethProvider.getTransactionBlockchain(txRBF)
                        if (scannedTx) {
                            oldNonce = scannedTx.nonce
                        }
                    } catch (e) {
                        BlocksoftCryptoLog.err(this._settings.currencyCode + ' EthTransferProcessor.sent rbf not loaded nonce for ' + txRBF + ' ' + e.message)
                        throw new Error('System error: not loaded nonce for ' + txRBF)
                    }
                    if (oldNonce === false || oldNonce === -1) {
                        BlocksoftCryptoLog.err(this._settings.currencyCode + ' EthTransferProcessor.sent rbf no nonce for ' + txRBF)
                        throw new Error('System error: no nonce for ' + txRBF)
                    }
                }
                logData.setNonce = oldNonce
                tx.nonce = oldNonce
                result = await sender.send(tx, privateData, txRBF, logData)
                if (typeof data.blockchainData === 'undefined' || !data.blockchainData) {
                    result.amountForTx = data.amount
                }
                result.transactionFee = BlocksoftUtils.mul(finalGasPrice, finalGasLimit)
                result.transactionFeeCurrencyCode = 'ETH'
                result.addressTo = data.addressTo === data.addressFrom ? '' : data.addressTo
            } else {
                // @ts-ignore
                if (typeof uiData.selectedFee.nonceForTx !== 'undefined'
                    && (uiData.selectedFee.nonceForTx.toString() === '0' || uiData.selectedFee.nonceForTx)
                    && uiData.selectedFee.nonceForTx !== ''
                    && uiData.selectedFee.nonceForTx * 1 >= 0
                ) {
                    // @ts-ignore
                    tx.nonce = uiData.selectedFee.nonceForTx * 1
                    logData.setNonce = tx.nonce
                    logData.selectedFee.nonceLog = 'replacedByUi ' + uiData.selectedFee.nonceForTx + ' ' + (typeof logData.selectedFee.nonceLog !== 'undefined' ? logData.selectedFee.nonceLog : '')
                }
                BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthTransferProcessor.sent ' + data.addressFrom + ' nonceLog ' + logData.selectedFee.nonceLog)
                result = await sender.send(tx, privateData, txRBF, logData)
                result.transactionFee = BlocksoftUtils.mul(finalGasPrice, finalGasLimit)
                result.transactionFeeCurrencyCode = 'ETH'
                await EthTmpDS.getCache(data.addressFrom)
            }
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthTransferProcessor.sent ' + data.addressFrom + ' done ' + JSON.stringify(result.transactionJson))
        } catch (e) {
            if (config.debug.cryptoErrors) {
                console.log(this._settings.currencyCode + ' EthTransferProcessor.sent error ' + e.message, tx)
            }
            this.checkError(e, data, txRBF, logData)
        }
        // @ts-ignore
        logData.result = result
        // noinspection ES6MissingAwait
        MarketingEvent.logOnlyRealTime('v20_eth_tx_success ' + this._settings.currencyCode + ' ' + data.addressFrom + ' => ' + data.addressTo, logData)

        return result
    }

    async setMissingTx(data: BlocksoftBlockchainTypes.DbAccount, transaction: BlocksoftBlockchainTypes.DbTransaction): Promise<boolean> {
        if (typeof transaction.transactionJson !== 'undefined' && typeof transaction.transactionJson.nonce !== 'undefined') {
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthTransferPRocessor.setMissingTx remove nonce ' + transaction.transactionJson.nonce + ' ' + transaction.transactionHash)
            await EthTmpDS.removeNonce(data.address, 'send_' + transaction.transactionHash)
        }
        MarketingEvent.logOnlyRealTime('v20_eth_tx_set_missing ' + this._settings.currencyCode + ' ' + data.address + ' => ' + transaction.addressTo, transaction)
        return true
    }

    canRBF(data: BlocksoftBlockchainTypes.DbAccount, transaction: BlocksoftBlockchainTypes.DbTransaction, source: string): boolean {
        if (transaction.transactionDirection === 'income') {
            BlocksoftCryptoLog.log('EthTransferProcessor.canRBF ' + transaction.transactionHash + ' false by income')
            return false
        }
        if (typeof transaction.transactionJson !== 'undefined') {
            if (typeof transaction.transactionJson.delegatedNonce !== 'undefined') {
                BlocksoftCryptoLog.log('EthTransferProcessor.canRBF ' + transaction.transactionHash + ' false by delegated')
                return false
            }
            /*if (typeof transaction.transactionJson.nonce !== 'undefined') {
                const max = EthTmpDS.getMaxStatic(data.address)
                if (max.success > -1) {
                    // @ts-ignore
                    if (transaction.transactionJson.nonce * 1 > max.success * 1) return true
                    BlocksoftCryptoLog.log('EthTransferProcessor.canRBF  ' + transaction.transactionHash + ' false by maxSuccess',
                        {'nonce' : transaction.transactionJson.nonce, 'max' : max.success})
                    return false
                }
            }*/
        }
        return true
    }
}
