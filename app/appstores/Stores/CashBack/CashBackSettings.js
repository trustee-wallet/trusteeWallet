/**
 * @version 0.42
 */
import config from '@app/config/config'

const { cashback: cashbackConfig } = config

const cashBackSettings = {

    getLink : (token) => {
        return 'https://trusteeglobal.com/link/' + token
    },

    getBase : () => {
        const { mode, apiEndpoints } = cashbackConfig
        return mode === 'DEV' ? apiEndpoints.baseURLTest : apiEndpoints.baseURL
    }
}

export default cashBackSettings
