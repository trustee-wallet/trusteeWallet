/**
 * @version 0.20
 * https://github.com/trezor/blockbook/blob/master/docs/api.md
 */
import { BlocksoftBlockchainTypes } from '../../BlocksoftBlockchainTypes'
import BlocksoftCryptoLog from '../../../common/BlocksoftCryptoLog'
import BlocksoftAxios from '../../../common/BlocksoftAxios'
import BlocksoftExternalSettings from '../../../common/BlocksoftExternalSettings'
import config from '../../../../app/config/config'
import MarketingEvent from '../../../../app/services/Marketing/MarketingEvent'


export default class DogeSendProvider implements BlocksoftBlockchainTypes.SendProvider {

    private _trezorServerCode: string = ''

    private _trezorServer: string = ''

    protected _settings: BlocksoftBlockchainTypes.CurrencySettings

    constructor(settings: BlocksoftBlockchainTypes.CurrencySettings, serverCode: string) {
        this._settings = settings
        this._trezorServerCode = serverCode
    }

    async sendTx(hex: string, subtitle: string, txRBF : any, logData : any) : Promise<{transactionHash: string, transactionJson:any}> {
        BlocksoftCryptoLog.log(this._settings.currencyCode + ' DogeSendProvider.sendTx ' + subtitle + ' started ' + subtitle)

        this._trezorServer = await BlocksoftExternalSettings.getTrezorServer(this._trezorServerCode, 'DOGE.Send.sendTx')

        const link = this._trezorServer + '/api/v2/sendtx/'

        const proxy = config.proxy.apiEndpoints.baseURL + '/send/checktx'
        const errorProxy = config.proxy.apiEndpoints.baseURL + '/send/errortx'
        const successProxy = config.proxy.apiEndpoints.baseURL + '/send/sendtx'

        let checkResult = false
        try {
            await BlocksoftCryptoLog.log(this._settings.currencyCode + ' DogeSendProvider.sendTx ' + subtitle + ' proxy checkResult start ' + proxy, logData)
            checkResult = await BlocksoftAxios.post(proxy, {
                raw: hex,
                txRBF,
                logData,
                marketingData: MarketingEvent.DATA
            })
        } catch (e) {
            if (config.debug.cryptoErrors) {
                console.log(this._settings.currencyCode + ' DogeSendProvider.send proxy error checkResult ' + e.message)
            }
            await BlocksoftCryptoLog.log(this._settings.currencyCode + ' DogeSendProvider.send proxy error checkResult ' + e.message)
        }

        if (checkResult !== false) {
            if (typeof checkResult.data !== 'undefined') {
                await BlocksoftCryptoLog.log(this._settings.currencyCode + ' DogeSendProvider.send proxy checkResult1 ', checkResult.data)
                if (typeof checkResult.data.status === 'undefined' || checkResult.data.status === 'error') {
                    if (config.debug.cryptoErrors) {
                        console.log(this._settings.currencyCode + ' DogeSendProvider.send proxy error checkResult1 ', checkResult)
                    }
                    checkResult = false
                } else if (checkResult.data.status === 'notice') {
                    throw new Error(checkResult.data.msg)
                }
            } else {
                await BlocksoftCryptoLog.log(this._settings.currencyCode + ' DogeSendProvider.send proxy checkResult2 ', checkResult)
                if (config.debug.cryptoErrors) {
                    console.log(this._settings.currencyCode + ' DogeSendProvider.send proxy error checkResult2 ', checkResult)
                }
            }
        } else {
            if (config.debug.cryptoErrors) {
                console.log(this._settings.currencyCode + ' DogeSendProvider.send proxy error checkResultEmpty ', checkResult)
            }
        }
        if (typeof logData === 'undefined' || !logData) {
            logData = {}
        }
        logData.checkResult = checkResult && typeof checkResult.data !== 'undefined' && checkResult.data ? JSON.parse(JSON.stringify(checkResult.data)) : false


        let res
        try {
            res = await BlocksoftAxios.post(link, hex)

        } catch (e) {
            if (config.debug.cryptoErrors) {
                console.log(this._settings.currencyCode + ' DogeSendProvider.sendTx error ', e)
            }
            if (subtitle.indexOf('rawSend') !== -1) {
                throw e
            }
            try {
                logData.error = e.message
                await BlocksoftCryptoLog.log(this._settings.currencyCode + ' DogeSendProvider.send proxy errorTx start ' + errorProxy, logData)
                const res2 = await BlocksoftAxios.post(errorProxy, {
                    raw: hex,
                    txRBF,
                    logData,
                    marketingData: MarketingEvent.DATA
                })
                if (config.debug.cryptoErrors) {
                    console.log(this._settings.currencyCode + ' DogeSendProvider.send proxy errorTx result', JSON.parse(JSON.stringify(res2)))
                }
                await BlocksoftCryptoLog.log(this._settings.currencyCode + ' DogeSendProvider.send proxy errorTx', typeof res2.data !== 'undefined' ? res2.data : res2)
            } catch (e2) {
                if (config.debug.cryptoErrors) {
                    console.log(this._settings.currencyCode + ' DogeSendProvider.send proxy error errorTx ' + e.message)
                }
                await BlocksoftCryptoLog.log(this._settings.currencyCode + ' DogeSendProvider.send proxy error errorTx ' + e2.message)
            }
            if (this._settings.currencyCode === 'USDT' && e.message.indexOf('bad-txns-in-belowout') !== -1) {
                throw new Error('SERVER_RESPONSE_NOT_ENOUGH_FEE')
            } else if (e.message.indexOf('transaction already in block') !== -1) {
                throw new Error('SERVER_RESPONSE_TRANSACTION_ALREADY_MINED')
            } else if (e.message.indexOf('inputs-missingorspent') !== -1) {
                throw new Error('SERVER_RESPONSE_TRANSACTION_ALREADY_MINED')
            } else if (e.message.indexOf('insufficient priority') !== -1) {
                throw new Error('SERVER_RESPONSE_NO_RESPONSE_OR_MORE_FEE')
            } else if (e.message.indexOf('dust') !== -1) {
                throw new Error('SERVER_RESPONSE_NOT_ENOUGH_AMOUNT_AS_DUST')
            } else if (e.message.indexOf('bad-txns-inputs-spent') !== -1 || e.message.indexOf('txn-mempool-conflict') !== -1) {
                throw new Error('SERVER_RESPONSE_NO_RESPONSE')
            } else if (e.message.indexOf('min relay fee not met') !== -1 || e.message.indexOf('fee for relay') !== -1) {
                throw new Error('SERVER_RESPONSE_NOT_ENOUGH_AMOUNT_AS_FEE')
            } else if (e.message.indexOf('insufficient fee, rejecting replacement') !== -1) {
                throw new Error('SERVER_RESPONSE_NOT_ENOUGH_AMOUNT_AS_FEE_FOR_REPLACEMENT')
            } else if (e.message.indexOf('insufficient fee') !== -1) {
                throw new Error('SERVER_RESPONSE_NOT_ENOUGH_AMOUNT_AS_FEE')
            }else if (e.message.indexOf('too-long-mempool-chain') !== -1) {
                throw new Error('SERVER_RESPONSE_NO_RESPONSE')
            } else {
                await BlocksoftExternalSettings.setTrezorServerInvalid(this._trezorServerCode, this._trezorServer)
                e.message += ' link: ' + link
                throw e
            }
        }
        if (typeof res.data.result === 'undefined' || !res.data.result) {
            throw new Error('SERVER_RESPONSE_NOT_CONNECTED')
        }

        const transactionHash = res.data.result

        checkResult = false
        try {
            logData.txHash = transactionHash
            await BlocksoftCryptoLog.log(this._settings.currencyCode + ' DogeSendProvider.send proxy successTx start ' + successProxy, logData)
            checkResult = await BlocksoftAxios.post(successProxy, {
                raw: hex,
                txRBF,
                logData,
                marketingData: MarketingEvent.DATA
            })
            if (config.debug.cryptoErrors) {
                console.log(this._settings.currencyCode + ' DogeSendProvider.send proxy successTx result ', JSON.parse(JSON.stringify(checkResult)))
            }
        } catch (e3) {
            if (config.debug.cryptoErrors) {
                console.log(this._settings.currencyCode + ' DogeSendProvider.send proxy error successTx ' + e3.message)
            }
            await BlocksoftCryptoLog.log(this._settings.currencyCode + ' DogeSendProvider.send proxy error successTx ' + e3.message)
        }

        if (checkResult !== false) {
            if (typeof checkResult.data !== 'undefined') {
                await BlocksoftCryptoLog.log(this._settings.currencyCode + ' DogeSendProvider.send proxy successResult1 ', checkResult.data)
                if (typeof checkResult.data.status === 'undefined' || checkResult.data.status === 'error') {
                    if (config.debug.cryptoErrors) {
                        console.log(this._settings.currencyCode + ' DogeSendProvider.send proxy error successResult1 ', checkResult)
                    }
                    checkResult = false
                } else if (checkResult.data.status === 'notice') {
                    throw new Error(checkResult.data.msg)
                }
            } else {
                await BlocksoftCryptoLog.log(this._settings.currencyCode + ' DogeSendProvider.send proxy successResult2 ', checkResult)
                if (config.debug.cryptoErrors) {
                    console.log(this._settings.currencyCode + ' DogeSendProvider.send proxy error successResult2 ', checkResult)
                }
            }
        } else {
            if (config.debug.cryptoErrors) {
                console.log(this._settings.currencyCode + ' DogeSendProvider.send proxy error successResultEmpty ', checkResult)
            }
        }
        logData.successResult = checkResult && typeof checkResult.data !== 'undefined' && checkResult.data ? JSON.parse(JSON.stringify(checkResult.data)) : false
        logData.txRBF = txRBF

        return { transactionHash, transactionJson: {}, logData }
    }
}

