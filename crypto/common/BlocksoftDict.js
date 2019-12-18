const Codes = [
    'BTC', 'ETH', 'USDT', 'LTC', 'ETH_USDT', 'ETH_TRUE_USD', 'ETH_BNB', 'ETH_USDC', 'ETH_PAX', 'ETH_DAI', 'TRX'   // add code here for autocreation the wallet address with the currency
]

const Currencies = {
    'ETH': {
        currencyName: 'Ethereum',
        currencyCode: 'ETH',
        currencySymbol: 'ETH',
        addressProcessor: 'ETH',
        scannerProcessor: 'ETH',
        extendsProcessor: 'ETH',
        txProcessor: 'ETH',
        prettyNumberProcessor: 'ETH',
        network: 'mainnet', // network also used as mark of rate scanning
        decimals: 18,
        buyable: 1,
        currencyExplorerLink: 'https://etherscan.io/address/',
        currencyExplorerTxLink: 'https://etherscan.io/tx/'
    },
    'TRX': {
        currencyName: 'Tron',
        currencyCode: 'TRX',
        currencySymbol: 'TRX',
        addressProcessor: 'TRX',
        scannerProcessor: 'TRX',
        extendsProcessor: 'TRX',
        txProcessor: 'TRX',
        prettyNumberProcessor: 'UNIFIED',
        network: 'mainnet', // network also used as mark of rate scanning
        decimals: 6,
        buyable: 1,
        currencyExplorerLink: 'https://tronscan.org/#/address/',
        currencyExplorerTxLink: 'https://tronscan.org/#/transaction/'
    },
    'BTC': {
        currencyName: 'Bitcoin',
        currencyCode: 'BTC',
        currencySymbol: 'BTC',
        addressProcessor: 'BTC',
        scannerProcessor: 'BTC',
        extendsProcessor: 'BTC',
        txProcessor: 'BTC',
        prettyNumberProcessor: 'BTC',
        network: 'mainnet',
        decimals: 8,
        buyable: 1,
        currencyExplorerLink: 'https://live.blockcypher.com/btc/address/',
        currencyExplorerTxLink: 'https://live.blockcypher.com/btc/tx/'
    },
    'BTC_LIGHT': {
        currencyName: 'Bitcoin Lightning',
        currencyCode: 'BTC_LIGHT',
        currencySymbol: 'BTC',
        addressProcessor: 'BTC_LIGHT',
        scannerProcessor: 'BTC_LIGHT',
        ratesCurrencyCode: 'BTC',
        txProcessor: 'BTC_LIGHT',
        network: 'mainnet',
        prettyNumberProcessor: 'BTC',
        decimals: 8,
        buyable: 0,
        currencyExplorerLink: '?',
        currencyExplorerTxLink: '?'
    },
    'BTC_TEST': {
        currencyName: 'Bitcoin (Testnet)',
        currencyCode: 'BTC_TEST',
        currencySymbol: 'BTC TEST',
        extendsProcessor: 'BTC',
        network: 'testnet',
        decimals: 8,
        buyable: 0,
        currencyExplorerLink: 'https://live.blockcypher.com/btc-testnet/address/',
        currencyExplorerTxLink: 'https://live.blockcypher.com/btc-testnet/tx/'
    },
    'LTC': {
        currencyName: 'Litecoin',
        currencyCode: 'LTC',
        currencySymbol: 'LTC',
        extendsProcessor: 'BTC',
        addressUiChecker: 'BTC_BY_NETWORK',
        rateUiScanner: 'LTC', // if network != mainnet, set how is scanned
        txProcessor: 'LTC',
        network: 'litecoin',
        decimals: 8,
        buyable: 1,
        currencyExplorerLink: 'https://live.blockcypher.com/ltc/address/',
        currencyExplorerTxLink: 'https://live.blockcypher.com/ltc/tx/'
    },
    'DOGE': {
        currencyName: 'Dogecoin',
        currencyCode: 'DOGE',
        currencySymbol: 'DOGE',
        extendsProcessor: 'BTC',
        scannerProcessor: 'DOGE',
        addressUiChecker: 'BTC_BY_NETWORK',
        rateUiScanner: 'DOGE', // if network != mainnet, set how is scanned
        txProcessor: 'DOGE',
        network: 'dogecoin',
        decimals: 8,
        buyable: 0,
        currencyExplorerLink: 'https://dogechain.info/address/',
        currencyExplorerTxLink: 'https://dogechain.info/tx/'
    },
    'XVG': {
        currencyName: 'Verge',
        currencyCode: 'XVG',
        currencySymbol: 'XVG',
        extendsProcessor: 'BTC',
        scannerProcessor: 'XVG',
        addressUiChecker: 'BTC_BY_NETWORK',
        rateUiScanner: 'XVG', // if network != mainnet, set how is scanned
        txProcessor: 'XVG',
        network: 'verge',
        prettyNumberProcessor: 'UNIFIED',
        decimals: 6,
        buyable: 0,
        currencyExplorerLink: 'https://verge-blockchain.info/address/',
        currencyExplorerTxLink: 'https://verge-blockchain.info/tx/'
    },
    'ETH_USDT': {
        currencyName: 'Tether',
        currencyCode: 'ETH_USDT',
        currencySymbol: 'USDT',
        extendsProcessor: 'ETH_TRUE_USD', //also get all settings extended, not only processor
        addressUiChecker: 'ETH', // use for address check on ui (
        ratesCurrencyCode: 'USDT', // if code in rates should be different, else - used currencyCode
        decimals: 6,
        buyable: 1,
        tokenAddress: '0xdac17f958d2ee523a2206206994597c13d831ec7',
        currencyExplorerLink: 'https://etherscan.io/token/0xdac17f958d2ee523a2444406994597c13d831ec7?a='
    },
    'USDT': {
        currencyName: 'Tether',
        currencyCode: 'USDT',
        currencySymbol: 'USDT',
        extendsProcessor: 'BTC',
        addressCurrencyCode: 'BTC', // use btc addresses as main
        scannerProcessor: 'USDT',
        txProcessor: 'USDT',
        prettyNumberProcessor: 'USDT',
        feesCurrencyCode: 'BTC',
        network: 'mainnet',
        decimals: 8,
        buyable: 0,
        currencyExplorerLink: 'https://omniexplorer.info/address/',
        currencyExplorerTxLink: 'https://omniexplorer.info/tx/'
    },
    'ETH_ROPSTEN': {
        currencyName: 'Ethereum Ropsten',
        currencyCode: 'ETH_ROPSTEN',
        currencySymbol: 'ETH',
        currencyIcon: 'ETH',
        extendsProcessor: 'ETH',
        network: 'ropsten',
        decimals: 18,
        buyable: 0,
        currencyExplorerLink: 'https://ropsten.etherscan.io/address/',
        currencyExplorerTxLink: 'https://ropsten.etherscan.io/tx/'
    },
    'ETH_TRUE_USD': {
        currencyName: 'TrueUSD',
        currencyCode: 'ETH_TRUE_USD',
        currencyIcon: 'ETH',
        currencySymbol: 'TUSD',
        addressProcessor: 'ETH',
        scannerProcessor: 'ETH_ERC_20',
        txProcessor: 'ETH_ERC_20',
        prettyNumberProcessor: 'ETH_ERC_20',
        addressCurrencyCode: 'ETH',
        addressUiChecker: 'ETH',
        ratesCurrencyCode: 'TUSD', // if code in rates should be different, else - used currencyCode
        feesCurrencyCode: 'ETH', // pay for tx in other currency, if no - used currencyCode
        network: 'mainnet', // network also used as mark of rate scanning
        decimals: 18,
        buyable: 0,
        tokenAddress: '0x0000000000085d4780B73119b644AE5ecd22b376',
        currencyExplorerLink: 'https://etherscan.io/token/0x0000000000085d4780B72222b644AE5ecd22b376?a=',
        currencyExplorerTxLink: 'https://etherscan.io/tx/'
    },
    'TRX_USDT': {
        currencyName: 'Tether TRX',
        currencyCode: 'TRX_USDT',
        currencyIcon: 'TRX',
        currencySymbol: 'USDT',
        addressProcessor: 'TRX',
        scannerProcessor: 'TRX',
        txProcessor: 'TRX',
        prettyNumberProcessor: 'UNIFIED',
        addressCurrencyCode: 'TRX',
        addressUiChecker: 'TRX',
        feesCurrencyCode: 'TRX', // pay for tx in other currency, if no - used currencyCode
        network: 'trx', // network also used as mark of rate scanning
        decimals: 6,
        buyable: 0,
        tokenName: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
        currencyExplorerLink: 'https://tronscan.org/#/token/TR7NHqjeKQxGTCi8q8ZY1111otSzgjLj6t/holders',
        currencyExplorerTxLink: 'https://tronscan.org/#/transaction/'
    },
    'TRX_BTT': {
        currencyName: 'BitTorrent TRX',
        currencyCode: 'TRX_BTT',
        currencySymbol: 'BTT',
        extendsProcessor: 'TRX_USDT',
        addressUiChecker: 'TRX',
        ratesCurrencyCode: 'BTT', // if code in rates should be different, else - used currencyCode
        network: 'trx', // network also used as mark of rate scanning
        decimals: 6,
        buyable: 0,
        tokenName: '1002000',
        currencyExplorerLink: 'https://tronscan.org/#/token/1002099'
    },
    'ETH_BNB': {
        currencyName: 'BNB',
        currencyCode: 'ETH_BNB',
        currencySymbol: 'BNB',
        extendsProcessor: 'ETH_TRUE_USD',
        addressUiChecker: 'ETH',
        ratesCurrencyCode: 'BNB', // if code in rates should be different, else - used currencyCode
        decimals: 18,
        buyable: 0,
        tokenAddress: '0xB8c77482e45F1F44dE1749999C74426C631bDD52',
        currencyExplorerLink: 'https://etherscan.io/token/0xB8c77482e45F1F44dE1749999C74426C631bDD52?a='
    },
    'ETH_USDC': {
        currencyName: 'USD Coin',
        currencyCode: 'ETH_USDC',
        currencySymbol: 'USDC',
        extendsProcessor: 'ETH_TRUE_USD',
        addressUiChecker: 'ETH',
        ratesCurrencyCode: 'USDC',
        decimals: 6,
        buyable: 0,
        tokenAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606e3e3',
        currencyExplorerLink: 'https://etherscan.io/token/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606e3e3?a=',
        currencyExplorerTxLink: 'https://etherscan.io/tx/'
    },
    'ETH_PAX': {
        currencyName: 'Paxos Standard',
        currencyCode: 'ETH_PAX',
        currencySymbol: 'PAX',
        extendsProcessor: 'ETH_TRUE_USD',
        addressUiChecker: 'ETH',
        ratesCurrencyCode: 'PAX', // if code in rates should be different, else - used currencyCode
        decimals: 18,
        buyable: 0,
        tokenAddress: '0x8e870d67f660d95d5be530380d0ec0bd388234e1',
        currencyExplorerLink: 'https://etherscan.io/token/0x8e870d67f660d95d5be530380d0ec0bd388234e1?a='
    },
    'ETH_DAI': {
        currencyName: 'Dai Stablecoin v1.0',
        currencyCode: 'ETH_DAI',
        currencySymbol: 'DAI',
        extendsProcessor: 'ETH_TRUE_USD',
        addressUiChecker: 'ETH',
        ratesCurrencyCode: 'DAI', // if code in rates should be different, else - used currencyCode
        decimals: 18,
        buyable: 0,
        tokenAddress: '0x89d24a6b4ccb1b6faa2625fe562bdd9a23555559',
        currencyExplorerLink: 'https://etherscan.io/token/0x89d24a6b4ccb1b6faa2625fe562bdd9a23555559?a='
    },
    'ETH_SOUL': {
        currencyName: 'CryptoSoul',
        currencyCode: 'ETH_SOUL',
        currencySymbol: 'SOUL',
        extendsProcessor: 'ETH_TRUE_USD',
        scannerProcessor: 'ETH_SOUL',
        addressUiChecker: 'ETH',
        ratesCurrencyCode: 'SOUL', // if code in rates should be different, else - used currencyCode
        decimals: 18,
        buyable: 0,
        tokenAddress: '0xbb1f24c0c1554b9990222f036b0aad6ee4caec',
        currencyExplorerLink: 'https://etherscan.io/token/0xbb1f24c0c1554b9990222f036b0aad6ee4caec?a='
    },
    'ETH_ONE': {
        currencyName: 'Harmony',
        currencyCode: 'ETH_ONE',
        currencySymbol: 'ONE',
        extendsProcessor: 'ETH_TRUE_USD',
        scannerProcessor: 'ETH',
        addressUiChecker: 'ETH',
        ratesCurrencyCode: 'ONE', // if code in rates should be different, else - used currencyCode
        decimals: 18,
        buyable: 0,
        tokenAddress: '0x799a4202c12ca952cb311598a024c80ed123441e',
        currencyExplorerLink: 'https://etherscan.io/token/0x799a4202c12ca952cb311598a024c80ed123441e?a='
    }


}

const CurrenciesForTests = {
    'ETH_ROPSTEN_KSU_TOKEN': {
        currencyName: 'Some ERC-20 Ropsten',
        currencyCode: 'ETH_ROPSTEN_KSU_TOKEN',
        currencySymbol: 'Some ERC-20 Ropsten',
        extendsProcessor: 'ETH_TRUE_USD',
        addressCurrencyCode: 'ETH_ROPSTEN',
        feesCurrencyCode: 'ETH_ROPSTEN',
        network: 'ropsten',
        decimals: 6,
        buyable: 0,
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
        buyable: 0,
        tokenName: '1002742',
        currencyExplorerLink: 'https://tronscan.org/#/token/1002742/holders',
        currencyExplorerTxLink: 'https://tronscan.org/#/transaction/'
    },
}

function addAndUnifyCustomCurrency(currencyObject) {
    let tmp = {
        currencyName: currencyObject.currency_name,
        currencyCode: 'CUSTOM_' + currencyObject.currency_code,
        currencySymbol: currencyObject.currency_symbol,
        ratesCurrencyCode: currencyObject.currency_code,
        decimals: currencyObject.token_decimals,
        buyable: 0

    }
    if (currencyObject.token_type === 'ETH_ERC_20') {
        tmp.extendsProcessor = 'ETH_TRUE_USD'
        tmp.addressUiChecker = 'ETH'
        tmp.tokenAddress = currencyObject.token_address
        tmp.currencyExplorerLink = 'https://etherscan.io/token/' + currencyObject.token_address + '?a='
    } else if (currencyObject.token_type === 'TRX') {
        tmp.extendsProcessor = 'TRX_USDT'
        tmp.addressUiChecker = 'TRX'
        tmp.currencyIcon = 'TRX'
        tmp.tokenName = currencyObject.token_address
        tmp.currencyExplorerLink = 'https://tronscan.org/#/token/' + currencyObject.token_address + '/holders'
    } else {
        return false
    }

    Currencies['CUSTOM_' + currencyObject.currency_code] = tmp
}

function getCurrencyAllSettings(currencyCode) {
    let settings = Currencies[currencyCode]
    if (!settings) {
        settings = CurrenciesForTests[currencyCode]
    }
    if (!settings) {
        throw new Error('Currency code not found in dict ' + currencyCode)
    }
    if (settings.extendsProcessor && Currencies[settings.extendsProcessor]) {
        let settingsParent = Currencies[settings.extendsProcessor]
        for (let newKey of Object.keys(settingsParent)) {
            if (!settings[newKey]) {
                settings[newKey] = settingsParent[newKey]
            }
        }
    }
    return settings
}

export default {
    Codes, Currencies, CurrenciesForTests, getCurrencyAllSettings, addAndUnifyCustomCurrency
}
