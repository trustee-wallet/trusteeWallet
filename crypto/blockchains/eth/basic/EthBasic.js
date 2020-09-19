/**
 * @version 0.5
 * https://etherscan.io/apis#accounts
 */
import BlocksoftCryptoLog from '../../../common/BlocksoftCryptoLog'

const Web3 = require('web3')

export default class EthBasic {
    /**
     * @type {Web3}
     * @public
     */
    _web3

    /**
     * @type {string}
     * @public
     */
    _web3Link

    /**
     * @type {string}
     * @public
     */
    _etherscanSuffix

    /**
     * @type {string}
     * @public
     */
    _etherscanApiPath

    /**
     * @type {string}
     * @public
     */
    _etherscanApiPathInternal

    /**
     * @type {string}
     * @public
     */
    _trezorServer

    /**
     * @type {string}
     * @public
     */
    _tokenAddress

    /**
     * @type {string}
     * @public
     */
    _delegateAddress


    /**
     * @param {string} settings.network
     */
    constructor(settings) {
        if (typeof settings === 'undefined' || !settings) {
            throw new Error('EthNetworked requires settings')
        }
        if (typeof settings.network === 'undefined') {
            throw new Error('EthNetworked requires settings.network')
        }
        switch (settings.network) {
            case 'mainnet':
            case 'ropsten':
            // case 'kovan' : case 'rinkeby' : case 'goerli' :
                this._web3Link = `https://${settings.network}.infura.io/v3/73c21b1f95ca4946886c78eac6bc1d11`
                break
            default:
                throw new Error('while retrieving Ethereum address - unknown Ethereum network specified. Proper values are "mainnet", "ropsten", "kovan", rinkeby". Got : ' + settings.network)
        }
        this._settings = settings
        // noinspection JSUnresolvedVariable
        this._web3 = new Web3(new Web3.providers.HttpProvider(this._web3Link))
        this._etherscanSuffix = (settings.network === 'mainnet') ? '' : ('-' + settings.network)
        this._etherscanApiPath = `https://api${this._etherscanSuffix}.etherscan.io/api?module=account&sort=desc&action=txlist&apikey=YourApiKeyToken`
        this._etherscanApiPathInternal = `https://api${this._etherscanSuffix}.etherscan.io/api?module=account&sort=desc&action=txlistinternal&apikey=YourApiKeyToken`

        this._trezorServer = settings.network === 'mainnet' ? 'to_load' : false
        this._tokenAddress = false
    }

    checkError(e, data) {
        if (e.message.indexOf('gas required exceeds allowance') !== -1) {
            BlocksoftCryptoLog.log('EthBasic checkError ' + e.message + ' for ' + data.addressFrom)
            throw new Error('SERVER_RESPONSE_NOTHING_TO_TRANSFER')
        } else if (e.message.indexOf('transaction underpriced') !== -1) {
            BlocksoftCryptoLog.log('EthBasic checkError2 ' + e.message + ' for ' + data.addressFrom)
            throw new Error('SERVER_RESPONSE_NOT_ENOUGH_AMOUNT_AS_FEE')
        } else if (e.message.indexOf('infura') !== -1) {
            throw new Error('SERVER_RESPONSE_BAD_INTERNET')
        } else {
            throw e
        }
    }
}
