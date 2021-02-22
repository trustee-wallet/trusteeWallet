import { NativeModules } from 'react-native'

import DBInterface from '../../app/appstores/DataSource/DB/DBInterface'

const { RNFastCrypto } = NativeModules

const VisibleCodes = [
    'BTC', 'ETH', 'ETH_USDT', 'ETH_SOUL' // add code here to show on start screen
]
const Codes = [
    'BTC', 'ETH', 'USDT', 'LTC', 'ETH_USDT', 'ETH_UAX', 'ETH_TRUE_USD', 'ETH_BNB', 'ETH_USDC', 'ETH_PAX', 'ETH_DAI', 'ETH_DAIM', 'TRX', 'FIO'   // add code here for autocreation the wallet address with the currency
]

const Currencies = {
    'ETH': {
        currencyType: 'coin',
        currencyName: 'Ethereum',
        currencyCode: 'ETH',
        currencySymbol: 'ETH',
        addressProcessor: 'ETH',
        scannerProcessor: 'ETH',
        extendsProcessor: 'ETH',
        prettyNumberProcessor: 'ETH',
        network: 'mainnet', // network also used as mark of rate scanning
        decimals: 18,
        currencyExplorerLink: 'https://etherscan.io/address/',
        currencyExplorerTxLink: 'https://etherscan.io/tx/'
    },
    'TRX': {
        currencyType: 'coin',
        currencyName: 'Tron',
        currencyCode: 'TRX',
        currencySymbol: 'TRX',
        addressProcessor: 'TRX',
        scannerProcessor: 'TRX',
        extendsProcessor: 'TRX',
        prettyNumberProcessor: 'UNIFIED',
        network: 'mainnet', // network also used as mark of rate scanning
        decimals: 6,
        currencyExplorerLink: 'https://tronscan.org/#/address/',
        currencyExplorerTxLink: 'https://tronscan.org/#/transaction/'
    },
    'BTC': {
        currencyType: 'coin',
        currencyName: 'Bitcoin',
        currencyCode: 'BTC',
        currencySymbol: 'BTC',
        addressProcessor: 'BTC',
        scannerProcessor: 'BTC',
        extendsProcessor: 'BTC',
        prettyNumberProcessor: 'BTC',
        network: 'mainnet',
        decimals: 8,
        currencyExplorerLink: 'https://blockchair.com/bitcoin/address/',
        currencyExplorerTxLink: 'https://blockchair.com/bitcoin/transaction/'
    },

    'XMR': {
        currencyType: 'coin',
        currencyName: 'Monero',
        currencyCode: 'XMR',
        currencySymbol: 'XMR',
        addressProcessor: 'XMR',
        scannerProcessor: 'XMR',
        extendsProcessor: 'XMR',
        prettyNumberProcessor: 'UNIFIED',
        network: 'mainnet',
        decimals: 12,
        currencyExplorerLink: 'https://xmrchain.net/search?value=',
        currencyExplorerTxLink: 'https://blockchair.com/monero/transaction/'
    },
    'FIO': {
        currencyType: 'coin',
        currencyName: 'FIO',
        currencyCode: 'FIO',
        currencySymbol: 'FIO',
        addressProcessor: 'FIO',
        scannerProcessor: 'FIO',
        extendsProcessor: 'FIO',
        prettyNumberProcessor: 'UNIFIED',
        network: 'mainnet',
        decimals: 9,
        currencyExplorerLink: 'https://fio.bloks.io/key/',
        currencyExplorerTxLink: 'https://fio.bloks.io/transaction/'
    },
    /*
    'BNB': {
        currencyType: 'coin',
        currencyName: 'Binance Coin',
        currencyCode: 'BNB',
        currencySymbol: 'BNB',
        addressProcessor: 'BNB',
        scannerProcessor: 'BNB',
        extendsProcessor: 'BNB',
        prettyNumberProcessor: 'USDT',
        network: 'mainnet', // network also used as mark of rate scanning
        decimals: 8,
        // currencyExplorerLink: 'https://binance.mintscan.io/account/',
        // currencyExplorerTxLink: 'https://binance.mintscan.io/txs/',
        currencyExplorerLink: 'https://explorer.binance.org/address/',
        currencyExplorerTxLink: 'https://explorer.binance.org/tx/',
    },
    */
    // 'BTC_LIGHT': {
    //     currencyName: 'Bitcoin Lightning',
    //     currencyCode: 'BTC_LIGHT',
    //     currencySymbol: 'BTC',
    //     addressProcessor: 'BTC_LIGHT',
    //     scannerProcessor: 'BTC_LIGHT',
    //     ratesCurrencyCode: 'BTC',
    //     network: 'mainnet',
    //     prettyNumberProcessor: 'BTC',
    //     decimals: 8,
    //     currencyExplorerLink: '?',
    //     currencyExplorerTxLink: '?'
    // },

    'BTC_TEST': {
        currencyType: 'coin',
        currencyName: 'Bitcoin (Testnet)',
        currencyCode: 'BTC_TEST',
        currencySymbol: 'BTC TEST',
        scannerProcessor: 'BTC_TEST',
        ratesCurrencyCode : 'SKIP',
        extendsProcessor: 'BTC',
        network: 'testnet',
        decimals: 8,
        currencyExplorerLink: 'https://live.blockcypher.com/btc-testnet/address/',
        currencyExplorerTxLink: 'https://live.blockcypher.com/btc-testnet/tx/'
    },

    'BCH': {
        currencyType: 'coin',
        currencyName: 'Bitcoin Cash',
        currencyCode: 'BCH',
        currencySymbol: 'BCH',
        addressProcessor: 'BCH',
        scannerProcessor: 'BCH',
        extendsProcessor: 'BTC',
        addressUiChecker: 'BTC_BY_NETWORK',
        rateUiScanner: 'BCH', // if network != mainnet, set how is scanned
        network: 'bitcoincash',
        decimals: 8,
        currencyExplorerLink: 'https://blockchair.com/bitcoin-cash/address/',
        currencyExplorerTxLink: 'https://blockchair.com/bitcoin-cash/transaction/'
    },
    'BSV': {
        currencyType: 'coin',
        currencyName: 'BitcoinSV',
        currencyCode: 'BSV',
        currencySymbol: 'BSV',
        scannerProcessor: 'BSV',
        extendsProcessor: 'BTC',
        addressUiChecker: 'BTC_BY_NETWORK',
        rateUiScanner: 'BSV', // if network != mainnet, set how is scanned
        network: 'bitcoinsv',
        decimals: 8,
        currencyExplorerLink: 'https://blockchair.com/bitcoin-sv/address/',
        currencyExplorerTxLink: 'https://blockchair.com/bitcoin-sv/transaction/'
    },
    'BTG': {
        currencyType: 'coin',
        currencyName: 'Bitcoin Gold',
        currencyCode: 'BTG',
        currencySymbol: 'BTG',
        scannerProcessor: 'BTG',
        extendsProcessor: 'BTC',
        addressUiChecker: 'BTC_BY_NETWORK',
        rateUiScanner: 'BTG', // if network != mainnet, set how is scanned
        network: 'bitcoingold',
        decimals: 8,
        currencyExplorerLink: 'https://explorer.bitcoingold.org/insight/address/',
        currencyExplorerTxLink: 'https://explorer.bitcoingold.org/insight/tx/'
    },

    'LTC': {
        currencyType: 'coin',
        currencyName: 'Litecoin',
        currencyCode: 'LTC',
        currencySymbol: 'LTC',
        scannerProcessor: 'LTC',
        extendsProcessor: 'BTC',
        addressUiChecker: 'BTC_BY_NETWORK',
        rateUiScanner: 'LTC', // if network != mainnet, set how is scanned
        network: 'litecoin',
        decimals: 8,
        currencyExplorerLink: 'https://blockchair.com/litecoin/address/',
        currencyExplorerTxLink: 'https://blockchair.com/litecoin/transaction/'
    },
    'DOGE': {
        currencyType: 'coin',
        currencyName: 'Dogecoin',
        currencyCode: 'DOGE',
        currencySymbol: 'DOGE',
        extendsProcessor: 'BTC',
        scannerProcessor: 'DOGE',
        addressUiChecker: 'BTC_BY_NETWORK',
        rateUiScanner: 'DOGE', // if network != mainnet, set how is scanned
        network: 'dogecoin',
        decimals: 8,
        currencyExplorerLink: 'https://blockchair.com/dogecoin/address/',
        currencyExplorerTxLink: 'https://blockchair.com/dogecoin/transaction/'
    },
    'XVG': {
        currencyType: 'coin',
        currencyName: 'Verge',
        currencyCode: 'XVG',
        currencySymbol: 'XVG',
        extendsProcessor: 'BTC',
        scannerProcessor: 'XVG',
        addressUiChecker: 'BTC_BY_NETWORK',
        rateUiScanner: 'XVG', // if network != mainnet, set how is scanned
        network: 'verge',
        prettyNumberProcessor: 'UNIFIED',
        decimals: 6,
        currencyExplorerLink: 'https://verge-blockchain.info/address/',
        currencyExplorerTxLink: 'https://verge-blockchain.info/tx/'
    },
    'ETH_USDT': {
        currencyType: 'token',
        currencyName: 'Tether ERC20',
        currencyCode: 'ETH_USDT',
        currencySymbol: 'USDT',
        extendsProcessor: 'ETH_TRUE_USD', // also get all settings extended, not only processor
        addressUiChecker: 'ETH', // use for address check on ui (
        ratesCurrencyCode: 'USDT', // if code in rates should be different, else - used currencyCode
        decimals: 6,
        tokenBlockchain: 'ETHEREUM',
        tokenAddress: '0xdac17f958d2ee523a2206206994597c13d831ec7',
        currencyExplorerLink: 'https://etherscan.io/token/0xdac17f958d2ee523a2206206994597c13d831ec7?a='
    },
    'USDT': {
        currencyType: 'token',
        currencyName: 'Tether OMNI',
        currencyCode: 'USDT',
        currencySymbol: 'USDT',
        extendsProcessor: 'BTC',
        addressCurrencyCode: 'BTC', // use btc addresses as main
        scannerProcessor: 'USDT',
        prettyNumberProcessor: 'USDT',
        addressUiChecker: 'BTC_LEGACY',
        feesCurrencyCode: 'BTC',
        network: 'mainnet',
        decimals: 8,
        tokenBlockchain: 'BITCOIN',
        currencyExplorerLink: 'https://blockchair.com/bitcoin/address/',
        currencyExplorerTxLink: 'https://blockchair.com/bitcoin/transaction/'
    },
    'ETH_UAX' : {
        currencyType: 'token',
        currencyName : 'Crypto UAX',
        currencyCode : 'ETH_UAX',
        currencySymbol: 'UAX',
        extendsProcessor: 'ETH_TRUE_USD',
        transferProcessor: 'ETH_UAX',
        scannerProcessor: 'ETH_UAX',
        delegatedTransfer : true,
        addressUiChecker: 'ETH',
        ratesCurrencyCode: 'UAH',
        decimals: 2,
        tokenBlockchain: 'ETHEREUM',
        tokenAddress: '0x1Fc31488f28ac846588FFA201cDe0669168471bD',
        delegateAddress : '0x8826a55c94915870aceed4ea9f1186678fcbdaf6',
        currencyExplorerLink: 'https://etherscan.io/token/0x1Fc31488f28ac846588FFA201cDe0669168471bD?a='
    },
    'XRP': {
        currencyType: 'coin',
        currencyName: 'Ripple',
        currencyCode: 'XRP',
        currencySymbol: 'XRP',
        addressProcessor: 'XRP',
        scannerProcessor: 'XRP',
        extendsProcessor: 'XRP',
        prettyNumberProcessor: 'USDT',
        network: 'mainnet',
        decimals: 8,
        currencyExplorerLink: 'https://blockchair.com/ripple/account/',
        currencyExplorerTxLink: 'https://blockchair.com/ripple/transaction/'
    },
    'XLM': {
        currencyType: 'coin',
        currencyName: 'Stellar',
        currencyCode: 'XLM',
        currencySymbol: 'XLM',
        addressProcessor: 'XLM',
        scannerProcessor: 'XLM',
        extendsProcessor: 'XLM',
        prettyNumberProcessor: 'USDT',
        network: 'mainnet',
        decimals: 8,
        currencyExplorerLink: 'https://blockchair.com/steller/account/',
        currencyExplorerTxLink: 'https://blockchair.com/stellar/transaction/'
    },
    'ETH_ROPSTEN': {
        currencyType: 'coin',
        currencyName: 'Ethereum Ropsten',
        currencyCode: 'ETH_ROPSTEN',
        currencySymbol: 'ETH',
        currencyIcon: 'ETH',
        ratesCurrencyCode : 'SKIP',
        extendsProcessor: 'ETH',
        transferProcessor: 'ETH',
        network: 'ropsten',
        decimals: 18,
        currencyExplorerLink: 'https://ropsten.etherscan.io/address/',
        currencyExplorerTxLink: 'https://ropsten.etherscan.io/tx/'
    },
    'ETH_TRUE_USD': {
        currencyType: 'token',
        currencyName: 'TrueUSD',
        currencyCode: 'ETH_TRUE_USD',
        currencyIcon: 'ETH',
        currencySymbol: 'TUSD',
        addressProcessor: 'ETH',
        scannerProcessor: 'ETH_ERC_20',
        transferProcessor: 'ETH_ERC_20',
        prettyNumberProcessor: 'ETH_ERC_20',
        addressCurrencyCode: 'ETH',
        addressUiChecker: 'ETH',
        ratesCurrencyCode: 'TUSD', // if code in rates should be different, else - used currencyCode
        feesCurrencyCode: 'ETH', // pay for tx in other currency, if no - used currencyCode
        network: 'mainnet', // network also used as mark of rate scanning
        decimals: 18,
        tokenBlockchain: 'ETHEREUM',
        tokenAddress: '0x0000000000085d4780B73119b644AE5ecd22b376',
        currencyExplorerLink: 'https://etherscan.io/token/0x0000000000085d4780B73119b644AE5ecd22b376?a=',
        currencyExplorerTxLink: 'https://etherscan.io/tx/'
    },
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
    'TRX_BTT': {
        currencyType: 'token',
        currencyName: 'BitTorrent',
        currencyCode: 'TRX_BTT',
        currencySymbol: 'BTT',
        extendsProcessor: 'TRX_USDT',
        addressUiChecker: 'TRX',
        ratesCurrencyCode: 'BTT', // if code in rates should be different, else - used currencyCode
        network: 'trx', // network also used as mark of rate scanning
        skipParentBalanceCheck:true, // parent balance could be zero
        decimals: 6,
        tokenBlockchain: 'TRON',
        tokenName: '1002000',
        currencyExplorerLink: 'https://tronscan.org/#/address/',
        currencyExplorerTxLink: 'https://tronscan.org/#/transaction/'
    },
    'ETH_BNB': {
        currencyType: 'token',
        currencyName: 'BNB ERC20',
        currencyCode: 'ETH_BNB',
        currencySymbol: 'BNB',
        extendsProcessor: 'ETH_TRUE_USD',
        addressUiChecker: 'ETH',
        ratesCurrencyCode: 'BNB', // if code in rates should be different, else - used currencyCode
        decimals: 18,
        tokenBlockchain: 'ETHEREUM',
        tokenAddress: '0xB8c77482e45F1F44dE1745F52C74426C631bDD52',
        currencyExplorerLink: 'https://etherscan.io/token/0xB8c77482e45F1F44dE1745F52C74426C631bDD52?a='
    },
    'ETH_USDC': {
        currencyType: 'token',
        currencyName: 'USD Coin',
        currencyCode: 'ETH_USDC',
        currencySymbol: 'USDC',
        extendsProcessor: 'ETH_TRUE_USD',
        addressUiChecker: 'ETH',
        ratesCurrencyCode: 'USDC',
        decimals: 6,
        tokenBlockchain: 'ETHEREUM',
        tokenAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        currencyExplorerLink: 'https://etherscan.io/token/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48?a=',
        currencyExplorerTxLink: 'https://etherscan.io/tx/'
    },
    'ETH_PAX': {
        currencyType: 'token',
        currencyName: 'Paxos Standard',
        currencyCode: 'ETH_PAX',
        currencySymbol: 'PAX',
        extendsProcessor: 'ETH_TRUE_USD',
        addressUiChecker: 'ETH',
        ratesCurrencyCode: 'PAX', // if code in rates should be different, else - used currencyCode
        decimals: 18,
        tokenBlockchain: 'ETHEREUM',
        tokenAddress: '0x8e870d67f660d95d5be530380d0ec0bd388289e1',
        currencyExplorerLink: 'https://etherscan.io/token/0x8e870d67f660d95d5be530380d0ec0bd388289e1?a='
    },
    'ETH_DAI': {
        currencyType: 'token',
        currencyName: 'Sai Stablecoin v1.0',
        currencyCode: 'ETH_DAI',
        currencySymbol: 'SAI',
        extendsProcessor: 'ETH_TRUE_USD',
        addressUiChecker: 'ETH',
        ratesCurrencyCode: 'DAI', // if code in rates should be different, else - used currencyCode
        decimals: 18,
        tokenBlockchain: 'ETHEREUM',
        tokenAddress: '0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359',
        currencyExplorerLink: 'https://etherscan.io/token/0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359?a='
    },
    'ETH_DAIM': {
        currencyType: 'token',
        currencyName: 'Dai Stablecoin',
        currencyCode: 'ETH_DAIM',
        currencySymbol: 'DAI',
        extendsProcessor: 'ETH_TRUE_USD',
        addressUiChecker: 'ETH',
        ratesCurrencyCode: 'DAI', // if code in rates should be different, else - used currencyCode
        decimals: 18,
        tokenBlockchain: 'ETHEREUM',
        tokenAddress: '0x6b175474e89094c44da98b954eedeac495271d0f',
        currencyExplorerLink: 'https://etherscan.io/token/0x6b175474e89094c44da98b954eedeac495271d0f?a='
    },
    'ETH_OKB': {
        currencyType: 'token',
        currencyName: 'OKB',
        currencyCode: 'ETH_OKB',
        currencySymbol: 'OKB',
        extendsProcessor: 'ETH_TRUE_USD',
        addressUiChecker: 'ETH',
        ratesCurrencyCode: 'OKB', // if code in rates should be different, else - used currencyCode
        decimals: 18,
        tokenBlockchain: 'ETHEREUM',
        tokenAddress: '0x75231f58b43240c9718dd58b4967c5114342a86c',
        currencyExplorerLink: 'https://etherscan.io/token/0x75231f58b43240c9718dd58b4967c5114342a86c?a='
    },
    'ETH_MKR': {
        currencyType: 'token',
        currencyName: 'Maker',
        currencyCode: 'ETH_MKR',
        currencySymbol: 'MKR',
        extendsProcessor: 'ETH_TRUE_USD',
        addressUiChecker: 'ETH',
        ratesCurrencyCode: 'MKR',
        decimals: 18,
        tokenBlockchain: 'ETHEREUM',
        tokenAddress: '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2',
        currencyExplorerLink: 'https://etherscan.io/token/0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2?a='
    },
    'ETH_KNC': {
        currencyType: 'token',
        currencyName: 'KyberNetwork',
        currencyCode: 'ETH_KNC',
        currencySymbol: 'KNC',
        extendsProcessor: 'ETH_TRUE_USD',
        addressUiChecker: 'ETH',
        ratesCurrencyCode: 'KNC',
        decimals: 18,
        tokenBlockchain: 'ETHEREUM',
        tokenAddress: '0xdd974d5c2e2928dea5f71b9825b8b646686bd200',
        currencyExplorerLink: 'https://etherscan.io/token/0xdd974d5c2e2928dea5f71b9825b8b646686bd200?a='
    },
    'ETH_COMP': {
        currencyType: 'token',
        currencyName: 'Compound',
        currencyCode: 'ETH_COMP',
        currencySymbol: 'COMP',
        extendsProcessor: 'ETH_TRUE_USD',
        addressUiChecker: 'ETH',
        ratesCurrencyCode: 'COMP',
        decimals: 18,
        tokenBlockchain: 'ETHEREUM',
        tokenAddress: '0xc00e94cb662c3520282e6f5717214004a7f26888',
        currencyExplorerLink: 'https://etherscan.io/token/0xc00e94cb662c3520282e6f5717214004a7f26888?a='
    },
    'ETH_BAL': {
        currencyType: 'token',
        currencyName: 'Balancer',
        currencyCode: 'ETH_BAL',
        currencySymbol: 'BAL',
        extendsProcessor: 'ETH_TRUE_USD',
        addressUiChecker: 'ETH',
        ratesCurrencyCode: 'BAL',
        decimals: 18,
        tokenBlockchain: 'ETHEREUM',
        tokenAddress: '0xba100000625a3754423978a60c9317c58a424e3d',
        currencyExplorerLink: 'https://etherscan.io/token/0xba100000625a3754423978a60c9317c58a424e3d?a='
    },
    'ETH_LEND': {
        currencyType: 'token',
        currencyName: 'EthLend',
        currencyCode: 'ETH_LEND',
        currencySymbol: 'LEND',
        extendsProcessor: 'ETH_TRUE_USD',
        addressUiChecker: 'ETH',
        ratesCurrencyCode: 'LEND',
        decimals: 18,
        tokenBlockchain: 'ETHEREUM',
        tokenAddress: '0x80fb784b7ed66730e8b1dbd9820afd29931aab03',
        currencyExplorerLink: 'https://etherscan.io/token/0x80fb784b7ed66730e8b1dbd9820afd29931aab03?a='
    },
    'ETH_BNT': {
        currencyType: 'token',
        currencyName: 'Bancor',
        currencyCode: 'ETH_BNT',
        currencySymbol: 'BNT',
        extendsProcessor: 'ETH_TRUE_USD',
        addressUiChecker: 'ETH',
        ratesCurrencyCode: 'BNT',
        decimals: 18,
        tokenBlockchain: 'ETHEREUM',
        tokenAddress: '0x1f573d6fb3f13d689ff844b4ce37794d79a7ff1c',
        currencyExplorerLink: 'https://etherscan.io/token/0x1f573d6fb3f13d689ff844b4ce37794d79a7ff1c?a='
    },


    'ETH_SOUL': {
        currencyType: 'token',
        currencyName: 'CryptoSoul',
        currencyCode: 'ETH_SOUL',
        currencySymbol: 'SOUL',
        extendsProcessor: 'ETH_TRUE_USD',
        scannerProcessor: 'ETH_SOUL',
        addressUiChecker: 'ETH',
        ratesCurrencyCode: 'SOUL', // if code in rates should be different, else - used currencyCode
        decimals: 18,
        tokenBlockchain: 'ETHEREUM',
        tokenAddress: '0xbb1f24c0c1554b9990222f036b0aad6ee4caec29',
        currencyExplorerLink: 'https://etherscan.io/token/0xbb1f24c0c1554b9990222f036b0aad6ee4caec29?a='
    },
    'ETH_ONE': {
        currencyType: 'token',
        currencyName: 'Harmony',
        currencyCode: 'ETH_ONE',
        currencySymbol: 'ONE',
        extendsProcessor: 'ETH_TRUE_USD',
        addressUiChecker: 'ETH',
        ratesCurrencyCode: 'ONE', // if code in rates should be different, else - used currencyCode
        decimals: 18,
        tokenBlockchain: 'ETHEREUM',
        tokenAddress: '0x799a4202c12ca952cb311598a024c80ed371a41e',
        currencyExplorerLink: 'https://etherscan.io/token/0x799a4202c12ca952cb311598a024c80ed371a41e?a='
    }


}

const CurrenciesForTests = {
    'BTC_SEGWIT': {
        currencyName: 'Bitcoin Segwit',
        currencyCode: 'BTC_SEGWIT',
        currencySymbol: 'BTC',
        addressProcessor: 'BTC_SEGWIT',
        extendsProcessor: 'BTC',
        ratesCurrencyCode: 'BTC'
    },
    'BTC_SEGWIT_COMPATIBLE': {
        currencyName: 'Bitcoin Compatible Segwit',
        currencyCode: 'BTC_SEGWIT_COMPATIBLE',
        currencySymbol: 'BTC',
        addressProcessor: 'BTC_SEGWIT_COMPATIBLE',
        extendsProcessor: 'BTC',
        ratesCurrencyCode: 'BTC'
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
    if (currencyObject.tokenType === 'ETH_ERC_20') {
        tmp.extendsProcessor = 'ETH_TRUE_USD'
        tmp.addressUiChecker = 'ETH'
        tmp.tokenAddress = currencyObject.tokenAddress
        tmp.tokenBlockchain = 'ETHEREUM'
        tmp.currencyExplorerLink = 'https://etherscan.io/token/' + currencyObject.tokenAddress + '?a='
        tmp.decimals = currencyObject.tokenDecimals
    } else if (currencyObject.tokenType === 'TRX') {
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

    Currencies['CUSTOM_' + currencyObject.currencyCode] = tmp
}

const ALL_SETTINGS = {}

function getCurrencyAllSettings(currencyCodeOrObject) {
    let currencyCode = currencyCodeOrObject
    if (typeof currencyCode === 'undefined' || !currencyCode) {
        return false
    }
    if (currencyCode === 'ETH_LAND') {
        const dbInterface = new DBInterface()
        dbInterface.setQueryString(`DELETE FROM account WHERE currency_code='ETH_LAND'`).query()
        dbInterface.setQueryString(`DELETE FROM account_balance WHERE currency_code='ETH_LAND'`).query()
        dbInterface.setQueryString(`DELETE FROM currency WHERE currency_code='ETH_LAND'`).query()
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
        throw new Error('Currency code not found in dict ' + JSON.stringify(currencyCode))
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
