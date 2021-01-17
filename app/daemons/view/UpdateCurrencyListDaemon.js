/**
 * @version 0.11
 */
import Update from '../Update'
import currencyActions from '../../appstores/Stores/Currency/CurrencyActions'

let CACHE_STOPPED = false


class UpdateCurrencyListDaemon extends Update {

    _canUpdate = true

    constructor(props) {
        super(props)
        this.updateFunction = this.updateCurrencyListDaemon
    }

    stop = () => {
        CACHE_STOPPED = true
    }

    unstop = () => {
        CACHE_STOPPED = false
    }

    /**
     * @return {Promise<void>}
     */
    updateCurrencyListDaemon = async () => {
        if (CACHE_STOPPED) return false
        if (!this._canUpdate) {
            return
        }
        this._canUpdate = false

        await currencyActions.setCryptoCurrencies()

        this._canUpdate = true
    }
}

export default new UpdateCurrencyListDaemon()
