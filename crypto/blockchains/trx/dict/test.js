const axios = require('axios')

const dict = {
    'TRX_USDT': {
        currencyType: 'token',
        transferProcessor: 'TRX',
        currencyName: 'Tether TRC20',
        currencyCode: 'TRX_USDT',
        currencyIcon: 'TRX',
        currencySymbol: 'USDT',
        ratesCurrencyCode: 'USDT',
        addressProcessor: 'TRX',
        scannerProcessor: 'TRX',
        prettyNumberProcessor: 'UNIFIED',
        addressCurrencyCode: 'TRX',
        addressUiChecker: 'TRX',
        feesCurrencyCode: 'TRX', // pay for tx in other currency, if no - used currencyCode
        network: 'trx', // network also used as mark of rate scanning
        decimals: 6,
        tokenBlockchain: 'TRON',
        tokenName: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
        currencyExplorerLink: 'https://tronscan.org/#/address/',
        currencyExplorerTxLink: 'https://tronscan.org/#/transaction/'
    },

    'TRX_WBTT': {
        currencyType: 'token',
        currencyName: 'BitTorrent TRC20',
        currencyCode: 'TRX_WBTT',
        currencySymbol: 'BTT',
        extendsProcessor: 'TRX_USDT',
        addressUiChecker: 'TRX',
        ratesCurrencyCode: 'BTT', // if code in rates should be different, else - used currencyCode
        network: 'trx', // network also used as mark of rate scanning
        decimals: 6,
        tokenBlockchain: 'TRON',
        tokenName: 'TKfjV9RNKJJCqPvBtK8L7Knykh7DNWvnYt',
        currencyExplorerLink: 'https://tronscan.org/#/address/',
        currencyExplorerTxLink: 'https://tronscan.org/#/transaction/'
    },

    'TRX_JST': {
        currencyType: 'token',
        currencyName: 'JUST',
        currencyCode: 'TRX_JST',
        currencySymbol: 'JST',
        extendsProcessor: 'TRX_USDT',
        addressUiChecker: 'TRX',
        ratesCurrencyCode: 'JST', // if code in rates should be different, else - used currencyCode
        network: 'trx', // network also used as mark of rate scanning
        decimals: 18,
        tokenBlockchain: 'TRON',
        tokenName: 'TCFLL5dx5ZJdKnWuesXxi1VPwjLVmWZZy9',
        currencyExplorerLink: 'https://tronscan.org/#/address/',
        currencyExplorerTxLink: 'https://tronscan.org/#/transaction/'
    },

    'TRX_USDJ': {
        currencyType: 'token',
        currencyName: 'JUST Stablecoin',
        currencyCode: 'TRX_USDJ',
        currencySymbol: 'USDJ',
        extendsProcessor: 'TRX_USDT',
        addressUiChecker: 'TRX',
        ratesCurrencyCode: 'USDJ', // if code in rates should be different, else - used currencyCode
        network: 'trx', // network also used as mark of rate scanning
        decimals: 18,
        tokenBlockchain: 'TRON',
        tokenName: 'TMwFHYXLJaRUPeW6421aqXL4ZEzPRFGkGT',
        currencyExplorerLink: 'https://tronscan.org/#/address/',
        currencyExplorerTxLink: 'https://tronscan.org/#/transaction/'
    },

    'TRX_SUN': {
        currencyType: 'token',
        currencyName: 'SUN',
        currencyCode: 'TRX_SUN',
        currencySymbol: 'SUN',
        extendsProcessor: 'TRX_USDT',
        addressUiChecker: 'TRX',
        ratesCurrencyCode: 'SUN', // if code in rates should be different, else - used currencyCode
        network: 'trx', // network also used as mark of rate scanning
        decimals: 18,
        tokenBlockchain: 'TRON',
        tokenName: 'TKkeiboTkxXKJpbmVFbv4a8ov5rAfRDMf9',
        currencyExplorerLink: 'https://tronscan.org/#/address/',
        currencyExplorerTxLink: 'https://tronscan.org/#/transaction/'
    },

    'TRX_WINK': {
        currencyType: 'token',
        currencyName: 'WIN Token',
        currencyCode: 'TRX_WINK',
        currencySymbol: 'WINK',
        extendsProcessor: 'TRX_USDT',
        addressUiChecker: 'TRX',
        ratesCurrencyCode: 'WINK', // if code in rates should be different, else - used currencyCode
        network: 'trx', // network also used as mark of rate scanning
        decimals: 6,
        tokenBlockchain: 'TRON',
        tokenName: 'TLa2f6VPqDgRE67v1736s7bJ8Ray5wYjU7',
        currencyExplorerLink: 'https://tronscan.org/#/address/',
        currencyExplorerTxLink: 'https://tronscan.org/#/transaction/'
    },

    'TRX_BTC': {
        currencyType: 'token',
        currencyName: 'BTC TRC20',
        currencyCode: 'TRX_BTC',
        currencySymbol: 'BTC',
        extendsProcessor: 'TRX_USDT',
        addressUiChecker: 'TRX',
        ratesCurrencyCode: 'BTC', // if code in rates should be different, else - used currencyCode
        network: 'trx', // network also used as mark of rate scanning
        decimals: 8,
        tokenBlockchain: 'TRON',
        tokenName: 'TN3W4H6rK2ce4vX9YnFQHwKENnHjoxb3m9',
        currencyExplorerLink: 'https://tronscan.org/#/address/',
        currencyExplorerTxLink: 'https://tronscan.org/#/transaction/'
    },

    'TRX_ETH': {
        currencyType: 'token',
        currencyName: 'ETH TRC20',
        currencyCode: 'TRX_ETH',
        currencySymbol: 'ETH',
        extendsProcessor: 'TRX_USDT',
        addressUiChecker: 'TRX',
        ratesCurrencyCode: 'ETH', // if code in rates should be different, else - used currencyCode
        network: 'trx', // network also used as mark of rate scanning
        decimals: 18,
        tokenBlockchain: 'TRON',
        tokenName: 'THb4CqiFdwNHsWsQCs4JhzwjMWys4aqCbF',
        currencyExplorerLink: 'https://tronscan.org/#/address/',
        currencyExplorerTxLink: 'https://tronscan.org/#/transaction/'
    }
}
const main = async () => {
    const tokens = {}
    for (let code in dict) {
        const row = dict[code]
        tokens[row.tokenName] = row.currencyCode
    }
    const tmp = await axios.get('https://api.justswap.io/v1/tradepairlist')
    const rows = {}
    for (let code in tmp.data) {
        const row = tmp.data[code]
        if (row.quote_name === 'TRX') {
            if (typeof row.base_name !== 'undefined' && row.base_name.indexOf('JUSTSWAP-') === 0) {
                rows[row.base_id] = row.base_name
            }
        }
    }
    console.log(rows)
}
