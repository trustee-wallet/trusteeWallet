/**
 * @version 0.11
 */
import Update from '../Update'
import currencyActions from '../../appstores/Stores/Currency/CurrencyActions'

class UpdateCurrencyListDaemon extends Update {

    _canUpdate = true

    constructor(props) {
        super(props)
        this.updateFunction = this.updateCurrencyListDaemon
    }

    /**
     * @return {Promise<void>}
     */
    updateCurrencyListDaemon = async () => {
        if (!this._canUpdate) {
            return
        }
        this._canUpdate = false

        await currencyActions.setCryptoCurrencies()

        this._canUpdate = true
    }
}

export default new UpdateCurrencyListDaemon()
