/**
 * @version 0.41
 */
import BlocksoftExternalSettings from '@crypto/common/BlocksoftExternalSettings'

const Web3 = require('web3')
const CACHE_WEB3 = {}

export const Web3Injected = (type) => {
    if (typeof CACHE_WEB3[type] !== 'undefined') {
        return CACHE_WEB3[type]
    }

    let WEB3_LINK = `https://mainnet.infura.io/v3/${BlocksoftExternalSettings.getStatic('ETH_INFURA')}`
    let MAIN_CURRENCY_CODE = 'ETH'
    if (type === 3 || type === 'ropsten') {
        MAIN_CURRENCY_CODE = 'ETH_ROPSTEN'
        WEB3_LINK = `https://ropsten.infura.io/v3/${BlocksoftExternalSettings.getStatic('ETH_INFURA')}`
    } if (type === 4 || type === 'rinkeby') {
        MAIN_CURRENCY_CODE = 'ETH_RINKEBY'
        WEB3_LINK = `https://rinkeby.infura.io/v3/${BlocksoftExternalSettings.getStatic('ETH_INFURA')}`
    } else if (type === 56 || type === 'bnb') {
        MAIN_CURRENCY_CODE = 'BNB_SMART'
        WEB3_LINK = BlocksoftExternalSettings.getStatic('BNB_SMART_SERVER')
    } else if (type === 10 || type === 'optimism') {
        MAIN_CURRENCY_CODE = 'OPTIMISM'
        WEB3_LINK = BlocksoftExternalSettings.getStatic('OPTIMISM_SERVER')
    } else if (type === 137 || type === 'matic') {
        MAIN_CURRENCY_CODE = 'MATIC'
        WEB3_LINK = BlocksoftExternalSettings.getStatic('MATIC_SERVER')
    }

    const WEB3 = new Web3(new Web3.providers.HttpProvider(WEB3_LINK))
    WEB3.MAIN_CURRENCY_CODE = MAIN_CURRENCY_CODE
    WEB3.LINK = WEB3_LINK
    CACHE_WEB3[type] = WEB3
    return WEB3
}
