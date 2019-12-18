const config = {
    version:{
        code: 'VERSION_CODE_PLACEHOLDER',
        hash: 'COMMIT_SHORT_SHA_PLACEHOLDER'
    },
    exchange: {
        mode: 'PROD', //INFO: DEV or PROD
        apiEndpoints: {
            baseURL: 'https://api.v2.trustee.deals',
            baseURLTest: 'https://testapi.v2.blocksoftlab.com',
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
        mode: 'PROD', //INFO: DEV or PROD
        apiEndpoints: {
            baseURL: 'https://cashback.trustee.deals',
            baseURLTest: 'https://testcashback1.blocksoftlab.com',
        },
    },
    debug : {
        appLogs: false, // set true to see usual logs in console
        appDaemonLogs: false, // set true to see cron jobs logs in console,
        cryptoLogs: false, // set true to see crypto logs in console
        cryptoErrors: false, // set true to get crypto errors in console
        appErrors: false, //set true to get errors in console
        appDBLogs: false //set true to get db query in console
    },
    tg : {
        appDefaultTg : '', // https://t.me/trusteeDevErrorsBot
        trusteeTeam : ['123456789'],
        trusteeCore : ['123456789']
    }
}

if(config.exchange.mode === 'PROD' || config.cashback.mode === 'PROD') alert = () => {}

export default config