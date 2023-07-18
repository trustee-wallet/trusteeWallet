/**
 * @author Ksu
 * @version 0.20
 */
import BlocksoftCryptoLog from '../../common/BlocksoftCryptoLog'
import { BlocksoftBlockchainTypes } from '../../blockchains/BlocksoftBlockchainTypes'
import { BlocksoftTransferDispatcher } from '../../blockchains/BlocksoftTransferDispatcher'
import { BlocksoftTransferPrivate } from './BlocksoftTransferPrivate'
import { BlocksoftDictTypes } from '../../common/BlocksoftDictTypes'

import CoinBlocksoftDict from '@crypto/assets/coinBlocksoftDict.json'

import config from '../../../app/config/config'


type DataCache = {
    [key in BlocksoftDictTypes.Code]: {
        key: string,
        memo : string | boolean,
        time: number
    }
}

const CACHE_DOUBLE_TO: DataCache = {} as DataCache
const CACHE_VALID_TIME = 120000 // 2 minute
const CACHE_DOUBLE_BSE = {}

export namespace BlocksoftTransfer {

    export const getTransferAllBalance = async function(data: BlocksoftBlockchainTypes.TransferData, additionalData: BlocksoftBlockchainTypes.TransferAdditionalData = {}): Promise<BlocksoftBlockchainTypes.TransferAllBalanceResult> {
        if (config.debug.sendLogs) {
            console.log(`${data.currencyCode} BlocksoftTransfer.getTransferAllBalance`, JSON.parse(JSON.stringify(data)), JSON.parse(JSON.stringify(additionalData)))
        }
        if (typeof data.derivationPath !== 'undefined' && data.derivationPath) {
            data.derivationPath = data.derivationPath.replace(/quote/g, '\'')
        }
        data.isTransferAll = true
        let transferAllCount
        try {
            BlocksoftCryptoLog.log(`${data.currencyCode} BlocksoftTransfer.getTransferAllBalance started ${data.addressFrom} `)
            const processor = BlocksoftTransferDispatcher.getTransferProcessor(data.currencyCode)
            const additionalDataTmp = { ...additionalData }
            let privateData = {} as BlocksoftBlockchainTypes.TransferPrivateData
            if (processor.needPrivateForFee()) {
                privateData = await BlocksoftTransferPrivate.initTransferPrivate(data, additionalData)
            }
            additionalDataTmp.mnemonic = '***'
            transferAllCount = await (BlocksoftTransferDispatcher.getTransferProcessor(data.currencyCode)).getTransferAllBalance(data, privateData, additionalDataTmp)

            BlocksoftCryptoLog.log(`${data.currencyCode} BlocksoftTransfer.getTransferAllBalance got ${data.addressFrom} result is ok`)
            if (config.debug.sendLogs) {
                console.log(`${data.currencyCode} BlocksoftTransfer.getTransferAllBalance result`, JSON.parse(JSON.stringify(transferAllCount)))
            }
        } catch (e) {
            if (e.message.indexOf('SERVER_RESPONSE_') === -1 && e.message.indexOf('UI_') === -1) {
                // noinspection ES6MissingAwait
                BlocksoftCryptoLog.err(`${data.currencyCode} BlocksoftTransfer.getTransferAllBalance ` + e.message)
                throw new Error('server.not.responding.all.balance.' + data.currencyCode + ' ' + e.message)
            } else {
                if (config.debug.appErrors) {
                    console.log(`${data.currencyCode} BlocksoftTransfer.getTransferAllBalance error ` + e.message)
                }
                throw e
            }
        }
        return transferAllCount
    }

    export const getFeeRate = async function(data: BlocksoftBlockchainTypes.TransferData, additionalData: BlocksoftBlockchainTypes.TransferAdditionalData = {}): Promise<BlocksoftBlockchainTypes.FeeRateResult> {
        const lower = data.addressTo.toLowerCase()
        if (!data?.walletConnectData?.data) {
            for (const key in CoinBlocksoftDict) {
                const tmp = CoinBlocksoftDict[key]
                if (typeof tmp.canBeDestination !== 'undefined' && tmp.canBeDestination) {
                    continue
                }
                if (tmp?.tokenName && tmp?.tokenName.toLowerCase() === lower) {
                    if (config.debug.cryptoErrors) {
                        console.log('SERVER_RESPONSE_CONTRACT_DESTINATION_INVALID is getFeeRate as no data?.walletConnectData?.data', data)
                    }
                    throw new Error('SERVER_RESPONSE_CONTRACT_DESTINATION_INVALID')
                }
                if (tmp?.tokenAddress && tmp?.tokenAddress.toLowerCase() === lower) {
                    if (config.debug.cryptoErrors) {
                        console.log('SERVER_RESPONSE_CONTRACT_DESTINATION_INVALID is getFeeRate as no data?.walletConnectData?.data', data)
                    }
                    throw new Error('SERVER_RESPONSE_CONTRACT_DESTINATION_INVALID')
                }
            }
        }

        if (config.debug.sendLogs) {
            console.log('BlocksoftTransfer.getFeeRate', JSON.parse(JSON.stringify(data)), JSON.parse(JSON.stringify(additionalData)))
        }
        if (typeof data.derivationPath === 'undefined' || !data.derivationPath) {
            throw new Error('BlocksoftTransfer.getFeeRate requires derivationPath ' + JSON.stringify(data))
        }
        data.derivationPath = data.derivationPath.replace(/quote/g, '\'')
        let feesCount
        try {
            BlocksoftCryptoLog.log(`${data.currencyCode} BlocksoftTransfer.getFeeRate started ${data.addressFrom} `)
            const processor = BlocksoftTransferDispatcher.getTransferProcessor(data.currencyCode)
            const additionalDataTmp = { ...additionalData }

            let privateData = {} as BlocksoftBlockchainTypes.TransferPrivateData
            if (processor.needPrivateForFee()) {
                privateData = await BlocksoftTransferPrivate.initTransferPrivate(data, additionalData)
            }
            additionalDataTmp.mnemonic = '***'
            feesCount = await processor.getFeeRate(data, privateData, additionalDataTmp)
            feesCount.countedTime = new Date().getTime()
        } catch (e) {
            if (config.debug.cryptoErrors) {
                console.log('BlocksoftTransfer.getFeeRate error ', e)
            }
            if (typeof e.message === 'undefined' ) {
                await BlocksoftCryptoLog.log('BlocksoftTransfer.getFeeRate strange error')
            } else if (e.message.indexOf('SERVER_RESPONSE_') === -1 && e.message.indexOf('UI_') === -1) {
                // noinspection ES6MissingAwait
                await BlocksoftCryptoLog.err(`${data.currencyCode} BlocksoftTransfer.getFeeRate error ` + data.addressFrom + ' => ' + data.addressTo + ' ' + data.amount + ' ' + e.message)
                throw new Error('server.not.responding.network.prices.' + data.currencyCode + ' ' + e.message)
            } else {
                await BlocksoftCryptoLog.log('BlocksoftTransfer.getFeeRate inner error ' + e.message)
                throw e
            }
        }
        return feesCount
    }

    export const sendTx = async function(data: BlocksoftBlockchainTypes.TransferData, uiData: BlocksoftBlockchainTypes.TransferUiData, additionalData: BlocksoftBlockchainTypes.TransferAdditionalData): Promise<BlocksoftBlockchainTypes.SendTxResult> {
        if (config.debug.sendLogs) {
            console.log('BlocksoftTransfer.sendTx', data, uiData)
        }

        const lower = data.addressTo.toLowerCase()
        if (!data?.walletConnectData?.data) {
            for (const key in CoinBlocksoftDict) {
                const tmp = CoinBlocksoftDict[key]
                if (typeof tmp.canBeDestination !== 'undefined' && tmp.canBeDestination) {
                    continue
                }
                if (tmp?.tokenName && tmp?.tokenName.toLowerCase() === lower) {
                    if (config.debug.cryptoErrors) {
                        console.log('SERVER_RESPONSE_CONTRACT_DESTINATION_INVALID is sendTx as no data?.walletConnectData?.data', data)
                    }
                    throw new Error('SERVER_RESPONSE_CONTRACT_DESTINATION_INVALID')
                }
                if (tmp?.tokenAddress && tmp?.tokenAddress.toLowerCase() === lower) {
                    if (config.debug.cryptoErrors) {
                        console.log('SERVER_RESPONSE_CONTRACT_DESTINATION_INVALID is sendTx as no data?.walletConnectData?.data', data)
                    }
                    throw new Error('SERVER_RESPONSE_CONTRACT_DESTINATION_INVALID')
                }
            }
        }

        data.derivationPath = data.derivationPath.replace(/quote/g, '\'')

        const bseOrderId = typeof uiData !== 'undefined' && uiData && typeof uiData.selectedFee !== 'undefined' && typeof uiData.selectedFee.bseOrderId !== 'undefined' ? uiData.selectedFee.bseOrderId : false
        const uiErrorConfirmed = typeof uiData !== 'undefined' && uiData && typeof uiData.uiErrorConfirmed !== 'undefined' && uiData.uiErrorConfirmed
        const memo = typeof data !== 'undefined' && data && typeof data.memo !== 'undefined' ? data.memo : false


        try {
            if (data.transactionReplaceByFee || data.transactionRemoveByFee || data.transactionSpeedUp) {
                // do nothing
            } else {
                if (bseOrderId) {
                    // bse order
                    if (typeof CACHE_DOUBLE_BSE[bseOrderId] !== 'undefined') {
                        if (!uiErrorConfirmed) {
                            throw new Error('UI_CONFIRM_DOUBLE_BSE_SEND')
                        }
                    }
                }
                // usual tx
                if (typeof CACHE_DOUBLE_TO[data.currencyCode] !== 'undefined') {
                    if (!uiErrorConfirmed) {
                        if (data.addressTo && CACHE_DOUBLE_TO[data.currencyCode].key === data.addressTo && CACHE_DOUBLE_TO[data.currencyCode].memo === memo) {
                            const time = new Date().getTime()
                            const diff = time - CACHE_DOUBLE_TO[data.currencyCode].time
                            if (diff < CACHE_VALID_TIME) {
                                CACHE_DOUBLE_TO[data.currencyCode].time = time
                                throw new Error('UI_CONFIRM_DOUBLE_SEND')
                            }
                        }
                    }
                }

            }
        } catch (e) {
            if (config.debug.cryptoErrors) {
                console.log(`${data.currencyCode} BlocksoftTransfer.sendTx check double error ` + e.message, e)
            }
            if (e.message.indexOf('SERVER_RESPONSE_') === -1 && e.message.indexOf('UI_') === -1) {
                BlocksoftCryptoLog.log(`${data.currencyCode} BlocksoftTransfer.sendTx error ` + e.message)
            }
            throw e
        }

        let txResult
        try {
            BlocksoftCryptoLog.log(`${data.currencyCode} BlocksoftTransfer.sendTx started ${data.addressFrom} `)
            const processor = BlocksoftTransferDispatcher.getTransferProcessor(data.currencyCode)
            const privateData = await BlocksoftTransferPrivate.initTransferPrivate(data, additionalData)
            txResult = await processor.sendTx(data, privateData, uiData)
            BlocksoftCryptoLog.log(`${data.currencyCode} BlocksoftTransfer.sendTx got ${data.addressFrom} result is ok`)
            if (typeof uiData === 'undefined' || typeof uiData.selectedFee === 'undefined' || typeof uiData.selectedFee.rawOnly === 'undefined' || !uiData.selectedFee.rawOnly) {
                CACHE_DOUBLE_TO[data.currencyCode] = {
                    key: data.addressTo,
                    memo,
                    time: new Date().getTime()
                }
            }
            if (bseOrderId) {
                CACHE_DOUBLE_BSE[bseOrderId] = true
            }
            // if (typeof uiData.selectedFee !== 'undefined')
        } catch (e) {
            if (config.debug.cryptoErrors) {
                console.log('BlocksoftTransfer.sendTx error ' + e.message, e)
            }
            if (e.message.indexOf('SERVER_RESPONSE_') === -1 && e.message.indexOf('UI_') === -1 && e.message.indexOf('connect() timed') === -1) {
                // noinspection ES6MissingAwait
                BlocksoftCryptoLog.err(`${data.currencyCode} BlocksoftTransfer.sendTx ` + e.message)
            }

            if (e.message.indexOf('imeout') !== -1 || e.message.indexOf('network error') !== -1 || e.message==='SERVER_RESPONSE_BAD_INTERNET') {
                throw new Error('SERVER_RESPONSE_NOT_CONNECTED')
            }
            if (e.message.indexOf('SERVER_RESPONSE_NOT_CONNECTED') !== -1 && (data.currencyCode === 'TRX' || data.currencyCode.indexOf('TRX_') !== -1)) {
                BlocksoftCryptoLog.log(`${data.currencyCode} BlocksoftTransfer.sendTx ` + e.message)
            } else {
                throw e
            }
        }
        return txResult
    }


    export const sendRawTx = async function(data: BlocksoftBlockchainTypes.DbAccount, rawTxHex: string, txRBF: any, logData: any): Promise<string> {
        let txResult = ''
        try {
            BlocksoftCryptoLog.log(`${data.currencyCode} BlocksoftTransfer.sendRawTx started ${data.address} `)
            const processor = BlocksoftTransferDispatcher.getTransferProcessor(data.currencyCode)
            if (typeof processor.sendRawTx === 'undefined') {
                return 'none'
            }
            txResult = await processor.sendRawTx(data, rawTxHex, txRBF, logData)
            BlocksoftCryptoLog.log(`${data.currencyCode} BlocksoftTransfer.sendRawTx got ${data.address} result is ok`)
        } catch (e) {
            if (config.debug.cryptoErrors) {
                console.log(`${data.currencyCode} BlocksoftTransfer.sendRawTx error `, e)
            }
            BlocksoftCryptoLog.log(`${data.currencyCode} BlocksoftTransfer.sendRawTx error ` + e.message)
            throw e
        }
        return txResult
    }


    export const setMissingTx = async function(data: BlocksoftBlockchainTypes.DbAccount, dbTransaction: BlocksoftBlockchainTypes.DbTransaction): Promise<boolean> {
        let txResult = false
        try {
            BlocksoftCryptoLog.log(`${data.currencyCode} BlocksoftTransfer.setMissing started ${data.address} `)
            const processor = BlocksoftTransferDispatcher.getTransferProcessor(data.currencyCode)
            if (typeof processor.setMissingTx === 'undefined') {
                return false
            }
            txResult = await processor.setMissingTx(data, dbTransaction)
            BlocksoftCryptoLog.log(`${data.currencyCode} BlocksoftTransfer.setMissing got ${data.address} result is ok`)
        } catch (e) {
            BlocksoftCryptoLog.err(`${data.currencyCode} BlocksoftTransfer.setMissing error ` + e.message)
        }
        return txResult
    }

    export const canRBF = function(data: BlocksoftBlockchainTypes.DbAccount, dbTransaction: BlocksoftBlockchainTypes.DbTransaction, source: string): boolean {
        let txResult = false
        try {
            // BlocksoftCryptoLog.log(`BlocksoftTransfer.canRBF ${data.currencyCode} from ${source} started ${data.address} `)
            const processor = BlocksoftTransferDispatcher.getTransferProcessor(typeof data.currencyCode !== 'undefined' ? data.currencyCode : dbTransaction.currencyCode)
            if (typeof processor.canRBF === 'undefined') {
                return false
            }
            txResult = processor.canRBF(data, dbTransaction, source)
            // BlocksoftCryptoLog.log(`BlocksoftTransfer.canRBF ${data.currencyCode} from ${source} got ${data.address} result is ${JSON.stringify(txResult)}`)
        } catch (e) {
            BlocksoftCryptoLog.err(`${data.currencyCode} BlocksoftTransfer.canRBF error from ${source} ` + e.message)
        }
        return txResult
    }

    export const checkSendAllModal = function(data: { currencyCode: any }) {
        let checkSendAllModalResult = false
        try {
            // BlocksoftCryptoLog.log(`BlocksoftTransfer.checkSendAllModal ${data.currencyCode} started `)
            const processor = BlocksoftTransferDispatcher.getTransferProcessor(data.currencyCode)
            if (typeof processor.checkSendAllModal === 'undefined') {
                return false
            }
            checkSendAllModalResult = processor.checkSendAllModal(data)
            // BlocksoftCryptoLog.log(`BlocksoftTransfer.checkSendAllModal ${data.currencyCode} got result is ok ` + JSON.stringify(checkSendAllModalResult))
        } catch (e) {
            BlocksoftCryptoLog.err(`${data.currencyCode} BlocksoftTransfer.checkSendAllModal error ` + e.message)
        }
        return checkSendAllModalResult
    }
}
