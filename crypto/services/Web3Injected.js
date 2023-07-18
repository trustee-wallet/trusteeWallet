/**
 * @version 0.41
 */
import BlocksoftExternalSettings from '@crypto/common/BlocksoftExternalSettings'

const Web3 = require('web3')
const CACHE_WEB3 = {}

export const Web3Injected = (type) => {
    let WEB3_LINK = `https://mainnet.infura.io/v3/${BlocksoftExternalSettings.getStatic('ETH_INFURA')}`
    let MAIN_CURRENCY_CODE = 'ETH'
    let MAIN_CHAIN_ID = 1
    let SEND_RAW_LINK = false
    if (!type || type === 0 || type === 1 || type === 'ethereum' || type === 'ETH' || type === 'mainnet') {
        MAIN_CURRENCY_CODE = 'ETH'
        MAIN_CHAIN_ID = 1
        SEND_RAW_LINK = BlocksoftExternalSettings.getStatic('ETH_SEND_RAW_SERVER')
    } else if (type === 10001 || type === 'eth_pow'  || type === 'ETH_POW' || type === 'ETHW' || type === 'ethw') {
        MAIN_CURRENCY_CODE = 'ETH_POW'
        WEB3_LINK = BlocksoftExternalSettings.getStatic('ETH_POW_SERVER')
        MAIN_CHAIN_ID = 10001
    } else if (type === 3 || type === 'ropsten'  || type === 'ETH_ROPSTEN') {
        MAIN_CURRENCY_CODE = 'ETH_ROPSTEN'
        WEB3_LINK = `https://ropsten.infura.io/v3/${BlocksoftExternalSettings.getStatic('ETH_INFURA')}`
        MAIN_CHAIN_ID = 3
    } else if (type === 4 || type === 'rinkeby' || type === 'ETH_RINKEBY') {
        MAIN_CURRENCY_CODE = 'ETH_RINKEBY'
        WEB3_LINK = `https://rinkeby.infura.io/v3/${BlocksoftExternalSettings.getStatic('ETH_INFURA')}`
        MAIN_CHAIN_ID = 4
    } else if (type === 56 || type === 'bnb' || type === 'BNB_SMART') {
        MAIN_CURRENCY_CODE = 'BNB_SMART'
        WEB3_LINK = BlocksoftExternalSettings.getStatic('BNB_SMART_SERVER')
        MAIN_CHAIN_ID = 56
        SEND_RAW_LINK = BlocksoftExternalSettings.getStatic('BNB_SMART_SEND_RAW_SERVER')
    } else if (type === 1088 || type === 'METIS') {
        MAIN_CURRENCY_CODE = 'METIS'
        WEB3_LINK = BlocksoftExternalSettings.getStatic('METIS_SERVER')
        MAIN_CHAIN_ID = 1088
    } else if (type === 199 || type === 'BTTC') {
        MAIN_CURRENCY_CODE = 'BTTC'
        WEB3_LINK = BlocksoftExternalSettings.getStatic('BTTC_SERVER')
        MAIN_CHAIN_ID = 199
    } else if (type === 106 || type === 'VLX') {
        MAIN_CURRENCY_CODE = 'VLX'
        WEB3_LINK = BlocksoftExternalSettings.getStatic('VLX_SERVER')
        MAIN_CHAIN_ID = 106 // https://docs.velas.com/clusters/
    } else if (type === 1666600000 || type === 'ONE') {
        MAIN_CURRENCY_CODE = 'ONE'
        WEB3_LINK = BlocksoftExternalSettings.getStatic('ONE_SERVER')
        MAIN_CHAIN_ID = 1666600000
    } else if (type === 10 || type === 'OPTIMISM') {
        MAIN_CURRENCY_CODE = 'OPTIMISM'
        WEB3_LINK = BlocksoftExternalSettings.getStatic('OPTIMISM_SERVER')
        MAIN_CHAIN_ID = 10
    } else if (type === 137 || type === 'MATIC') {
        MAIN_CURRENCY_CODE = 'MATIC'
        WEB3_LINK = BlocksoftExternalSettings.getStatic('MATIC_SERVER')
        MAIN_CHAIN_ID = 137
    } else if (type === 250 || type === 'FTM') {
        MAIN_CURRENCY_CODE = 'FTM'
        WEB3_LINK = BlocksoftExternalSettings.getStatic('FTM_SERVER')
        MAIN_CHAIN_ID = 250
    } else if (type === 16718 || type === 'AMB') {
        MAIN_CURRENCY_CODE = 'AMB'
        WEB3_LINK = BlocksoftExternalSettings.getStatic('AMB_SERVER')
        MAIN_CHAIN_ID = 16718
    } else if (type === 61 || type === 'ETC') {
        MAIN_CURRENCY_CODE = 'ETC'
        WEB3_LINK = BlocksoftExternalSettings.getStatic('ETC_SERVER')
        MAIN_CHAIN_ID = 61
    } else if (type === 30 || type === 'RSK') {
        MAIN_CURRENCY_CODE = 'RSK'
        WEB3_LINK = BlocksoftExternalSettings.getStatic('RSK_SERVER')
        MAIN_CHAIN_ID = 30
    } else {
        throw new Error('PLEASE ADD SUPPORT FOR ETH NETWORK ' + type)
    }

    if (typeof CACHE_WEB3[WEB3_LINK] !== 'undefined') {
        return CACHE_WEB3[WEB3_LINK]
    }

    const WEB3 = new Web3(new Web3.providers.HttpProvider(WEB3_LINK))
    WEB3.MAIN_CURRENCY_CODE = MAIN_CURRENCY_CODE
    WEB3.LINK = WEB3_LINK
    WEB3.MAIN_CHAIN_ID = MAIN_CHAIN_ID
    WEB3.SEND_RAW_LINK = SEND_RAW_LINK && SEND_RAW_LINK !== 'none' ? SEND_RAW_LINK : WEB3_LINK
    CACHE_WEB3[WEB3_LINK] = WEB3

    return WEB3
}
