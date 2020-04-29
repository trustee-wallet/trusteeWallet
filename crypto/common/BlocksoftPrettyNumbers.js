import BlocksoftDict from './BlocksoftDict'
import BlocksoftUtils from './BlocksoftUtils'

class BlocksoftPrettyNumbers {
    /**
     * @param {string} currencyCode
     * @return {BlocksoftPrettyNumbers}
     */
    setCurrencyCode(currencyCode) {
        const settings = BlocksoftDict.getCurrencyAllSettings(currencyCode)
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
    makePretty(number) {
        if (this._processorCode === 'USDT') {
            return number
        }
        let str = number.toString()
        if (str.indexOf('.') !== -1 || str.indexOf(',') !== -1) {
            number = str.split('.')[0]
        }
        if (this._processorCode === 'ETH') {
            return BlocksoftUtils.toEther(number)
        } else if (this._processorCode === 'BTC') {
            return BlocksoftUtils.toBtc(number)
        } else if (this._processorCode === 'ETH_ERC_20' || this._processorCode === 'UNIFIED') {
            return BlocksoftUtils.toUnified(number, this._decimals)
        }
        throw new Error('undefined BlocksoftPrettyNumbers processor to makePretty')
    }

    /**
     * @param {string} number
     * @return {string}
     */
    makeUnPretty(number) {
        try {
            if (this._processorCode === 'USDT') {
                return number
            } else if (this._processorCode === 'ETH') {
                return BlocksoftUtils.toWei(number)
            } else if (this._processorCode === 'BTC') {
                return BlocksoftUtils.toSatoshi(number)
            } else if (this._processorCode === 'ETH_ERC_20' || this._processorCode === 'UNIFIED') {
                return BlocksoftUtils.fromUnified(number, this._decimals)
            }
        } catch (e) {
            e.message += 'in makeUnPretty'
            throw e
        }
        throw new Error('undefined BlocksoftPrettyNumbers processor to makeUnPretty')
    }


}

export default new BlocksoftPrettyNumbers()
