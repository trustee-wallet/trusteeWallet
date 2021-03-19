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
            baseV3URL: 'https://api.v3.trustee.deals',
            baseV3URLTest: 'https://testapiv3.trustee.deals',
            entryMarketURL: 'https://trustee.exchange',
            entryURL: 'https://exchange.trustee.deals',
            entryURLTest: 'https://testexchange.trustee.deals',
            entryMarketURLTest: 'https://test.trustee.exchange'
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
            },
            {
                code: 'ka-GE'
            }
            /*
            @todo de/es/fr languages
            {
                code : 'de-DE'
            },
            {
                code: 'es-ES'
            },
            {
                code : 'fr-FR'
            }
            */
        ]
    },
    scanner: {
        scannerSettings: [
            {
                code: '1min'
            },
            {
                code: '10min'
            },
            {
                code: 'none'
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

    proxy : {
        mode : 'PROD',
        apiEndpoints : {
            baseURL : 'https://proxy.trustee.deals'
        }
    },

    fio: {
        apiEndpoints: {
            // baseURL: 'https://testnet.fioprotocol.io/v1/',
            baseURL: 'https://api.fio.eosdetroit.io/v1/',
            // historyURL: 'https://testnet.fio.dev/v1/history/',
            historyURL: 'https://api.fio.eosdetroit.io/v1/history/',
            registrationSiteURL: 'https://reg.fioprotocol.io/ref/trustee?publicKey=',
        },
    },
    debug: {
        appLogs: false, // set false to see usual logs in files only
        appDaemonLogs: false, // set false to see cron jobs logs in files only
        cryptoLogs: false, // set false to see crypto logs in files only
        cryptoErrors: true, // set false to get crypto errors  in tg only
        appErrors: true, // set false to get errors in tg only
        fioErrors: false, //
        appDBLogs: false, // set false to get db query in files only
        firebaseLogs: true, // set false not to collect data to firebase live db
        sendLogs: false
    },
    tg: {
        appDefaultTg: '1470482129:AAFLkM-rSvOckqNRr7nSO_BSrOLTXERZwdQ', // bot id for app errors https://t.me/trusteeV20ProdAppErrorsBot
        trusteeCore: ['272629139', '121249105', '231261669']
    },
}

// eslint-disable-next-line no-undef
if (config.exchange.mode === 'PROD' || config.cashback.mode === 'PROD') alert = () => {
}

export default config
