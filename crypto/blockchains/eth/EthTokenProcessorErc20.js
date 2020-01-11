/**
 * @version 0.5
 */
import EthBasic from './basic/EthBasic'

const abi = require('./ext/erc20.js')

export default class EthTokenProcessorErc20 extends EthBasic {
    /**
     * @param {string} tokenAddress
     * @returns {Promise<{tokenAddress: *, currencyName: *, provider: string, tokenDecimals: *, icon: boolean, description: boolean, tokenType: string, currencyCode: *}>}
     */
    async getTokenDetails(tokenAddress) {
        let token, name, symbol, decimals
        try {
            // noinspection JSUnresolvedVariable
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
