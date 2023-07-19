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
import abi721 from './ext/erc721.js'
import abi1155 from './ext/erc1155'
import BlocksoftAxios from '@crypto/common/BlocksoftAxios'
import OneUtils from '@crypto/blockchains/one/ext/OneUtils'

const _getGasLimit = async ({ additionalData, data, currencyCode, realAddressTo, web3, gasPrice, mainCurrencyCode }) => {
    let gasLimit = 0

    if (typeof additionalData !== 'undefined' && typeof additionalData.gasLimit !== 'undefined' && additionalData.gasLimit) {
        gasLimit = additionalData.gasLimit
        BlocksoftCryptoLog.log(currencyCode + ' EthTransferProcessor.getFeeRate preestimatedGas ' + gasLimit)
        return gasLimit
    }

    if (typeof data.dexOrderData !== 'undefined' && data.dexOrderData) {
        gasLimit = typeof data.dexOrderData[0].params.gas !== 'undefined' ? data.dexOrderData[0].params.gas : 0
        BlocksoftCryptoLog.log(currencyCode + ' EthTransferProcessor.getFeeRate dexOrderData ' + gasLimit)
        return gasLimit
    }

    if (typeof data.walletConnectData !== 'undefined' && typeof data.walletConnectData.gas !== 'undefined' && data.walletConnectData.gas && data.walletConnectData.gas !== '0x0') {
        gasLimit = BlocksoftUtils.hexToDecimalWalletConnect(data.walletConnectData.gas)
        BlocksoftCryptoLog.log(currencyCode + ' EthTransferProcessor.getFeeRate walletConnectData  ' + gasLimit)
        return gasLimit
    }

    if (typeof data.walletConnectData !== 'undefined' && typeof data.walletConnectData.gasLimit !== 'undefined' && data.walletConnectData.gasLimit && data.walletConnectData.gasLimit !== '0x0') {
        gasLimit = BlocksoftUtils.hexToDecimalWalletConnect(data.walletConnectData.gasLimit)
        BlocksoftCryptoLog.log(currencyCode + ' EthTransferProcessor.getFeeRate walletConnectData v2 ' + gasLimit)
        return gasLimit
    }

    if (typeof data.walletConnectData !== 'undefined') {
        let value = '0x'
        try {
            if (typeof data.amount !== 'undefined' && data.amount) {
                value = data.amount.indexOf('0x') === 0 ? data.amount : ('0x' + BlocksoftUtils.decimalToHex(data.amount))
            }
        } catch (e) {
            throw new Error(e.message + ' in walletConnectData value1 ' )
        }
        try {
            if (typeof data.walletConnectData.value !== 'undefined' && data.walletConnectData.value) {
                value = data.walletConnectData.value
            }
        } catch (e) {
            throw new Error(e.message + ' in walletConnectData value2 ' )
        }
        const params = {
            'jsonrpc': '2.0',
            'method': 'eth_estimateGas',
            'params': [
                {
                    'from': typeof data.walletConnectData.from && data.walletConnectData.from ? data.walletConnectData.from : data.addressFrom,
                    'to': typeof data.walletConnectData.to && data.walletConnectData.to ? data.walletConnectData.to : realAddressTo,
                    'data': typeof data.walletConnectData.data !== 'undefined' && data.walletConnectData.data ? data.walletConnectData.data : '0x'
                }
            ],
            'id': 1
        }
        if (value && value !== '0x') {
            params[0].value = value
        }
        BlocksoftCryptoLog.log(currencyCode + ' EthTransferProcessor.getFeeRate estimatedGas for WalletConnect start')
        let tmp = await BlocksoftAxios.postWithoutBraking(web3.LINK, params)
        if (typeof tmp !== 'undefined' && typeof tmp.data !== 'undefined') {
            try {
                if (typeof tmp.data.result !== 'undefined') {
                    gasLimit = BlocksoftUtils.hexToDecimalWalletConnect(tmp.data.result) * 1 + 150000
                } else if (typeof tmp.data.error !== 'undefined') {
                    throw new Error(tmp.data.error.message)
                }
            } catch (e) {
                if (config.debug.cryptoErrors) {
                    console.log(currencyCode + ' EthTransferProcessor.getFeeRate estimatedGas post response data ' + JSON.stringify(params), tmp.data)
                }
                throw new Error(e.message + ' in walletConnectData post response data ')
            }
        } else {
            gasLimit = 500000
        }

        BlocksoftCryptoLog.log(currencyCode + ' EthTransferProcessor.getFeeRate estimatedGas for WalletConnect result ' + gasLimit)
        return gasLimit
    }

    if (typeof data.contractCallData !== 'undefined' && typeof data.contractCallData.contractAddress !== 'undefined') {
        const schema = data.contractCallData.contractSchema
        let abiCode
        if (schema === 'ERC721') {
            abiCode = abi721.ERC721
        } else if (schema === 'ERC1155') {
            abiCode = abi1155.ERC1155
        } else {
            throw new Error('Contract abi not found ' + schema)
        }
        const token = new web3.eth.Contract(abiCode, data.contractCallData.contractAddress)

        gasLimit = 150000
        try {
            const tmpParams = data.contractCallData.contractActionParams
            for (let i = 0, ic = tmpParams.length; i < ic; i++) {
                if (tmpParams[i] === 'addressTo') {
                    tmpParams[i] = realAddressTo
                }
            }
            gasLimit = await token.methods[data.contractCallData.contractAction](...tmpParams).estimateGas({ from: data.addressFrom })
            if (gasLimit) {
                gasLimit = BlocksoftUtils.mul(gasLimit, 1.5)
            }
        } catch (e) {
            if (config.debug.cryptoErrors) {
                console.log(currencyCode + ' EthTransferProcessor data.contractCallData error ' + e.message)
            }
            BlocksoftCryptoLog.log(currencyCode + ' EthTransferProcessor data.contractCallData error ' + e.message)
            // do nothing
        }

        if (gasLimit <= 150000) {
            gasLimit = 150000
        }
        BlocksoftCryptoLog.log(currencyCode + ' EthTransferProcessor.getFeeRate contractCallData  ' + gasLimit)
        return gasLimit
    }
    
    try {
        let ok = false
        let i = 0
        let gasLimitNew = false
        do {
            try {
                i++
                gasLimitNew = await EthEstimateGas(web3.LINK, gasPrice.speed_blocks_2 || gasPrice.speed_blocks_12, data.addressFrom, realAddressTo, data.amount) // it doesn't matter what the price of gas is, just a required parameter
                BlocksoftCryptoLog.log(currencyCode + ' EthTransferProcessor.getFeeRate estimatedGas ' + gasLimit)
            } catch (e1) {
                ok = false
                if (i > 3) {
                    throw e1
                }
            }
        } while (!ok && i <= 5)
        if (gasLimitNew && typeof gasLimitNew !== 'undefined' && gasLimitNew * 1 > 0) {
            gasLimit = gasLimitNew * 1
        }
    } catch (e) {
        if (e.message.indexOf('resolve host') !== -1) {
            throw new Error('SERVER_RESPONSE_NOT_CONNECTED')
        } else {
            gasLimit = BlocksoftExternalSettings.getStatic('ETH_MIN_GAS_LIMIT')
            // e.message += ' in EthEstimateGas in getFeeRate'
            // throw e
        }
    }
    if (!gasLimit || typeof gasLimit !== 'undefined') {
        gasLimit = BlocksoftExternalSettings.getStatic('ETH_MIN_GAS_LIMIT')
    }

    const minGasLimit = BlocksoftExternalSettings.getStatic(mainCurrencyCode + '_MIN_GAS_LIMIT') * 1
    if (minGasLimit > 0 && gasLimit < minGasLimit) {
        gasLimit = minGasLimit
    }
    BlocksoftCryptoLog.log(currencyCode + ' EthTransferProcessor.getFeeRate usual  ' + gasLimit)
    return gasLimit

}

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

        this.checkWeb3CurrentServerUpdated()

        let realAddressTo = data.addressTo
        if (realAddressTo !== '' && OneUtils.isOneAddress(realAddressTo)) {
            realAddressTo = OneUtils.fromOneAddress(realAddressTo)
        }
        if (typeof data.transactionRemoveByFee !== 'undefined' && data.transactionRemoveByFee) {
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthTransferProcessor.getFeeRate remove started ' + data.transactionRemoveByFee)
            txRBF = data.transactionRemoveByFee
            txRBFed = 'RBFremoved'
        } else if (typeof data.transactionReplaceByFee !== 'undefined' && data.transactionReplaceByFee) {
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthTransferProcessor.getFeeRate resend started ' + data.transactionReplaceByFee)
            txRBF = data.transactionReplaceByFee
            txRBFed = 'RBFed'
        } else if (typeof data.dexOrderData !== 'undefined' && data.dexOrderData) {
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthTransferProcessor.getFeeRate dex ' + data.addressFrom + ' started')
        } else {
            const realAddressToLower = realAddressTo.toLowerCase()
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthTransferProcessor.getFeeRate ' + data.addressFrom + ' started')
            txRBFed = 'usualSend'
            if (realAddressTo !== '' && (realAddressToLower.indexOf('0x') === -1 || realAddressToLower.indexOf('0x') !== 0)) {
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

        let gasPrice = {}

        let maxNonceLocal = await EthTmpDS.getMaxNonce(this._mainCurrencyCode, data.addressFrom)
        const ethAllowBlockedBalance = await settingsActions.getSetting('ethAllowBlockedBalance')
        const ethAllowLongQuery = await settingsActions.getSetting('ethAllowLongQuery')

        const proxyPriceCheck = await EthNetworkPrices.getWithProxy(this._mainCurrencyCode,  this._isTestnet, typeof data.addressFrom !== 'undefined' ? data.addressFrom : 'none', {
            data,
            additionalData,
            feesSource: 'EthTransferProcessor',
            feesOldNonce: oldNonce,
            ethAllowBlockedBalance,
            ethAllowLongQuery,
            maxNonceLocal
        })

        if (typeof additionalData.gasPrice !== 'undefined' && additionalData.gasPrice) {
            if (typeof additionalData.gasPriceTitle !== 'undefined') {
                // @ts-ignore
                gasPrice[additionalData.gasPriceTitle] = additionalData.gasPrice
            } else {
                gasPrice = { 'speed_blocks_12': additionalData.gasPrice }
            }
        } else if (typeof additionalData.prices !== 'undefined' && additionalData.prices) {
            gasPrice = additionalData.prices
        } else if (proxyPriceCheck) {
            let tmp = 0
            if (typeof data.dexOrderData !== 'undefined' && data.dexOrderData) {
                tmp = typeof data.dexOrderData[0].params.gasPrice !== 'undefined' ? data.dexOrderData[0].params.gasPrice : 0
                if (tmp > 0) {
                    gasPrice = { 'speed_blocks_2': tmp }
                }
            } else if (typeof data.walletConnectData !== 'undefined' && typeof data.walletConnectData.gasPrice !== 'undefined' && data.walletConnectData.gasPrice) {
                tmp = BlocksoftUtils.hexToDecimalWalletConnect(data.walletConnectData.gasPrice)
                if (tmp > 0) {
                    gasPrice = { 'speed_blocks_2': tmp }
                }
            }
            if (!tmp) {
                gasPrice = typeof proxyPriceCheck.gasPrice !== 'undefined' && proxyPriceCheck.gasPrice ? proxyPriceCheck.gasPrice : { 'speed_blocks_12': '10' }
            }
            if (typeof proxyPriceCheck.maxNonceLocal !== 'undefined' && proxyPriceCheck.maxNonceLocal) {
                maxNonceLocal = proxyPriceCheck.maxNonceLocal
            }
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthTransferProcessor.getFeeRate ' + data.addressFrom + ' proxyPriceCheck', proxyPriceCheck)
        }

        if (typeof this._web3.LINK === 'undefined') {
            throw new Error('EthTransferProcessor need this._web3.LINK')
        }

        let gasLimit = 0
        try {
            gasLimit = await _getGasLimit({
                data,
                additionalData,
                currencyCode: this._settings.currencyCode,
                realAddressTo,
                web3: this._web3,
                gasPrice,
                mainCurrencyCode: this._mainCurrencyCode
            })
        } catch (e) {
            if (config.debug.cryptoErrors) {
                console.log(this._settings.currencyCode + ' EthTransferProcessor.getFeeRate error in get gasLimit ', e)
            }
            throw new Error(e.message + ' in get gasLimit')
        }

        let showBigGasNotice = false
        if (typeof additionalData === 'undefined' || typeof additionalData.isCustomFee === 'undefined' || !additionalData.isCustomFee) {
            try {
                const limit = BlocksoftExternalSettings.getStatic(this._mainCurrencyCode + '_GAS_LIMIT')
                if (gasLimit * 1 > limit * 1) {
                    showBigGasNotice = true
                }
            } catch (e) {
                throw new Error(e.message + ' in get showBigGasNotice')
            }
        }

        if (!gasLimit) {
            throw new Error('invalid transaction (no gas limit.2)')
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
        let nonceForTx = -1
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
                nonceLog += ' used localNonce ' + JSON.stringify(maxNonceLocal)
                nonceLog += ' nonceForTxBasic ' + nonceForTxBasic
                nonceForTxBasic = nonceForTxBasic * 1 + 1
            } else {
                nonceLog += ' used noLocalNoServer ' + JSON.stringify(nonceForTxBasic)
            }

            if (oldNonce !== false && oldNonce * 1 > -1 && oldNonce !== nonceForTxBasic) {
                nonceForTx = oldNonce
                isNewNonce = false
                nonceLog = 'recheck oldNonce ' + oldNonce + ' with basic ' + nonceForTxBasic + nonceLog
            } else {
                nonceForTx = nonceForTxBasic
                isNewNonce = true
                nonceLog = 'recheck nonce ' + oldNonce + ' replaced by basic ' + nonceForTxBasic + nonceLog
            }
            if (config.debug.cryptoErrors) {
                console.log(this._settings.currencyCode + ' EthTransferProcessor.getFeeRate ' + data.addressFrom + ' ' + nonceLog)
            }
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthTransferProcessor.getFeeRate ' + data.addressFrom + ' ' + nonceLog)
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
        const titlesChanged = ['eth_speed_slowest', 'eth_speed_medium_to_slow', 'eth_speed_fast_to_medium']
        const keys = ['speed_blocks_12', 'speed_blocks_6', 'speed_blocks_2']
        let skippedByOld = false
        let prevGasPrice = 0
        const feesOK = {}
        for (let index = 0; index <= 2; index++) {
            const key = keys[index]
            if (typeof gasPrice[key] === 'undefined') continue
            if (gasPrice[key] <= oldGasPrice) {
                skippedByOld = true
                continue
            }
            let fee = BlocksoftUtils.mul(gasPrice[key], gasLimit)
            let amount = data.amount
            let needSpeed = gasPrice[key].toString()
            let newGasPrice = needSpeed
            let changedFeeByBalance = false
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
                        if (tmpGasPrice && BlocksoftUtils.diff(tmpGasPrice, prevGasPrice).toString() * 1 > 0) {
                            fee = balance
                            newGasPrice = tmpGasPrice.split('.')[0]
                            changedFeeByBalance = true
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

            let langMsg = titles[index]
            if (changedFeeByBalance) {
                if (index > 0) {
                    langMsg = titlesChanged[index - 1]
                }
            }

            let gweiFee = 0
            try {
                gweiFee = newGasPrice !== '0' ? BlocksoftUtils.toGwei(newGasPrice).toString() : newGasPrice
            } catch (e) {
                BlocksoftCryptoLog.err('EthTxProcessor.getFeeRate newGasPrice to gwei error ' + e.message)
            }

            const tmp = {
                langMsg,
                gasPrice: newGasPrice,
                gasPriceGwei: gweiFee,
                gasLimit: gasLimit.toString(),
                feeForTx: fee.toString(),
                nonceForTx,
                nonceLog,
                needSpeed,
                ethAllowBlockedBalance,
                ethAllowLongQuery,
                isTransferAll: data.isTransferAll,
                amountForTx: amount
            }

            const diff = needSpeed - newGasPrice
            if (!changedFeeByBalance || diff * 1 < 1000) {
                feesOK[titles[index]] = tmp.gasPrice
            } else {
                BlocksoftCryptoLog.log('EthTxProcessor.getFeeRate skipped feesOk ' + titles[index] + '  as diff ' + diff + ' gasPrice ' + tmp.gasPrice + ' / gasLimit ' + tmp.gasLimit)
            }
            if (BlocksoftUtils.diff(newGasPrice, prevGasPrice).indexOf('-') === -1 && newGasPrice !== prevGasPrice) {
                prevGasPrice = tmp.gasPrice
                BlocksoftCryptoLog.log('EthTxProcessor.getFeeRate added feeForTx ' + titles[index] + ' ' + tmp.feeForTx + ' with gasPrice ' + tmp.gasPrice + ' / gasLimit ' + tmp.gasLimit)
                result.fees.push(tmp)
            } else {
                BlocksoftCryptoLog.log('EthTxProcessor.getFeeRate skipped feeForTx ' + titles[index] + ' ' + tmp.feeForTx + ' with gasPrice ' + tmp.gasPrice + ' / gasLimit ' + tmp.gasLimit)
            }
        }

        prevGasPrice = 0
        if (txRBF) {
            let recheck = result.fees.length < 2
            if (typeof additionalData.isCustomFee !== 'undefined' && additionalData.isCustomFee) {
                recheck = result.fees.length === 0
            }
            if (recheck) {
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
                        newGasPrice = BlocksoftUtils.round(newGasPrice)
                    }

                    let gweiFee = 0
                    try {
                        gweiFee = newGasPrice !== '0' ? BlocksoftUtils.toGwei(newGasPrice).toString() : newGasPrice
                    } catch (e) {
                        BlocksoftCryptoLog.err('EthTxProcessor.getFeeRate newGasPrice2 to gwei error ' + e.message)
                    }

                    const tmp = {
                        langMsg: title,
                        gasPrice: newGasPrice,
                        gasPriceGwei: gweiFee,
                        gasLimit: gasLimit.toString(),
                        feeForTx: fee.toString(),
                        amountForTx: amount,
                        nonceForTx,
                        nonceLog,
                        needSpeed,
                        ethAllowBlockedBalance,
                        ethAllowLongQuery,
                        isTransferAll: data.isTransferAll
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
            const needSpeed = typeof keys[index] !== 'undefined' && typeof gasPrice[keys[index]] !== 'undefined' ? gasPrice[keys[index]].toString() : '?'
            let gweiFee = 0
            try {
                gweiFee = fee !== '0' ? BlocksoftUtils.toGwei(fee).toString() : fee
            } catch (e) {
                BlocksoftCryptoLog.err('EthTxProcessor.getFeeRate fee to gwei error ' + e.message)
            }
            const tmp = {
                langMsg: 'eth_speed_slowest',
                gasPrice: fee,
                gasPriceGwei: gweiFee,
                gasLimit: gasLimit.toString(),
                feeForTx,
                amountForTx,
                nonceForTx,
                nonceLog,
                needSpeed,
                ethAllowBlockedBalance,
                ethAllowLongQuery,
                isTransferAll: data.isTransferAll
            }

            BlocksoftCryptoLog.log('EthTxProcessor.getFeeRate feeForTx ' + titles[index] + ' ' + tmp.feeForTx + ' corrected for balance ' + balance + ' with gasPrice ' + tmp.gasPrice + ' / gasLimit ' + tmp.gasLimit)
            if (tmp.gasPrice > 0) {
                result.fees.push(tmp)
            } else {
                throw new Error('SERVER_RESPONSE_NOT_ENOUGH_AMOUNT_FOR_ANY_FEE')
            }
        }



        if (!skippedByOld) {
            if (typeof feesOK['eth_speed_fast'] === 'undefined') {
                BlocksoftCryptoLog.log('EthTxProcessor.getFeeRate showSmallFeeNotice reason ' + JSON.stringify(feesOK))
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
        if (!data.amount || data.amount === '0') {
            await BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthTransferProcessor.getTransferAllBalance ' + data.addressFrom + ' started with load balance needed')
            try {
                // @ts-ignore
                data.amount = await this._web3.eth.getBalance(data.addressFrom).toString()
            } catch (e) {
                this.checkError(e, data)
            }
            await BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthTransferProcessor.getTransferAllBalance ' + data.addressFrom + ' started with loaded balance ' + data.amount)
        } else {
            await BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthTransferProcessor.getTransferAllBalance ' + data.addressFrom + ' started with preset balance ' + data.amount)
        }

        // noinspection EqualityComparisonWithCoercionJS
        if (data.amount === '0' || data.amount === '') {
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
        if (this._useThisBalance) {
            try {
                for (const fee of fees.fees) {
                    fee.totalFeePlusAmountETH = BlocksoftUtils.toEther(BlocksoftUtils.add(fee.amountForTx, fee.feeForTx))
                }
                fees.selectedTransferAllBalanceETH = BlocksoftUtils.toEther(fees.fees[fees.selectedFeeIndex].amountForTx)
            } catch (e) {
                BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthTransferProcessor.getTransferAllBalance ' + data.addressFrom + ' => ' + data.addressTo + ' error on logging ' + e.message)
            }
        }
        return {
            ...fees,
            selectedTransferAllBalance: fees.fees[fees.selectedFeeIndex].amountForTx
        }
    }

    async sendTx(data: BlocksoftBlockchainTypes.TransferData, privateData: BlocksoftBlockchainTypes.TransferPrivateData, uiData: BlocksoftBlockchainTypes.TransferUiData): Promise<BlocksoftBlockchainTypes.SendTxResult> {
        if (typeof privateData.privateKey === 'undefined') {
            throw new Error('ETH transaction required privateKey')
        }
        if (typeof data.addressTo === 'undefined') {
            throw new Error('ETH transaction required addressTo')
        }
        if (config.debug.cryptoErrors) {
            console.log(this._settings.currencyCode + ' EthTransferProcessor sendTx started', JSON.parse(JSON.stringify(data)))
        }

        await BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthTransferProcessor sendTx started', JSON.parse(JSON.stringify(data)))

        let txRBFed = ''
        let txRBF = false
        let realAddressTo = data.addressTo
        if (realAddressTo !== '' && OneUtils.isOneAddress(realAddressTo)) {
            realAddressTo = OneUtils.fromOneAddress(realAddressTo)
        }
        const realAddressToLower = realAddressTo.toLowerCase()
        if (typeof data.transactionRemoveByFee !== 'undefined' && data.transactionRemoveByFee) {
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthTransferProcessor.sendTx started ' + data.transactionRemoveByFee)
            txRBF = data.transactionRemoveByFee
            txRBFed = 'RBFremoved'
        } else if (typeof data.transactionReplaceByFee !== 'undefined' && data.transactionReplaceByFee) {
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthTransferProcessor.sendTx resend started ' + data.transactionReplaceByFee)
            txRBF = data.transactionReplaceByFee
            txRBFed = 'RBFed'
        } else if (typeof data.dexOrderData !== 'undefined' && data.dexOrderData) {
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthTransferProcessor.sendTx dex ' + data.addressFrom + ' started')
            txRBFed = 'dexSend'
        } else {
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthTransferProcessor.sendTx ' + data.addressFrom + ' started')
            txRBFed = 'usualSend'
            if (realAddressTo !== '' && (realAddressToLower.indexOf('0x') === -1 || realAddressToLower.indexOf('0x') !== 0)) {
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
            to: realAddressToLower,
            gasPrice: finalGasPrice,
            gas: finalGasLimit,
            value: data.amount
        }

        if (typeof data.dexOrderData !== 'undefined' && data.dexOrderData) {
            if (typeof data.dexOrderData[0].params.data !== 'undefined') {
                tx.data = data.dexOrderData[0].params.data
                if (typeof data.dexOrderData[0].params.value !== 'undefined') {
                    tx.value = data.dexOrderData[0].params.value
                } else {
                    tx.value = 0
                }
            }
            if (typeof data.dexOrderData[0].params.to !== 'undefined') {
                tx.to = data.dexOrderData[0].params.to
            }
        } else if (typeof data.contractCallData !== 'undefined' && typeof data.contractCallData.contractAddress !== 'undefined') {
            const schema = data.contractCallData.contractSchema
            try {
                let abiCode
                if (schema === 'ERC721') {
                    abiCode = abi721.ERC721
                } else if (schema === 'ERC1155') {
                    abiCode = abi1155.ERC1155
                } else {
                    throw new Error('Contract abi not found ' + schema)
                }
                const token = new this._web3.eth.Contract(abiCode, data.contractCallData.contractAddress)

                const tmpParams = data.contractCallData.contractActionParams
                for (let i = 0, ic = tmpParams.length; i < ic; i++) {
                    if (tmpParams[i] === 'addressTo') {
                        tmpParams[i] = realAddressTo
                    }
                }
                tx.to = data.contractCallData.contractAddress
                tx.data = token.methods[data.contractCallData.contractAction](...tmpParams).encodeABI()
            } catch (e) {
                throw new Error(e.message + ' while encodeABI for ' + schema)
            }
        } else if (typeof data.walletConnectData !== 'undefined' && typeof data.walletConnectData.data !== 'undefined') {
            tx.data = data.walletConnectData.data
        } else if (typeof data.blockchainData !== 'undefined') {
            tx.data = data.blockchainData // actual value for erc20 etc
        } else if (typeof data?.transactionJson?.txData !== 'undefined') {
            tx.data = data?.transactionJson?.txData
        }

        const sender = new EthTxSendProvider(this._web3, this._trezorServerCode, this._mainCurrencyCode, this._mainChainId, this._settings)
        const logData = JSON.parse(JSON.stringify(tx))
        logData.currencyCode = this._settings.currencyCode
        logData.selectedFee = selectedFee
        logData.basicAddressTo = typeof data.basicAddressTo !== 'undefined' ? data.basicAddressTo.toLowerCase() : realAddressToLower
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
            }

            if (typeof uiData !== 'undefined' && typeof uiData.selectedFee !== 'undefined' && typeof uiData.selectedFee.rawOnly !== 'undefined' && uiData.selectedFee.rawOnly) {
                return { rawOnly: uiData.selectedFee.rawOnly, raw : await sender.sign(tx, privateData, txRBF, logData)}
            }

            try {
                result = await sender.send(tx, privateData, txRBF, logData)
            } catch (e) {
                if (config.debug.cryptoErrors) {
                    BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthTransferProcessor.sent while ' + (txRBF ? 'txRbf':'usual') + ' sender.send error ' + e.message)
                }
                throw e
            }

            result.transactionFee = BlocksoftUtils.mul(finalGasPrice, finalGasLimit)
            result.transactionFeeCurrencyCode =  this._mainCurrencyCode === 'BNB' ? 'BNB_SMART' : this._mainCurrencyCode
            if (txRBF) {
                if (typeof data.blockchainData === 'undefined' || !data.blockchainData) {
                    result.amountForTx = data.amount
                }
                result.addressTo = data.addressTo === data.addressFrom || realAddressTo === data.addressFrom ? '' : realAddressTo
            } else {
                result.transactionJson.txData = tx.data
                await EthTmpDS.getCache(this._mainCurrencyCode, data.addressFrom)
            }
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthTransferProcessor.sent ' + data.addressFrom + ' done ' + JSON.stringify(result.transactionJson))
        } catch (e) {
            if (config.debug.cryptoErrors) {
                BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthTransferProcessor.sent error ' + e.message, tx)
            }
            this.checkError(e, data, txRBF, logData)
        }
        // @ts-ignore
        logData.result = result
        // noinspection ES6MissingAwait
        MarketingEvent.logOnlyRealTime('v30_eth_tx_success_' + this._settings.currencyCode, {
            ...logData,
            title : data.addressFrom + ' => ' + realAddressTo
        })

        return result
    }

    async setMissingTx(data: BlocksoftBlockchainTypes.DbAccount, transaction: BlocksoftBlockchainTypes.DbTransaction): Promise<boolean> {
        if (typeof transaction.transactionJson !== 'undefined' && transaction.transactionJson && typeof transaction.transactionJson.nonce !== 'undefined') {
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthTransferPRocessor.setMissingTx remove nonce ' + transaction.transactionJson.nonce + ' ' + transaction.transactionHash)
            await EthTmpDS.removeNonce(this._mainCurrencyCode, data.address, 'send_' + transaction.transactionHash)
        }
        MarketingEvent.logOnlyRealTime('v30_eth_tx_set_missing_' + this._settings.currencyCode, {
            transaction,
            title:  data.address + ' => ' + transaction.addressTo
        })
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
