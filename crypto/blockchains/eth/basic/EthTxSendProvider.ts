/**
 * @author Ksu
 * @version 0.32
 */
import { BlocksoftBlockchainTypes } from '../../BlocksoftBlockchainTypes'
import BlocksoftCryptoLog from '../../../common/BlocksoftCryptoLog'
import BlocksoftUtils from '../../../common/BlocksoftUtils'
import EthTmpDS from '../stores/EthTmpDS'
import EthRawDS from '../stores/EthRawDS'
import BlocksoftExternalSettings from '../../../common/BlocksoftExternalSettings'
import BlocksoftAxios from '../../../common/BlocksoftAxios'
import config from '../../../../app/config/config'
import MarketingEvent from '../../../../app/services/Marketing/MarketingEvent'


export default class EthTxSendProvider {

    private _web3: any
    private _trezorServerCode: any
    private _trezorServer: any
    private _settings: any

    constructor(web3: any, trezorServerCode: any, settings: any) {
        this._web3 = web3
        this._trezorServerCode = trezorServerCode
        this._trezorServer = 'to_load'
        this._settings = settings
    }


    async send(tx: BlocksoftBlockchainTypes.EthTx, privateData: BlocksoftBlockchainTypes.TransferPrivateData, txRBF: any, logData: any): Promise<{ transactionHash: string, transactionJson: any }> {
        // @ts-ignore
        await BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthTxSendProvider._innerSendTx started', logData)
        // noinspection JSUnresolvedVariable
        if (privateData.privateKey.substr(0, 2) !== '0x') {
            privateData.privateKey = '0x' + privateData.privateKey
        }
        if (tx.value.toString().substr(0, 1) === '-') {
            throw new Error('SERVER_RESPONSE_NOTHING_LEFT_FOR_FEE')
        }
        // noinspection JSUnresolvedVariable
        const signData = await this._web3.eth.accounts.signTransaction(tx, privateData.privateKey)

        // @ts-ignore
        await BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthTxSendProvider._innerSendTx signed', tx)
        await BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthTxSendProvider._innerSendTx hex', signData.rawTransaction)

        this._trezorServer = await BlocksoftExternalSettings.getTrezorServer(this._trezorServerCode, 'ETH.Send.sendTx')

        const link = this._trezorServer + '/api/v2/sendtx/'
        const proxy = config.proxy.apiEndpoints.baseURL + '/send/checktx'
        const errorProxy = config.proxy.apiEndpoints.baseURL + '/send/errortx'
        const successProxy = config.proxy.apiEndpoints.baseURL + '/send/sendtx'
        let checkResult = false
        try {
            checkResult = await BlocksoftAxios.post(proxy, {
                raw: signData.rawTransaction,
                txRBF,
                logData,
                marketingData: MarketingEvent.DATA
            })
        } catch (e) {
            if (config.debug.cryptoErrors) {
                console.log(this._settings.currencyCode + ' EthTxSendProvider.send proxy error checkError ' + e.message)
            }
        }

        if (checkResult !== false) {
            if (typeof checkResult.data !== 'undefined') {
                await BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthTxSendProvider.send proxy checkResult1 ', checkResult.data)
                if (typeof checkResult.data.status === 'undefined' || checkResult.data.status === 'error') {
                    if (config.debug.cryptoErrors) {
                        console.log(this._settings.currencyCode + ' EthTxSendProvider.send proxy error checkResult1 ', checkResult)
                    }
                    checkResult = false
                } else if (checkResult.data.status === 'notice') {
                    throw new Error(checkResult.data.msg)
                }
            } else {
                await BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthTxSendProvider.send proxy checkResult2 ', checkResult)
                if (config.debug.cryptoErrors) {
                    console.log(this._settings.currencyCode + ' EthTxSendProvider.send proxy error checkResult2 ', checkResult)
                }
            }
        } else {
            if (config.debug.cryptoErrors) {
                console.log(this._settings.currencyCode + ' EthTxSendProvider.send proxy error checkResultEmpty ', checkResult)
            }
        }
        logData.checkResult = checkResult && typeof checkResult.data !== 'undefined' && checkResult.data ? JSON.parse(JSON.stringify(checkResult.data)) : false

        let result
        try {
            result = await BlocksoftAxios.post(link, signData.rawTransaction)
            // @ts-ignore
            await BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthTxSendProvider.send result ', result)
        } catch (e) {
            if (config.debug.cryptoErrors) {
                console.log(this._settings.currencyCode + ' EthTxSendProvider.send error ' + e.message, JSON.parse(JSON.stringify(logData)))
            }
            try {
                logData.error = e.message
                const res2 = await BlocksoftAxios.post(errorProxy, {
                    raw: signData.rawTransaction,
                    txRBF,
                    logData,
                    marketingData: MarketingEvent.DATA
                })
                if (config.debug.cryptoErrors) {
                    console.log(this._settings.currencyCode + ' EthTxSendProvider.send proxy error result', JSON.parse(JSON.stringify(res2)))
                }
            } catch (e2) {
                if (config.debug.cryptoErrors) {
                    console.log(this._settings.currencyCode + ' EthTxSendProvider.send proxy error errorProxy ' + e.message)
                }
                await BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthTxSendProvider.send proxy error errorProxy ' + e2.message)
            }
            if (this._settings.currencyCode !== 'ETH' && this._settings.currencyCode !== 'ETH_ROPSTEN' && e.message.indexOf('bad-txns-in-belowout') !== -1) {
                throw new Error('SERVER_RESPONSE_NOT_ENOUGH_FEE')
            } else if (e.message.indexOf('dust') !== -1) {
                throw new Error('SERVER_RESPONSE_NOT_ENOUGH_AMOUNT_AS_DUST')
            } else if (e.message.indexOf('bad-txns-inputs-spent') !== -1 || e.message.indexOf('txn-mempool-conflict') !== -1) {
                throw new Error('SERVER_RESPONSE_NO_RESPONSE')
            } else if (e.message.indexOf('min relay fee not met') !== -1 || e.message.indexOf('fee for relay') !== -1 || e.message.indexOf('insufficient priority') !== -1) {
                throw new Error('SERVER_RESPONSE_NOT_ENOUGH_AMOUNT_AS_FEE')
            } else if (e.message.indexOf('insufficient fee, rejecting replacement') !== -1) {
                if (this._settings.currencyCode !== 'ETH' && this._settings.currencyCode !== 'ETH_ROPSTEN') {
                    throw new Error('SERVER_RESPONSE_NOT_ENOUGH_AMOUNT_AS_FEE_FOR_REPLACEMENT')
                } else {
                    throw new Error('UI_CONFIRM_CHANGE_AMOUNT_FOR_REPLACEMENT')
                }
            } else if (e.message.indexOf('too-long-mempool-chain') !== -1) {
                throw new Error('SERVER_RESPONSE_NO_RESPONSE')
            } else {
                await BlocksoftExternalSettings.setTrezorServerInvalid(this._trezorServerCode, this._trezorServer)
                e.message += ' link: ' + link
                throw e
            }
        }

        // @ts-ignore
        if (typeof result.data.result === 'undefined' || !result.data.result) {
            throw new Error('SERVER_RESPONSE_NOT_CONNECTED')
        }

        // @ts-ignore
        const transactionHash = result.data.result
        if (transactionHash === '') {
            throw new Error('SERVER_RESPONSE_BAD_CODE')
        }

        checkResult = false
        try {
            logData.txHash = transactionHash
            checkResult = await BlocksoftAxios.post(successProxy, {
                raw: signData.rawTransaction,
                txRBF,
                logData,
                marketingData: MarketingEvent.DATA
            })
            if (config.debug.cryptoErrors) {
                console.log(this._settings.currencyCode + ' EthTxSendProvider.send proxy success result', JSON.parse(JSON.stringify(checkResult)))
            }
        } catch (e3) {
            if (config.debug.cryptoErrors) {
                console.log(this._settings.currencyCode + ' EthTxSendProvider.send proxy success error ' + e3.message)
            }
        }

        if (checkResult !== false) {
            if (typeof checkResult.data !== 'undefined') {
                await BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthTxSendProvider.send proxy successResult1 ', checkResult.data)
                if (typeof checkResult.data.status === 'undefined' || checkResult.data.status === 'error') {
                    if (config.debug.cryptoErrors) {
                        console.log(this._settings.currencyCode + ' EthTxSendProvider.send proxy error successResult1 ', checkResult)
                    }
                    checkResult = false
                } else if (checkResult.data.status === 'notice') {
                    throw new Error(checkResult.data.msg)
                }
            } else {
                await BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthTxSendProvider.send proxy successResult2 ', checkResult)
                if (config.debug.cryptoErrors) {
                    console.log(this._settings.currencyCode + ' EthTxSendProvider.send proxy error successResult2 ', checkResult)
                }
            }
        } else {
            if (config.debug.cryptoErrors) {
                console.log(this._settings.currencyCode + ' EthTxSendProvider.send proxy error successResultEmpty ', checkResult)
            }
        }
        logData.successResult = checkResult && typeof checkResult.data !== 'undefined' && checkResult.data ? JSON.parse(JSON.stringify(checkResult.data)) : false
        logData.txRBF = txRBF

        const nonce = typeof logData.setNonce !== 'undefined' ? logData.setNonce : BlocksoftUtils.hexToDecimal(tx.nonce)

        const transactionJson = {
            nonce,
            gasPrice: typeof logData.gasPrice !== 'undefined' ? logData.gasPrice : BlocksoftUtils.hexToDecimal(tx.gasPrice)
        }

        await EthRawDS.saveRaw({
            address: tx.from,
            currencyCode: this._settings.currencyCode,
            transactionUnique: tx.from + '_' + nonce,
            transactionHash,
            transactionRaw: signData.rawTransaction,
            transactionLog: logData
        })

        await EthTmpDS.saveNonce(tx.from, 'send_' + transactionHash, nonce)

        return { transactionHash, transactionJson }
    }
}
