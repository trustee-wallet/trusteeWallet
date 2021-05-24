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

    protected _trezorServerCode: string = ''

    private _trezorServer: string = ''

    protected _settings: BlocksoftBlockchainTypes.CurrencySettings

    private _proxy: string

    private _errorProxy: string

    private _successProxy: string

    constructor(settings: BlocksoftBlockchainTypes.CurrencySettings, serverCode: string) {
        this._settings = settings
        this._trezorServerCode = serverCode

        const { apiEndpoints } = config.proxy
        const baseURL = MarketingEvent.DATA.LOG_TESTER ? apiEndpoints.baseURLTest : apiEndpoints.baseURL
        this._proxy = baseURL + '/send/checktx'
        this._errorProxy = baseURL + '/send/errortx'
        this._successProxy = baseURL + '/send/sendtx'
    }

    async _check(hex: string, subtitle: string, txRBF: any, logData: any) {
        let checkResult = false
        try {
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' DogeSendProvider.sendTx ' + subtitle + ' proxy checkResult start ' + this._proxy, logData)
            if (config.debug.cryptoErrors) {
                console.log(new Date().toISOString() + ' ' + this._settings.currencyCode + ' DogeSendProvider.sendTx ' + subtitle + ' proxy checkResult start ' + this._proxy)
            }
            checkResult = await BlocksoftAxios.post(this._proxy, {
                raw: hex,
                txRBF,
                logData,
                marketingData: MarketingEvent.DATA
            })
            if (config.debug.cryptoErrors) {
                console.log(new Date().toISOString() + ' ' + this._settings.currencyCode + ' DogeSendProvider.sendTx ' + subtitle + ' proxy checkResult end ' + this._proxy)
            }
        } catch (e) {
            if (config.debug.cryptoErrors) {
                console.log(this._settings.currencyCode + ' DogeSendProvider.send proxy error checkResult ' + e.message)
            }
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' DogeSendProvider.send proxy error checkResult ' + e.message)
        }

        if (checkResult !== false) {
            if (typeof checkResult.data !== 'undefined') {
                BlocksoftCryptoLog.log(this._settings.currencyCode + ' DogeSendProvider.send proxy checkResult1 ', checkResult.data)
                if (typeof checkResult.data.status === 'undefined' || checkResult.data.status === 'error') {
                    if (config.debug.cryptoErrors) {
                        console.log(this._settings.currencyCode + ' DogeSendProvider.send proxy error checkResult1 ', checkResult)
                    }
                    checkResult = false
                } else if (checkResult.data.status === 'notice') {
                    throw new Error(checkResult.data.msg)
                }
            } else {
                BlocksoftCryptoLog.log(this._settings.currencyCode + ' DogeSendProvider.send proxy checkResult2 ', checkResult)
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
        return logData
    }

    async _checkError(hex: string, subtitle: string, txRBF: any, logData: any) {
        BlocksoftCryptoLog.log(this._settings.currencyCode + ' DogeSendProvider.send proxy errorTx start ' + this._errorProxy, logData)
        if (config.debug.cryptoErrors) {
            console.log(new Date().toISOString() + ' ' + this._settings.currencyCode + ' DogeSendProvider.sendTx ' + subtitle + ' proxy errorTx start ' + this._errorProxy)
        }
        const res2 = await BlocksoftAxios.post(this._errorProxy, {
            raw: hex,
            txRBF,
            logData,
            marketingData: MarketingEvent.DATA
        })
        if (config.debug.cryptoErrors) {
            console.log(new Date().toISOString() + ' ' + this._settings.currencyCode + ' DogeSendProvider.sendTx ' + subtitle + ' proxy errorTx result ', JSON.parse(JSON.stringify(res2.data)))
        }
        BlocksoftCryptoLog.log(this._settings.currencyCode + ' DogeSendProvider.send proxy errorTx', typeof res2.data !== 'undefined' ? res2.data : res2)
    }

    async _checkSuccess(transactionHash: string, hex: string, subtitle: string, txRBF: any, logData: any) {
        let checkResult = false
        try {
            logData.txHash = transactionHash
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' DogeSendProvider.send proxy successTx start ' + this._successProxy, logData)
            if (config.debug.cryptoErrors) {
                console.log(new Date().toISOString() + ' ' + this._settings.currencyCode + ' DogeSendProvider.sendTx ' + subtitle + ' proxy successTx start ' + this._successProxy)
            }
            checkResult = await BlocksoftAxios.post(this._successProxy, {
                raw: hex,
                txRBF,
                logData,
                marketingData: MarketingEvent.DATA
            })
            if (config.debug.cryptoErrors) {
                console.log(new Date().toISOString() + ' ' + this._settings.currencyCode + ' DogeSendProvider.sendTx ' + subtitle + ' proxy successTx result ', JSON.parse(JSON.stringify(checkResult.data)))
            }
        } catch (e3) {
            if (config.debug.cryptoErrors) {
                console.log(this._settings.currencyCode + ' DogeSendProvider.send proxy error successTx ' + e3.message)
            }
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' DogeSendProvider.send proxy error successTx ' + e3.message)
        }

        if (checkResult !== false) {
            if (typeof checkResult.data !== 'undefined') {
                BlocksoftCryptoLog.log(this._settings.currencyCode + ' DogeSendProvider.send proxy successResult1 ', checkResult.data)
                if (typeof checkResult.data.status === 'undefined' || checkResult.data.status === 'error') {
                    if (config.debug.cryptoErrors) {
                        console.log(this._settings.currencyCode + ' DogeSendProvider.send proxy error successResult1 ', checkResult)
                    }
                    checkResult = false
                } else if (checkResult.data.status === 'notice') {
                    throw new Error(checkResult.data.msg)
                }
            } else {
                BlocksoftCryptoLog.log(this._settings.currencyCode + ' DogeSendProvider.send proxy successResult2 ', checkResult)
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
        return logData
    }

    async sendTx(hex: string, subtitle: string, txRBF: any, logData: any): Promise<{ transactionHash: string, transactionJson: any }> {
        await BlocksoftCryptoLog.log(this._settings.currencyCode + ' DogeSendProvider.sendTx ' + subtitle + ' started ', logData)

        let link = BlocksoftExternalSettings.getStatic(this._trezorServerCode + '_SEND_LINK')
        if (!link || link === '') {
            this._trezorServer = await BlocksoftExternalSettings.getTrezorServer(this._trezorServerCode, 'DOGE.Send.sendTx')
            link = this._trezorServer + '/api/v2/sendtx/'
        }

        logData = await this._check(hex, subtitle, txRBF, logData)

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
                await this._checkError(hex, subtitle, txRBF, logData)
            } catch (e2) {
                if (config.debug.cryptoErrors) {
                    console.log(this._settings.currencyCode + ' DogeSendProvider.send proxy error errorTx ' + e.message)
                }
                BlocksoftCryptoLog.log(this._settings.currencyCode + ' DogeSendProvider.send proxy error errorTx ' + e2.message)
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
            } else if (e.message.indexOf('too-long-mempool-chain') !== -1) {
                throw new Error('SERVER_RESPONSE_NO_RESPONSE')
            } else {
                await BlocksoftExternalSettings.setTrezorServerInvalid(this._trezorServerCode, this._trezorServer)
                e.message += ' link: ' + link
                throw e
            }
        }
        if (typeof res.data.result === 'undefined' || !res.data.result) {
            if (config.debug.cryptoErrors) {
                console.log(this._settings.currencyCode + 'DogeSendProvider.send no txid', res.data)
            }
            throw new Error('SERVER_RESPONSE_NOT_CONNECTED')
        }

        const transactionHash = res.data.result
        logData = await this._checkSuccess(transactionHash, hex, subtitle, txRBF, logData)

        return { transactionHash, transactionJson: {}, logData }
    }
}

