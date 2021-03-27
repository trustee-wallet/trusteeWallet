/**
 * @version 0.41
 */
import Log from '@app/services/Log/Log'

import cardDS from '@app/appstores/DataSource/Card/Card'

import config from '@app/config/config'
import cryptoWalletsDS from '@app/appstores/DataSource/CryptoWallets/CryptoWallets'
import ApiProxy from '@app/services/Api/ApiProxy'

class UpdateCardsDaemon {

    _canUpdate = true

    /**
     * @string params.numberCard
     * @return {Promise<void>}
     */
    updateCardsDaemon = async (params = {}, dataUpdate = false) => {
        if (typeof params !== 'undefined' && params && typeof params.force === 'undefined' || !params.force) {
            if (!this._canUpdate && !dataUpdate) return false
        }

        this._canUpdate = false
        const res = await this._updateCardsDaemon(params, dataUpdate)
        this._canUpdate = true

        return res
    }

    _updateCardsDaemon = async (params, dataUpdate = false) => {
        const authHash = await cryptoWalletsDS.getSelectedWallet()
        if (!authHash) {
            Log.daemon('UpdateCardsDaemon skipped as no auth')
            return false
        }

        Log.daemon('UpdateCardsDaemon called')

        if (!dataUpdate) {
            try {
                dataUpdate = await ApiProxy.getAll({ ...params, source: 'UpdateCardsDaemon.updateCards' })
            } catch (e) {
                if (config.debug.appErrors) {
                    console.log('UpdateCardsDaemon error ' + e.message)
                }
                return false
            }
        }

        if (!dataUpdate && !dataUpdate.forCardsOk) {
            return false
        }

        try {
            for (const number in dataUpdate.forCardsOk) {
                const dataOne = dataUpdate.forCardsOk[number]
                if (dataOne) {
                    const dataForSave = {
                        key: {
                            number
                        },
                        updateObj: {
                            cardVerificationJson: JSON.stringify(dataOne)
                        }
                    }
                    await cardDS.updateCard(dataForSave)
                }
            }

        } catch (e) {
            if (config.debug.appErrors) {
                console.log('UpdateCardsDaemon save error ' + e.message)
            }
            Log.errDaemon('UpdateCardsDaemon save error ' + e.message)
            return false
        }

        if (typeof params !== 'undefined' && params && params.numberCard !== 'undefined') {
            if (dataUpdate && dataUpdate.forCardsOk && typeof dataUpdate.forCardsOk[params.numberCard] !== 'undefined' && dataUpdate.forCardsOk[params.numberCard]) {
                return dataUpdate.forCardsOk[params.numberCard]
            } else {
                return false
            }
        }

        return false
    }

}

export default new UpdateCardsDaemon
