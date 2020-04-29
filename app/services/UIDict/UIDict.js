/**
 * @version 0.9
 */
import UIDictData from './UIDictData'
import BlocksoftDict from '../../../crypto/common/BlocksoftDict'

export default class UIDict {

    currencyCode = null
    settings = null

    constructor(currencyCode) {
        this.currencyCode = currencyCode

        this.init(currencyCode)
    }

    init = () => {
        let settings = UIDictData[this.currencyCode]
        const extend = BlocksoftDict.getCurrencyAllSettings(this.currencyCode)

        if (typeof extend.addressCurrencyCode !== 'undefined') {
            settings = BlocksoftDict.getCurrencyAllSettings(extend.addressCurrencyCode)
            settings = UIDictData[settings.currencyCode]
        }

        this.settings = typeof settings === 'undefined' ? UIDictData['DEFAULT'] : settings
    }

}
