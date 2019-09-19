const config = {
    exchange: {
        mode: 'PROD', 
        apiEndpoints: {
            baseURL: 'https://api.wallet.trustee.deals',
            baseURLTest: 'https://testapiwallet.blocksoftlab.com',
        },
    },
    language: {
        languageList: [
            {
                code: 'en-US',
            },
            {
                code: 'ru-RU'
            },
            {
                code: 'uk-UA'
            }
        ]
    },
    daemon: {
        updateTimes: {
            updateCurrencyRate: 30000,
            updateAccountBalance: 30000,
            updateAccountTransactions: 30000,
            updateExchangeOrders: 60000,
        }
    },
    cashback: {
        mode: 'PROD', 
        apiEndpoints: {
            baseURL: 'https://cashback.trustee.deals',
            baseURLTest: 'https://testcashback1.blocksoftlab.com',
        },
    }
}

if(config.exchange.mode === 'PROD' || config.cashback.mode === 'PROD') alert = () => {}

export default config