/**
 * @version 0.11
 */
import config from '../../../config/config'

const { cashback: cashbackConfig } = config

export default new class CashBackSettings {

    _baseURL = ''

    constructor() {
        const { mode, apiEndpoints } = cashbackConfig
        this._baseURL = mode === 'DEV' ? apiEndpoints.baseURLTest : apiEndpoints.baseURL
    }

    init = () => {
        const { mode, apiEndpoints } = cashbackConfig
        this._baseURL = mode === 'DEV' ? apiEndpoints.baseURLTest : apiEndpoints.baseURL
    }

    getLink = (token) => {
        return 'https://trustee.deals/link/' + token
    }

    getBase = () => {
        return this._baseURL
    }
}
