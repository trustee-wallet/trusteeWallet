/**
 * @version 0.5
 */
import BlocksoftCryptoLog from '../../common/BlocksoftCryptoLog'
import EthScannerProcessor from './EthScannerProcessor'
import config from '@app/config/config'

const abi = require('./ext/erc20')

export default class EthScannerProcessorErc20 extends EthScannerProcessor {

    /**
     * @type {boolean}
     * @private
     */
    _useInternal = false

    constructor(settings) {
        super(settings)
        // noinspection JSUnresolvedVariable
        this._token = new this._web3.eth.Contract(abi.ERC20, settings.tokenAddress)
        this._tokenAddress = settings.tokenAddress.toLowerCase()
        this._delegateAddress = (settings.delegateAddress || '').toLowerCase()

        if (this._etherscanApiPath && typeof this._etherscanApiPath !== 'undefined') {
            const tmp = this._etherscanApiPath.split('/')
            this._etherscanApiPath = `https://${tmp[2]}/api?module=account&action=tokentx&sort=desc&contractaddress=${settings.tokenAddress}&apikey=YourApiKeyToken`
        }
    }

    /**
     * @param {string} address
     * @return {Promise<{balance, unconfirmed, provider}>}
     */
    async getBalanceBlockchain(address) {
        BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthScannerProcessorErc20.getBalance started ' + address)
        if (this.checkWeb3CurrentServerUpdated()) {
            this._token = new this._web3.eth.Contract(abi.ERC20, this._settings.tokenAddress)
        }

        // noinspection JSUnresolvedVariable
        try {
            let balance = 0
            let provider = ''
            let time = 0

            if (this._trezorServerCode) {
                try {
                    const res = await this._get(address)
                    if (!res || typeof res.data === 'undefined') {
                        throw new Error('no res')
                    }
                    BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthScannerProcessorErc20.getBalance loaded from ' + res.provider + ' ' + res.time)
                    const data = res.data
                    if (data && this._tokenAddress && typeof data.formattedTokens[this._tokenAddress] !== 'undefined' && typeof typeof data.formattedTokens[this._tokenAddress].balance !== 'undefined') {
                        balance = data.formattedTokens[this._tokenAddress].balance
                        if (balance === []) return false
                        provider = res.provider
                        time = res.time
                        return { balance, unconfirmed: 0, provider, time, balanceScanBlock: res.data.nonce }
                    }
                } catch (e1) {
                    if (config.debug.appErrors) {
                        console.log( this._settings.currencyCode + ' EthScannerProcessorErc20.getBalance ' + address + ' error1 ' + e1.message)
                    }
                    BlocksoftCryptoLog.log( this._settings.currencyCode + ' EthScannerProcessorErc20.getBalance ' + address + ' error1 ' + e1.message)
                }
            }
            balance = await this._token.methods.balanceOf(address).call()
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthScannerProcessorErc20.getBalance ' + address + ' result ' + JSON.stringify(balance))
            if (balance === []) return false

            provider = 'web3'
            time = 'now()'
            return { balance, unconfirmed: 0, provider, time }

        } catch (e) {
            if (config.debug.appErrors) {
                console.log( this._settings.currencyCode + ' EthScannerProcessorErc20.getBalance ' + address + ' error ' + e.message)
            }
            BlocksoftCryptoLog.log( this._settings.currencyCode + ' EthScannerProcessorErc20.getBalance ' + address + ' error ' + e.message)
            return false
        }


    }
}
