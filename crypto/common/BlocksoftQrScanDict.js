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
   'polygon(matic)network': 'polygon' 
}


function changeCurrencyNameToNetwork(currencyName, helperName) {
    return currencyNameToNetwork[helperName] || currencyNameToNetwork[currencyName] || currencyName
}

function changeNetworkToCurrencyCode(network){
    return networkToCurrencyCode[network] || 'BTC'
}


export { changeNetworkToCurrencyCode, changeCurrencyNameToNetwork}