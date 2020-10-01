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
            baseURLTest: 'https://testapi.v2.blocksoftlab.com',
            entryURL: 'https://exchange.trustee.deals',
            entryURLTest: 'https://testexchange.trustee.deals'
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
    scanner: {
        scannerSettings: [
            {
                code: 'none'
            },
            {
                code: '10min'
            },
            {
                code: '1min'
            }
        ]
    },
    daemon: {
        updateTimes: {
            oneByOne: 5000, // 5 seconds
            view: 10000 // 10 second
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
        appLogs: false, // set false to see usual logs in files only
        appDaemonLogs: false, // set false to see cron jobs logs in files only
        cryptoLogs: false, // set false to see crypto logs in files only
        cryptoErrors: false, // set false to get crypto errors  in tg only
        appErrors: false, // set false to get errors in tg only
        appDBLogs: false, // set false to get db query in files only
        firebaseLogs: true // set false not to collect data to firebase live db
    },
    tg: {
        appDefaultTg: '', // bot id for app errors https://t.me/trusteeAppErrorsBot
        trusteeCore: ''
    },
    fio: {
        apiEndpoints: {
            baseURL: 'http://testnet.fioprotocol.io/v1/chain',
            registrationSiteURL: 'https://reg.fioprotocol.io/ref/trustee?publicKey=',
        },
    },
}

// eslint-disable-next-line no-undef
if (config.exchange.mode === 'PROD' || config.cashback.mode === 'PROD') alert = () => {
}

export default config
