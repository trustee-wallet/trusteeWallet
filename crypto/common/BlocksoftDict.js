const Codes = [
    'BTC', 'ETH', 'USDT' // add code here for autocreation the wallet address with the currency
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
        addressUiChecker: 'LTC',
        rateUiScanner: 'LTC', // if network != mainnet, set how is scanned
        txProcessor: 'LTC',
        network: 'litecoin',
        decimals: 8,
        buyable: 1,
        currencyExplorerLink: 'https://live.blockcypher.com/ltc/address/',
        currencyExplorerTxLink: 'https://live.blockcypher.com/ltc/tx/'
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
        currencyExplorerLink: 'https://etherscan.io/token/0xdac17f958d2ee523a2206206994597c13d831ec7?a=',
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
        currencySymbol: 'TrueUSD',
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
        currencyExplorerLink: 'https://etherscan.io/token/0x0000000000085d4780B73119b644AE5ecd22b376?a=',
        currencyExplorerTxLink: 'https://etherscan.io/tx/'
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
        tokenAddress: '0xB8c77482e45F1F44dE1745F52C74426C631bDD52',
        currencyExplorerLink: 'https://etherscan.io/token/0xB8c77482e45F1F44dE1745F52C74426C631bDD52?a=',
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
        tokenAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        currencyExplorerLink: 'https://etherscan.io/token/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48?a=',
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
        tokenAddress: '0x8e870d67f660d95d5be530380d0ec0bd388289e1',
        currencyExplorerLink: 'https://etherscan.io/token/0x8e870d67f660d95d5be530380d0ec0bd388289e1?a=',
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
        tokenAddress: '0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359',
        currencyExplorerLink: 'https://etherscan.io/token/0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359?a=',
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
         tokenAddress: '0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359',
         currencyExplorerLink: 'https:ropsten.etherscan.io/address/',
         currencyExplorerTxLink: 'https:ropsten.etherscan.io/tx/'
     }
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
    Codes, Currencies, CurrenciesForTests, getCurrencyAllSettings
}
