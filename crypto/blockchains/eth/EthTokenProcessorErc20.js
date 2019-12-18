const Web3 = require('web3')

const abi = require('./tokens/erc20.js')

class EthTokenProcessorErc20 {
    constructor(settings) {
        if (typeof settings === 'undefined' || !settings) {
            throw new Error('EthTokenProcessorErc20 requires settings')
        }
        if (typeof settings.network === 'undefined') {
            throw new Error('EthTokenProcessorErc20 requires settings.network')
        }
        switch (settings.network) {
            case 'mainnet':
            case 'ropsten':
            case 'kovan' :
            case 'rinkeby' :
            case 'goerli' :
                this._link = `https://${settings.network}.infura.io/v3/478e48mushyfgsdfryumlrynh`
                // noinspection JSUnresolvedVariable
                this._web3 = new Web3(new Web3.providers.HttpProvider(this._link))
                break
            default:
                throw new Error('while retrieving EthTokenProcessorErc20 - unknown Ethereum network specified. Proper values are "mainnet", "ropsten", "kovan", rinkeby". Got : ' + settings.network)
        }
    }

    /**
     * @param {string} tokenAddress
     * @returns {Promise<{tokenAddress: *, currencyName: *, provider: string, tokenDecimals: *, icon: boolean, description: boolean, tokenType: string, currencyCode: *}>}
     */
    async getTokenDetails(tokenAddress) {
        let token, name, symbol, decimals
        try {
            token = new this._web3.eth.Contract(abi.ERC20, tokenAddress)
        } catch (e) {
            e.message = 'erc20 init token ' + e.message
            throw e
        }
        try {
            name = await token.methods.name().call()
        } catch (e) {
            e.message = 'erc20.name ' + e.message
            throw e
        }

        try {
            symbol = await token.methods.symbol().call()
        } catch (e) {
            e.message = 'erc20.symbol ' + e.message
            throw e
        }

        try {
            decimals = await token.methods.decimals().call()
        } catch (e) {
            e.message = 'erc20.decimals ' + e.message
            throw e
        }

        return {
            currencyCode: symbol,
            currencyName: name,
            tokenType : 'ETH_ERC_20',
            tokenAddress: tokenAddress,
            tokenDecimals: decimals,
            icon: false,
            description: false,
            provider : 'web3'
        }
    }

}

module.exports.init = function(settings) {
    return new EthTokenProcessorErc20(settings)
}
