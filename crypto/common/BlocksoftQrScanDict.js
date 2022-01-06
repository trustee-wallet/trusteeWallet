const networkToCurrencyCode = {
    'litecoin': 'LTC',
    'ltc': 'LTC',
    'bitcoingold': 'BTG',
    'btg': 'BTG',
    'bitcoinsv': 'BSV',
    'bsv': 'BSV',
    'tron': 'TRX',
    'trx': 'TRX',
    'ripple': 'XRP',
    'xrp': 'XRP',
    'stellar': 'XLM',
    'xlm': 'XLM',
    'doge': 'DOGE',
    'dogecoin': 'DOGE',
    'ethereum': 'ETH',
    'eth': 'ETH',
    'verge': 'XVG',
    'xvg': 'XVG',
    'bitcoin(testnet)': 'BTC_TEST',
    'ethereumropsten': 'ETH_ROPSTEN',
    'ethereumrinkeby': 'ETH_RINKEBY',
    'monero': 'XMR',
    'matic': 'MATIC',
    'polygon': 'MATIC',
    'polygon(matic)network': 'MATIC',
    'velas': 'VLX',
    'vlx': 'VLX',
    'binance': 'BNB',
    'bnb': 'BNB',
    'fio': 'FIO',
    'bnbsmartchain': 'BNB_SMART',
    'ethereumclassic': 'ETC',
    'vechainthor': 'VET',
    'vechainthortoken': 'VTHO',
    'metis': 'METIS'
}

const currencyNameToNetwork = {
    'binancecoin': 'bnb',
    'velas': 'velas',
    'metis': 'metis',
    'bnbsmartchain': 'bnbsmartchain',
    'polygon(matic)network': 'polygon',
    'token_of_ethereum' : 'ethereum',
    'token_of_bnb' : 'bnbsmartchain',
    'token_of_solana' : 'solana',
    'token_of_matic' : 'polygon',
    'token_of_ftm' : 'fantom',
    'token_of_metis' : 'metis',
    'token_of_tron' : 'tron',
    'token_of_vlx' : 'velas',
}


function changeCurrencyNameToNetwork(_currencyName, _helperName) {
    let helperName = typeof _helperName !== 'undefined' && _helperName ? _helperName.toLowerCase().replace(/ /g, '') : ''
    let currencyName = typeof _currencyName !== 'undefined' && _currencyName ? _currencyName.toLowerCase().replace(/ /g, '') : ''
    let tmp = currencyNameToNetwork[helperName] || currencyNameToNetwork[currencyName] || currencyName
    return tmp.toLowerCase().replace(/ /g, '')
}

function changeNetworkToCurrencyCode(network) {
    return networkToCurrencyCode[network] || 'BTC'
}


export { changeNetworkToCurrencyCode, changeCurrencyNameToNetwork }
