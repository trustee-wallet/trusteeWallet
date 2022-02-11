/**
 * @version 0.41
 */
import Log from '@app/services/Log/Log'

import config from '@app/config/config'

import cardDS from '@app/appstores/DataSource/Card/Card'
import cryptoWalletsDS from '@app/appstores/DataSource/CryptoWallets/CryptoWallets'
import ApiProxy from '@app/services/Api/ApiProxy'
import settingsActions from '@app/appstores/Stores/Settings/SettingsActions'

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

        Log.daemon('UpdateCardsDaemon called')

        let asked = false
        if (!dataUpdate) {
            const authHash = await settingsActions.getSelectedWallet('UpdateCardsDaemon')
            if (!authHash) {
                Log.daemon('UpdateCardsDaemon skipped as no auth')
                return false
            }
            if (config.debug.appErrors) {
                console.log(new Date().toISOString() + ' UpdateCardsDaemon loading new')
            }
            asked = true
            try {
                dataUpdate = await ApiProxy.getAll({ ...params, source: 'UpdateCardsDaemon.updateCards' })
            } catch (e) {
                if (config.debug.appErrors) {
                    console.log('UpdateCardsDaemon error ' + e.message)
                }
                return false
            }
        }

        if (!dataUpdate) {
            return false
        }

        if (typeof dataUpdate.forCardsAll !== 'undefined' && dataUpdate.forCardsAll) {
            if (!asked) {
                if (config.debug.appErrors) {
                    console.log(new Date().toISOString() + ' UpdateCardsDaemon loaded proxy forCardsAll')
                }
            }
            try {
                const saved = await cardDS.getCards()
                const cardsSaved = {}
                if (saved) {
                    for (const row of saved) {
                        cardsSaved[row.number] = row
                        if (row.cardToSendId > 0) {
                            cardsSaved['sid_' + row.cardToSendId] = row
                        }
                    }
                }
                for (const number in dataUpdate.forCardsAll) {
                    const dataOne = dataUpdate.forCardsAll[number]
                    if (!dataOne) continue
                    const mapping = {
                        cardToSendStatus: dataOne.card_to_send_status,
                        cardToSendId: dataOne.card_to_send_id,
                        number: dataOne.card_number,
                        expirationDate: dataOne.card_expiration_date,
                        type: dataOne.card_type,
                        countryCode: dataOne.card_country_code,
                        cardName: dataOne.card_name,
                        cardHolder: dataOne.card_holder,
                        currency: dataOne.card_currency,
                        walletHash: dataOne.card_wallet_hash,
                        verificationServer: dataOne.card_verification_server,
                        cardEmail: dataOne.card_email,
                        cardDetailsJson: dataOne.card_details_json,
                        cardVerificationJson: dataOne.card_verification_json,
                        cardCreateWalletHash: dataOne.log_wallet
                    }

                    let currentToUpdate = false
                    if (typeof cardsSaved[number] === 'undefined' || !cardsSaved[number]) {
                        if (typeof dataOne.card_to_send_id === 'undefined' || !dataOne.card_to_send_id
                            || typeof cardsSaved['sid_' + dataOne.card_to_send_id] === 'undefined' || !cardsSaved['sid_' + dataOne.card_to_send_id]
                        ) {
                            // do nothing to insert
                        } else {
                            currentToUpdate = cardsSaved['sid_' + dataOne.card_to_send_id]
                        }
                    } else {
                        currentToUpdate = cardsSaved[number]
                    }

                    if (currentToUpdate === false && typeof currentToUpdate !== 'undefined') {
                        await cardDS.saveCard({
                            insertObjs: [mapping]
                        })
                    } else {
                        if (currentToUpdate.cardToSendStatus && currentToUpdate.cardToSendStatus * 1 > dataOne.card_to_send_status * 1) {
                            // skip
                        } else {
                            const updateObj = {
                                cardVerificationJson: dataOne.card_verification_json
                            }
                            for (const key in mapping) {
                                if (key === 'cardCreateWalletHash') continue // to skip
                                if (currentToUpdate[key] !== mapping[key]) {
                                    updateObj[key] = mapping[key]
                                }
                            }
                            const dataForSave = {
                                key: {
                                    id : currentToUpdate.id
                                },
                                updateObj
                            }
                            await cardDS.updateCard(dataForSave)
                        }
                    }
                }

            } catch (e) {
                if (config.debug.appErrors) {
                    console.log('UpdateCardsDaemon save error1 ' + e.message, e)
                }
                Log.errDaemon('UpdateCardsDaemon save error1 ' + e.message)
                return false
            }
        } else if (typeof dataUpdate.forCardsOk !== 'undefined' && dataUpdate.forCardsOk) {
            if (!asked) {
                console.log(new Date().toISOString() + ' UpdateCardsDaemon loaded proxy forCardsOk', JSON.stringify(params))
            }
            try {
                for (const number in dataUpdate.forCardsOk) {
                    const dataOne = dataUpdate.forCardsOk[number]
                    if (!dataOne) continue
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
            } catch (e) {
                if (config.debug.appErrors) {
                    console.log('UpdateCardsDaemon status save error2 ' + e.message)
                }
                Log.errDaemon('UpdateCardsDaemon status save error2 ' + e.message)
                return false
            }
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
