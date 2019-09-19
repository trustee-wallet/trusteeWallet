import BlocksoftDict from './BlocksoftDict'
import BlocksoftUtils from './BlocksoftUtils'

class BlocksoftPrettyNumbers {
    /**
     * @param {string} currencyCode
     * @return {BlocksoftPrettyNumbers}
     */
    setCurrencyCode(currencyCode) {
        let settings = BlocksoftDict.getCurrencyAllSettings(currencyCode)
        if (settings.prettyNumberProcessor) {
            this._processorCode = settings.prettyNumberProcessor
        } else {
            throw new Error('BlocksoftDict.getCurrencyAllSettings no settings.prettyNumberProcessor for ' + currencyCode)
        }
        if (settings.decimals) {
            this._decimals = settings.decimals
        } else {
            throw new Error('BlocksoftDict.getCurrencyAllSettings no settings.decimals for ' + currencyCode)
        }

        return this
    }

    /**
     * @param {string} number
     * @return {string}
     */
    makePrettie(number) {
        if (this._processorCode === 'USDT') {
            return number
        } else if (this._processorCode === 'ETH') {
            return BlocksoftUtils.toEther(number)
        } else if (this._processorCode === 'BTC') {
            return BlocksoftUtils.toBtc(number)
        } else if (this._processorCode === 'ETH_ERC_20') {
            return BlocksoftUtils.toUnified(number, this._decimals)
        }
        throw new Error('undefined BlocksoftPrettyNumbers processor to makePrettie')
    }

    /**
     * @param {string} number
     * @return {string}
     */
    makeUnPrettie(number) {
        if (this._processorCode === 'USDT') {
            return number
        } else if (this._processorCode === 'ETH') {
            return BlocksoftUtils.toWei(number)
        } else if (this._processorCode === 'BTC') {
            return BlocksoftUtils.toSatoshi(number)
        } else if (this._processorCode === 'ETH_ERC_20') {
            return BlocksoftUtils.fromUnified(number, this._decimals)
        }
        throw new Error('undefined BlocksoftPrettyNumbers processor to makeUnPrettie')
    }


}

export default new BlocksoftPrettyNumbers()
