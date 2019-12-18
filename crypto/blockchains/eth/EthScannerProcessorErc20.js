import BlocksoftCryptoLog from '../../common/BlocksoftCryptoLog'

const abi = require('./tokens/erc20.js')

class EthScannerProcessorErc20 extends require('./EthScannerProcessor').EthScannerProcessor {

    constructor(settings) {
        super(settings)

        // actually used not to rewrite txs in basic class as its the same format but different link
        // noinspection JSUnusedGlobalSymbols
        this._etherscanApiPath = `https://api${this._etherscanSuffix}.etherscan.io/api?module=account&action=tokentx&contractaddress=${settings.tokenAddress}&sort=desc&apikey=YourApiKeyToken`

        // noinspection JSUnresolvedVariable
        this._token = new this._web3.eth.Contract(abi.ERC20, settings.tokenAddress)
        BlocksoftCryptoLog.log('EthScannerProcessorErc20 inited')
    }

    /**
     * @param {string} address
     * @return {Promise<{int:balance, int:provider}>}
     */
    async getBalance(address) {
        // noinspection JSUnresolvedVariable
        let balance = await this._token.methods.balanceOf(address).call()
        BlocksoftCryptoLog.log('EthScannerProcessorErc20.getBalance finished', address + ' => ' + balance)
        return {balance, unconfirmed : 0, provider : 'etherscan'}
    }
}

module.exports.EthScannerProcessorErc20 = EthScannerProcessorErc20

module.exports.init = function(settings) {
    return new EthScannerProcessorErc20(settings)
}
