/**
 * @version 0.9
 */
const config = {
    version: {
        code: 'VERSION_CODE_PLACEHOLDER',
        hash: 'COMMIT_SHORT_SHA_PLACEHOLDER'
    },

    exchange: {
        mode: 'PROD', // INFO: DEV or PROD
        apiEndpoints: {
            baseURL: 'https://api.v2.trustee.deals',
            baseURLTest: 'https://testapi.v2.blocksoftlab.com'
        }
    },
    language: {
        languageList: [
            {
                code: 'en-US'
            },
            {
                code: 'ru-RU'
            },
            {
                code: 'uk-UA'
            }
        ]
    },
    scanner : {
        scannerSettings : [
            {
                code : 'none'
            },
            {
                code : '10min'
            },
            {
                code : '1min'
            }
        ]
    },
    daemon: {
        updateTimes: {
            updateCurrencyRate : 140000,// 1 in 2.2 minutes
            updateAccountBalanceAndTransactions: 30000, // 1 in 1 minute
            updateAccounts: 30000,
            updateAppTasks : 80000, // 1 in 1 minute
            updateAppNews : 120000, // 1 in 2 minutes
            updateTradeOrders: 30000,
            updateCard: 30000,
        },
        delayTimes: {
            updateCurrencyRate : 500,
            updateAccountBalanceAndTransactions: 10000,
            updateAccounts: 15000,
            updateAppTasks : 20000,
            updateAppNews : 25000,
            updateTradeOrders: 30000,
            updateCard: 35000,
        }
    },
    request: {
        timeout: 10000
    },
    cashback: {
        mode: 'PROD', // INFO: DEV or PROD
        apiEndpoints: {
            baseURL: 'https://cashback.trustee.deals',
            baseURLTest: 'https://testcashback1.blocksoftlab.com'
        }
    },
    debug: {
        appLogs: false, // set false to see usual logs in console
        appDaemonLogs: false, // set false to see cron jobs logs in console,
        cryptoLogs: false, // set false to see crypto logs in console
        cryptoErrors: false, // set false to get crypto errors in console
        appErrors: false, // set false to get errors in console
        appDBLogs: false, // set false to get db query in console
        firebaseLogs: false // set false not to collect data to firebase live db
    },
    tg: {
        appDefaultTg: '', // bot id for app errors https://t.me/trusteeAppErrorsBot
        trusteeCore: ''
    }
}

// eslint-disable-next-line no-undef
if (config.exchange.mode === 'PROD' || config.cashback.mode === 'PROD') alert = () => {
}

export default config
