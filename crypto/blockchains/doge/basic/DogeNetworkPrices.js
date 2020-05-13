/**
 * @version 0.8
 **/
import BlocksoftCryptoLog from '../../../common/BlocksoftCryptoLog'
import BlocksoftExternalSettings from '../../../common/BlocksoftExternalSettings'

export default class DogeNetworkPrices {

    async getNetworkPrices(blocks, currencyCode) {

        BlocksoftCryptoLog.log('DogeNetworkPricesProvider ' + currencyCode + ' ' + blocks)

        const externalSettings = await BlocksoftExternalSettings.getAll('DOGE.getNetworkPrices')

        if (!externalSettings || typeof externalSettings[currencyCode] === 'undefined') {
            throw new Error('DogeNetworkPricesProvider ' + currencyCode + ' not defined')
        }
        if (typeof externalSettings[currencyCode][blocks] !== 'undefined') {
            return externalSettings[currencyCode][blocks]
        } else if (blocks <= 2) {
            return externalSettings[currencyCode][2]
        } else if (blocks <= 12) {
            return externalSettings[currencyCode][6]
        } else {
            return externalSettings[currencyCode][12]
        }

    }

}
