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
     * @param {string|number} number
     * @return {string}
     */
    makePretty(number) {
        if (this._processorCode === 'USDT') {
            return number
        }
        const str = number.toString()
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

    makeCut(tmp, size = 5, source = false) {
        let cutted = 0
        let isSatoshi = false
        if (typeof tmp === 'undefined' || !tmp) {
            return {cutted, isSatoshi, justCutted : cutted, separated: '0'}
        }
        const splitted = tmp.toString().split('.')
        const def = '0.' + '0'.repeat(size)
        let firstPart = false
        let secondPart = false
        if (splitted[0] === '0') {
            if (typeof splitted[1] !== 'undefined' && splitted[1]) {
                cutted = splitted[0] + '.' + splitted[1].substr(0, size)
                if (cutted === def) {
                    cutted = splitted[0] + '.' + splitted[1].substr(0, size * 2)
                    const def2 = '0.' + '0'.repeat(size*2)
                    if (cutted !== def2) {
                        secondPart = splitted[1].substr(0, size * 2)
                    }
                    isSatoshi = true
                }
            } else {
                cutted = '0'
            }
        } else if (typeof splitted[1] !== 'undefined' && splitted[1]) {
            const second = splitted[1].substr(0, size)
            if (second !== '0'.repeat(size)) {
                cutted = splitted[0] + '.' + second
                secondPart = second
            } else {
                cutted = splitted[0]
            }
            firstPart = splitted[0] + ''
        } else {
            cutted = splitted[0]
            firstPart = splitted[0] + ''
        }
        let justCutted = isSatoshi ? '0' : cutted
        if (justCutted === def) {
            justCutted = '0'
        }
        let separated = justCutted
        if (firstPart) {
            const len = firstPart.length
            if (len > 3) {
                separated = ''
                let j = 0
                for (let i = len - 1; i >= 0; i--) {
                    if (j === 3) {
                        separated = ' ' + separated
                        j = 0
                    }
                    j++
                    separated = firstPart[i] + separated
                }
            } else {
                separated = firstPart
            }
            if (secondPart) {
                separated += '.' + secondPart
            }
        } else if (secondPart) {
            separated = '0.' + secondPart
        }

        return {cutted, isSatoshi, justCutted, separated : separated.toString()}
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
