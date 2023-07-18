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

const Web3 = require('web3')

export default class EthTxSendProvider {

    private _web3: any
    private _trezorServerCode: any
    private _trezorServer: any
    private _settings: any
    private _mainCurrencyCode: string
    private _mainChainId: any

    constructor(web3: any, trezorServerCode: any, mainCurrencyCode : string, mainChainId : any, settings: any) {
        this._web3 = web3
        this._trezorServerCode = trezorServerCode
        this._trezorServer = 'to_load'
        this._settings = settings

        this._mainCurrencyCode = mainCurrencyCode
        this._mainChainId = mainChainId
    }


    async sign(tx: BlocksoftBlockchainTypes.EthTx, privateData: BlocksoftBlockchainTypes.TransferPrivateData, txRBF: any, logData: any): Promise<{ transactionHash: string, transactionJson: any }> {
        // @ts-ignore
        await BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthTxSendProvider._innerSign started', logData)
        // noinspection JSUnresolvedVariable
        if (privateData.privateKey.substr(0, 2) !== '0x') {
            privateData.privateKey = '0x' + privateData.privateKey
        }
        if (tx.value.toString().substr(0, 1) === '-') {
            throw new Error('SERVER_RESPONSE_NOTHING_LEFT_FOR_FEE')
        }
        // noinspection JSUnresolvedVariable
        if (this._mainChainId) {
            tx.chainId = this._mainChainId
        }
        let signData = false
        try {
            signData = await this._web3.eth.accounts.signTransaction(tx, privateData.privateKey)
        } catch (e) {
            if (e.message.indexOf('Invalid JSON RPC response:') === -1 || typeof this._web3.SEND_RAW_LINK === 'undefined' || !this._web3.SEND_RAW_LINK) {
                throw new Error(this._settings.currencyCode + ' EthTxSendProvider._innerSign signTransaction error ' + e.message + ' ' + this._web3?.LINK)
            }
            await BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthTxSendProvider._innerSign signTransaction error ' + e.message + ' ' + this._web3?.LINK + ' => ' + this._web3.SEND_RAW_LINK)
        }
        const newLink = this._web3.SEND_RAW_LINK
        this._web3 = new Web3(new Web3.providers.HttpProvider(newLink))
        this._web3.LINK = newLink
        this._web3.SEND_RAW_LINK = newLink
        try {
            signData = await this._web3.eth.accounts.signTransaction(tx, privateData.privateKey)
        } catch (e) {
            throw new Error(this._settings.currencyCode + ' EthTxSendProvider._innerSign signTransaction error ' + e.message + ' ' + this._web3?.LINK + ' => ' + this._web3.SEND_RAW_LINK)
        }
        return signData.rawTransaction
    }

    async send(tx: BlocksoftBlockchainTypes.EthTx, privateData: BlocksoftBlockchainTypes.TransferPrivateData, txRBF: any, logData: any): Promise<{ transactionHash: string, transactionJson: any }> {
        // @ts-ignore
        await BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthTxSendProvider._innerSendTx started', logData)

        const rawTransaction = await this.sign(tx, privateData, txRBF, logData)

        // @ts-ignore
        await BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthTxSendProvider._innerSendTx signed', tx)
        await BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthTxSendProvider._innerSendTx hex', rawTransaction)

        let link = BlocksoftExternalSettings.getStatic(this._trezorServerCode + '_SEND_LINK')
        if (!link || link === '') {
            if (this._trezorServerCode) {
                if (this._trezorServerCode === 'TRX') {
                    link = this._trezorServerCode
                } else if (this._trezorServerCode.indexOf('http') === -1) {
                    this._trezorServer = await BlocksoftExternalSettings.getTrezorServer(this._trezorServerCode, 'ETH.Send.sendTx')
                    link = this._trezorServer + '/api/v2/sendtx/'
                }
            } else {
                link = this._trezorServerCode // actually is direct url like link = 'https://dex.binance.org/api/v1/broadcast'
            }
        }

        const { apiEndpoints } = config.proxy
        const baseURL = MarketingEvent.DATA.LOG_TESTER ? apiEndpoints.baseURLTest : apiEndpoints.baseURL
        const proxy = baseURL + '/send/checktx'
        const errorProxy = baseURL + '/send/errortx'
        const successProxy = baseURL + '/send/sendtx'
        let checkResult = false
        try {
            await BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthTxSendProvider.send proxy checkResult start ' + proxy, logData)
            checkResult = await BlocksoftAxios.post(proxy, {
                raw: rawTransaction,
                txRBF,
                logData,
                marketingData: MarketingEvent.DATA
            })
        } catch (e) {
            if (config.debug.cryptoErrors) {
                console.log(this._settings.currencyCode + ' EthTxSendProvider.send proxy error checkResult ' + e.message)
            }
            await BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthTxSendProvider.send proxy error checkResult ' + e.message)
        }

        if (checkResult !== false) {
            if (typeof checkResult.data !== 'undefined') {
                await BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthTxSendProvider.send proxy checkResult1 ', checkResult.data)
                if (typeof checkResult.data.status === 'undefined' || checkResult.data.status === 'error') {
                    if (config.debug.cryptoErrors) {
                        console.log(this._settings.currencyCode + ' EthTxSendProvider.send proxy error checkResult1 ', JSON.parse(JSON.stringify(checkResult.data)))
                    }
                    checkResult = false
                } else if (checkResult.data.status === 'notice') {
                    throw new Error(checkResult.data.msg)
                }
            } else {
                await BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthTxSendProvider.send proxy checkResult2 ', checkResult)
                if (config.debug.cryptoErrors) {
                    console.log(this._settings.currencyCode + ' EthTxSendProvider.send proxy error checkResult2 ', JSON.parse(JSON.stringify(checkResult.data)))
                }
            }
        } else {
            if (config.debug.cryptoErrors) {
                console.log(this._settings.currencyCode + ' EthTxSendProvider.send proxy error checkResultEmpty ', JSON.stringify(checkResult.data))
            }
        }
        logData.checkResult = checkResult && typeof checkResult.data !== 'undefined' && checkResult.data ? JSON.parse(JSON.stringify(checkResult.data)) : false

        await BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthTxSendProvider.send will send')
        let result
        let sendLink
        try {
            if (this._mainCurrencyCode === 'MATIC' || this._mainCurrencyCode === 'FTM' || this._web3.SEND_RAW_LINK !== this._web3.LINK || !link) {
                /**
                 * curl http://matic.trusteeglobal.com:8545 -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_sendRawTransaction","params":["0x..."],"id":83}'
                 */
                sendLink = this._web3.SEND_RAW_LINK
                await BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthTxSendProvider.send sendSignedTransaction to ' + sendLink, rawTransaction)
                const tmp = await BlocksoftAxios.postWithoutBraking(sendLink, {
                    jsonrpc: '2.0',
                    method: 'eth_sendRawTransaction',
                    params: [rawTransaction],
                    id: 1
                })
                if (config.debug.cryptoErrors) {
                    console.log(this._settings.currencyCode + ' EthTxSendProvider.send sendSignedTransaction to1 ' + this._web3.SEND_RAW_LINK + ' result ', tmp.data)
                }
                await BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthTxSendProvider.send sendSignedTransaction to ' + sendLink + ' result ', tmp.data)
                if (!tmp || typeof tmp.data === 'undefined') {
                    throw new Error('SERVER_RESPONSE_NOT_CONNECTED')
                }
                if (typeof tmp.data.error !== 'undefined' && tmp.data.error) {
                    throw new Error(typeof tmp.data.error.message !== 'undefined' ? tmp.data.error.message : tmp.data.error)
                }
                result = {
                    data: {
                        result: typeof tmp.data.result !== 'undefined' ? tmp.data.result : false
                    }
                }
            } else if (this._mainCurrencyCode === 'BNB') {
                /**
                 * {"blockHash": "0x01d48fd5de1ebb62275096f749acb6849bd97f3c050acb07358222cea0a527bc",
                 * "blockNumber": 5223318, "contractAddress": null,
                 * "cumulativeGasUsed": 14465279, "from": "0xf1cff704c6e6ce459e3e1544a9533cccbdad7b99",
                 * "gasUsed": 21000, "logs": [],
                 * "logsBloom": "0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
                 * "status": true, "to": "0xf1cff704c6e6ce459e3e1544a9533cccbdad7b99", "transactionHash": "0x1fa5646517b625d422863e6c27082104e1697543a6f912421527bb171c6173f2", "transactionIndex": 95}
                 */
                sendLink = this._web3.LINK
                await BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthTxSendProvider.send sendSignedTransaction to2 ' + sendLink, rawTransaction)
                const tmp = await this._web3.eth.sendSignedTransaction(rawTransaction)
                if (config.debug.cryptoErrors) {
                    console.log(this._settings.currencyCode + ' EthTxSendProvider.send sendSignedTransaction send result ', tmp.data)
                }
                await BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthTxSendProvider.send sendSignedTransaction send result ', tmp.data)
                result = {
                    data: {
                        result: typeof tmp.transactionHash !== 'undefined' ? tmp.transactionHash : false
                    }
                }

            } else {
                sendLink = link
                await BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthTxSendProvider.send post ', rawTransaction)
                result = await BlocksoftAxios.post(sendLink, rawTransaction)
            }
            // @ts-ignore
            await BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthTxSendProvider.send result ', typeof result !== 'undefined' && result ? result.data : 'NO RESULT')
        } catch (e) {
            if (config.debug.cryptoErrors) {
                console.log(this._settings.currencyCode + ' ' + this._mainCurrencyCode + ' EthTxSendProvider.send trezor ' + sendLink + ' error ' + e.message, JSON.parse(JSON.stringify(logData)))
            }
            try {
                logData.error = e.message
                logData.sendLink = sendLink
                await BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthTxSendProvider.send proxy errorTx start ' + errorProxy, logData)
                const res2 = await BlocksoftAxios.post(errorProxy, {
                    raw: rawTransaction,
                    txRBF,
                    logData,
                    marketingData: MarketingEvent.DATA
                })
                if (config.debug.cryptoErrors) {
                    console.log(this._settings.currencyCode + ' EthTxSendProvider.send proxy errorTx result', JSON.parse(JSON.stringify(res2.data)))
                }
                const tmp3 = JSON.stringify(typeof res2.data !== 'undefined' ? res2.data : res2)
                await BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthTxSendProvider.send proxy errorTx', tmp3)
                throw new Error('res2.data : ' + tmp3)
            } catch (e2) {
                if (config.debug.cryptoErrors) {
                    console.log(this._settings.currencyCode + ' EthTxSendProvider.send proxy error errorTx ' + e.message)
                }
                await BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthTxSendProvider.send proxy error errorTx ' + e2.message)
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
            await BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthTxSendProvider.send proxy successTx start ' + successProxy, logData)
            checkResult = await BlocksoftAxios.post(successProxy, {
                raw: rawTransaction,
                txRBF,
                logData,
                marketingData: MarketingEvent.DATA
            })
            if (config.debug.cryptoErrors) {
                console.log(this._settings.currencyCode + ' EthTxSendProvider.send proxy successTx result ', JSON.parse(JSON.stringify(checkResult.data)))
            }
        } catch (e3) {
            if (config.debug.cryptoErrors) {
                console.log(this._settings.currencyCode + ' EthTxSendProvider.send proxy error successTx ' + e3.message)
            }
            await BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthTxSendProvider.send proxy error successTx ' + e3.message)
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
            transactionRaw: rawTransaction,
            transactionLog: logData
        })

        BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthTxSendProvider.send save nonce ' + nonce + ' from ' + tx.from + ' ' + transactionHash)
        await EthTmpDS.saveNonce(this._mainCurrencyCode, tx.from, 'send_' + transactionHash, nonce)

        return { transactionHash, transactionJson }
    }
}
