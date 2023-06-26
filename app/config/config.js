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
    daemon: {
        scanOnAccount : true,
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
        apiEndpoints : {
            baseURL : 'https://proxy.trustee.deals',
            baseURLTest : 'https://proxy.trustee.deals'
        }
    },

    aws: {
        bucket: 'walletchatfiles',
        folder: 'useruploads'
    },

    debug: {
        appLogs: false, // set false to see usual logs in files only
        appDaemonLogs: false, // set false to see cron jobs logs in files only
        cryptoLogs: false, // set false to see crypto logs in files only
        cryptoErrors: false, // set false to get crypto errors  in tg only
        appErrors: true, // set false to get errors in tg only
        fioErrors: false, //
        appDBLogs: false, // set false to get db query in files only
        firebaseLogs: true, // set false not to collect data to firebase live db
        sendLogs: false
    }
}

// eslint-disable-next-line no-undef
if (config.exchange.mode === 'PROD' || config.cashback.mode === 'PROD') alert = () => {
}

export default config
