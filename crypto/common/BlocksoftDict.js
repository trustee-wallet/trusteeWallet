import { NativeModules } from 'react-native'

import Database from '@app/appstores/DataSource/Database'

import CoinBlocksoftDict from '@crypto/assets/coinBlocksoftDict.json'

const { RNFastCrypto } = NativeModules

const VisibleCodes = [
    'CASHBACK', 'NFT', 'BTC', 'ETH', 'TRX', 'TRX_USDT' // add code here to show on start screen
]
const Codes = [
    'CASHBACK', 'NFT', 'BTC', 'ETH', 'USDT', 'LTC', 'ETH_USDT', 'TRX', 'TRX_USDT', 'BNB', 'BNB_SMART', 'MATIC', 'ETH_TRUE_USD', 'ETH_BNB', 'ETH_USDC', 'ETH_PAX', 'ETH_DAI', 'FIO'   // add code here for autocreation the wallet address with the currency
]
const Currencies = CoinBlocksoftDict

const CurrenciesForTests = {
    'BTC_SEGWIT': {
        currencyName: 'Bitcoin Segwit',
        currencyCode: 'BTC_SEGWIT',
        currencySymbol: 'BTC',
        addressProcessor: 'BTC_SEGWIT',
        extendsProcessor: 'BTC',
        ratesCurrencyCode: 'BTC',
        addressPrefix: 'bc1',
        defaultPath: `m/84'/0'/0'/0/0`
    },
    'BTC_SEGWIT_COMPATIBLE': {
        currencyName: 'Bitcoin Compatible Segwit',
        currencyCode: 'BTC_SEGWIT_COMPATIBLE',
        currencySymbol: 'BTC',
        addressProcessor: 'BTC_SEGWIT_COMPATIBLE',
        extendsProcessor: 'BTC',
        ratesCurrencyCode: 'BTC',
        addressPrefix: '3',
        defaultPath: `m/49'/0'/0'/0/1`
    },
    'LTC_SEGWIT': {
        currencyName: 'Bitcoin Segwit',
        currencyCode: 'LTC_SEGWIT',
        currencySymbol: 'LTC',
        addressProcessor: 'LTC_SEGWIT',
        extendsProcessor: 'LTC',
        ratesCurrencyCode: 'LTC',
        addressPrefix: 'ltc',
        defaultPath: `m/84'/2'/0'/0/0`
    },
    'ETH_ROPSTEN_KSU_TOKEN': {
        currencyName: 'Some ERC-20 Ropsten',
        currencyCode: 'ETH_ROPSTEN_KSU_TOKEN',
        currencySymbol: 'Some ERC-20 Ropsten',
        extendsProcessor: 'ETH_TRUE_USD',
        addressCurrencyCode: 'ETH_ROPSTEN',
        feesCurrencyCode: 'ETH_ROPSTEN',
        network: 'ropsten',
        decimals: 6,
        tokenAddress: '0xdb30610f156e1d4aefaa9b4423909297ceff64c2',
        currencyExplorerLink: 'https:ropsten.etherscan.io/address/',
        currencyExplorerTxLink: 'https:ropsten.etherscan.io/tx/'
    },
    'TRX_PLANET': {
        currencyName: 'PLANET (FREE TRX TOKEN)',
        currencyCode: 'TRX_PLANET',
        currencySymbol: 'PLANET TRX',
        extendsProcessor: 'TRX_USDT',
        feesCurrencyCode: 'TRX', // pay for tx in other currency, if no - used currencyCode
        network: 'trx', // network also used as mark of rate scanning
        decimals: 6,
        tokenName: '1002742',
        currencyExplorerLink: 'https://tronscan.org/#/address/',
        currencyExplorerTxLink: 'https://tronscan.org/#/transaction/'
    }
}

if (typeof RNFastCrypto === 'undefined') {
    delete Currencies['XMR']
}

/**
 * @param {int} currencyObject.id
 * @param {int} currencyObject.isHidden
 * @param {string} currencyObject.tokenJson
 * @param {string} currencyObject.tokenDecimals 18
 * @param {string} currencyObject.tokenAddress '0xd26114cd6EE289AccF82350c8d8487fedB8A0C07'
 * @param {string} currencyObject.tokenType 'ETH_ERC_20'
 * @param {string} currencyObject.currencyName 'OMG Token'
 * @param {string} currencyObject.currencySymbol 'OMG'
 * @param {string} currencyObject.currencyCode 'OMG'
 */
function addAndUnifyCustomCurrency(currencyObject) {
    const tmp = {
        currencyName: currencyObject.currencyName,
        currencyCode: 'CUSTOM_' + currencyObject.currencyCode,
        currencySymbol: currencyObject.currencySymbol,
        ratesCurrencyCode: currencyObject.currencyCode,
        decimals: currencyObject.tokenDecimals

    }
    tmp.currencyType = 'custom'
    if (currencyObject.tokenType === 'BNB_SMART_20') {
        tmp.currencyCode = 'CUSTOM_BNB_SMART_20_' + currencyObject.currencyCode
        if (tmp.ratesCurrencyCode.substr(0, 1) === 'B') {
            const subRate = tmp.ratesCurrencyCode.substr(1)
            if (typeof Currencies[subRate] !== 'undefined') {
                tmp.ratesCurrencyCode = subRate
            }
        }
        tmp.extendsProcessor = 'BNB_SMART_CAKE'
        tmp.addressUiChecker = 'ETH'
        tmp.tokenAddress = currencyObject.tokenAddress
        tmp.tokenBlockchain = 'BNB'
        tmp.currencyExplorerLink = 'https://bscscan.com/token/' + currencyObject.tokenAddress + '?a='
    } else if (currencyObject.tokenType === 'MATIC_ERC_20') {
        tmp.currencyCode = 'CUSTOM_MATIC_ERC_20_' + currencyObject.currencyCode
        tmp.extendsProcessor = 'MATIC_USDT'
        tmp.addressUiChecker = 'ETH'
        tmp.tokenAddress = currencyObject.tokenAddress
        tmp.tokenBlockchain = 'MATIC'
        tmp.currencyExplorerLink = 'https://polygonscan.com/token/' + currencyObject.tokenAddress + '?a='
    } else if (currencyObject.tokenType === 'FTM_ERC_20') {
        tmp.currencyCode = 'CUSTOM_FTM_ERC_20_' + currencyObject.currencyCode
        tmp.extendsProcessor = 'FTM_USDC'
        tmp.addressUiChecker = 'ETH'
        tmp.tokenAddress = currencyObject.tokenAddress
        tmp.tokenBlockchain = 'FTM'
        tmp.currencyExplorerLink = 'https://ftmscan.com/token/' + currencyObject.tokenAddress + '?a='
    } else if (currencyObject.tokenType === 'VLX_ERC_20') {
        tmp.currencyCode = 'CUSTOM_VLX_ERC_20_' + currencyObject.currencyCode
        tmp.extendsProcessor = 'VLX_USDT'
        tmp.addressUiChecker = 'ETH'
        tmp.tokenAddress = currencyObject.tokenAddress
        tmp.tokenBlockchain = 'VLX'
        tmp.currencyExplorerLink = 'https://evmexplorer.velas.com/tokens/' + currencyObject.tokenAddress
    } else if (currencyObject.tokenType === 'ONE_ERC_20') {
        tmp.currencyCode = 'CUSTOM_ONE_ERC_20_' + currencyObject.currencyCode
        tmp.extendsProcessor = 'ONE_USDC'
        tmp.addressUiChecker = 'ETH'
        tmp.tokenAddress = currencyObject.tokenAddress
        tmp.tokenBlockchain = 'ONE'
        tmp.currencyExplorerLink = 'https://explorer.harmony.one/address/' + currencyObject.tokenAddress
    } else if (currencyObject.tokenType === 'SOL') {
        tmp.currencyCode = 'CUSTOM_SOL_' + currencyObject.currencyCode
        tmp.extendsProcessor = 'SOL_RAY'
        tmp.addressUiChecker = 'SOL'
        tmp.tokenAddress = currencyObject.tokenAddress
        tmp.tokenBlockchain = 'SOLANA'
    } else if (currencyObject.tokenType === 'ETH_ERC_20') {
        tmp.extendsProcessor = 'ETH_TRUE_USD'
        tmp.addressUiChecker = 'ETH'
        tmp.tokenAddress = currencyObject.tokenAddress
        tmp.tokenBlockchain = 'ETHEREUM'
        tmp.currencyExplorerLink = 'https://etherscan.io/token/' + currencyObject.tokenAddress + '?a='
    } else if (currencyObject.tokenType === 'TRX') {
        tmp.currencyCode = 'CUSTOM_TRX_' + currencyObject.currencyCode
        tmp.extendsProcessor = 'TRX_USDT'
        tmp.addressUiChecker = 'TRX'
        tmp.currencyIcon = 'TRX'
        tmp.tokenName = currencyObject.tokenAddress
        tmp.tokenBlockchain = 'TRON'
        tmp.currencyExplorerLink = 'https://tronscan.org/#/address/'
        tmp.currencyExplorerTxLink = 'https://tronscan.org/#/transaction/'
        if (tmp.tokenName.substr(0, 1) !== 'T') {
            this.skipParentBalanceCheck = true
        }
    } else {
        return false
    }

    Currencies[tmp.currencyCode] = tmp
    return tmp
}

const ALL_SETTINGS = {}

function getCurrencyAllSettings(currencyCodeOrObject, source = '') {
    let currencyCode = currencyCodeOrObject
    if (typeof currencyCode === 'undefined' || !currencyCode) {
        return false
    }
    if (currencyCode === 'ETH_LAND') {
        Database.query(`DELETE FROM account WHERE currency_code='ETH_LAND'`)
        Database.query(`DELETE FROM account_balance WHERE currency_code='ETH_LAND'`)
        Database.query(`DELETE FROM currency WHERE currency_code='ETH_LAND'`)
    }

    if (typeof currencyCodeOrObject.currencyCode !== 'undefined') {
        currencyCode = currencyCodeOrObject.currencyCode
    }
    if (typeof ALL_SETTINGS[currencyCode] !== 'undefined') {
        return ALL_SETTINGS[currencyCode]
    }

    let settings = Currencies[currencyCode]
    if (!settings) {
        settings = CurrenciesForTests[currencyCode]
    }
    if (!settings) {
        throw new Error('Currency code not found in dict ' + JSON.stringify(currencyCode) + ' from ' + source)
    }
    if (settings.extendsProcessor && Currencies[settings.extendsProcessor]) {
        const settingsParent = Currencies[settings.extendsProcessor]
        let newKey
        for (newKey of Object.keys(settingsParent)) {
            if (typeof settings[newKey] === 'undefined' || settings[newKey] === false) {
                settings[newKey] = settingsParent[newKey]
            }
        }
    }
    ALL_SETTINGS[currencyCode] = settings
    return settings
}

export default {
    VisibleCodes, Codes, Currencies, CurrenciesForTests, getCurrencyAllSettings, addAndUnifyCustomCurrency
}
