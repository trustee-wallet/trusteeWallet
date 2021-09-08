/**
 * @version 0.41
 */
import BlocksoftExternalSettings from '@crypto/common/BlocksoftExternalSettings'

const Web3 = require('web3')
const CACHE_WEB3 = {}

export const Web3Injected = (type) => {
    let WEB3_LINK = `https://mainnet.infura.io/v3/${BlocksoftExternalSettings.getStatic('ETH_INFURA')}`
    let MAIN_CURRENCY_CODE = 'ETH'
    if (type === 3 || type === 'ropsten') {
        MAIN_CURRENCY_CODE = 'ETH_ROPSTEN'
        WEB3_LINK = `https://ropsten.infura.io/v3/${BlocksoftExternalSettings.getStatic('ETH_INFURA')}`
    } if (type === 4 || type === 'rinkeby') {
        MAIN_CURRENCY_CODE = 'ETH_RINKEBY'
        WEB3_LINK = `https://rinkeby.infura.io/v3/${BlocksoftExternalSettings.getStatic('ETH_INFURA')}`
    } else if (type === 56) {
        MAIN_CURRENCY_CODE = 'BNB_SMART'
        WEB3_LINK = BlocksoftExternalSettings.getStatic('BNB_SMART_SERVER')
    } else if (type === 10) {
        MAIN_CURRENCY_CODE = 'OPTIMISM'
        WEB3_LINK = BlocksoftExternalSettings.getStatic('OPTIMISM_SERVER')
    } else if (type === 137 || type === 'MATIC') {
        MAIN_CURRENCY_CODE = 'MATIC'
        WEB3_LINK = BlocksoftExternalSettings.getStatic('MATIC_SERVER')
    } else if (type === 16718) {
        MAIN_CURRENCY_CODE = 'AMB'
        WEB3_LINK = BlocksoftExternalSettings.getStatic('AMB_SERVER')
    } else if (type === 61) {
        MAIN_CURRENCY_CODE = 'ETC'
        WEB3_LINK = BlocksoftExternalSettings.getStatic('ETC_SERVER')
    } else if (type === 30) {
        MAIN_CURRENCY_CODE = 'RSK'
        WEB3_LINK = BlocksoftExternalSettings.getStatic('RSK_SERVER')
    }

    if (typeof CACHE_WEB3[WEB3_LINK] !== 'undefined') {
        return CACHE_WEB3[WEB3_LINK]
    }

    const WEB3 = new Web3(new Web3.providers.HttpProvider(WEB3_LINK))
    WEB3.MAIN_CURRENCY_CODE = MAIN_CURRENCY_CODE
    WEB3.LINK = WEB3_LINK
    CACHE_WEB3[WEB3_LINK] = WEB3

    return WEB3
}
