/**
 * @version 0.41
 * for data sync from proxy
 */
import Log from '@app/services/Log/Log'

import config from '@app/config/config'

import ApiProxy from '@app/services/Api/ApiProxy'
import walletDS from '@app/appstores/DataSource/Wallet/Wallet'
import cryptoWalletsDS from '@app/appstores/DataSource/CryptoWallets/CryptoWallets'

class UpdateWalletsDaemon {

    _canUpdate = true

    /**
     * @return {Promise<void>}
     */
    updateWalletsDaemon = async (params = {}, dataUpdate = false) => {
        if (typeof params !== 'undefined' && params && typeof params.force === 'undefined' || !params.force) {
            if (!this._canUpdate && !dataUpdate) return false
        }

        this._canUpdate = false
        const res = await this._updateWalletsDaemon(params, dataUpdate)
        this._canUpdate = true

        return res
    }

    _updateWalletsDaemon = async (params, dataUpdate = false) => {

        Log.daemon('UpdateWalletsDaemon called')

        if (!dataUpdate) {
            const authHash = await cryptoWalletsDS.getSelectedWallet()
            if (!authHash) {
                Log.daemon('UpdateWalletsDaemon skipped as no auth')
                return false
            }

            try {
                dataUpdate = await ApiProxy.getAll({ ...params, source: 'UpdateWalletsDaemon.updateWallets' })
            } catch (e) {
                if (config.debug.appErrors) {
                    console.log('UpdateWalletsDaemon error ' + e.message)
                }
                return false
            }
        }

        if (!dataUpdate) {
            return false
        }

        if (typeof dataUpdate.forWalletsAll !== 'undefined' && dataUpdate.forWalletsAll) {
            try {

                const saved = await walletDS.getWallets()
                const walletsSaved = {}
                if (saved) {
                    for (const row of saved) {
                        walletsSaved[row.walletHash] = row
                    }
                }

                for (const walletHash in dataUpdate.forWalletsAll) {
                    const dataOne = dataUpdate.forWalletsAll[walletHash]
                    if (!dataOne) continue
                    if (typeof walletsSaved[walletHash] === 'undefined') {
                        throw new Error('Saved wallet is not correct ' + JSON.stringify(dataOne))
                    }

                    let mapping = {
                        walletAllowReplaceByFee: dataOne.wallet_allow_replace_by_fee,
                        walletIsHd: dataOne.wallet_is_hd,
                        walletIsHideTransactionForFee: dataOne.wallet_is_hide_transaction_for_free,
                        walletName: dataOne.wallet_name,
                        walletToSendStatus: dataOne.wallet_to_send_status,
                        walletUseLegacy: dataOne.wallet_use_legacy,
                        walletUseUnconfirmed: dataOne.wallet_use_unconfirmed
                    }
                    mapping = walletDS._prepWallet(mapping)

                    if (walletsSaved[walletHash].walletToSendStatus && walletsSaved[walletHash].walletToSendStatus * 1 >= dataOne.wallet_to_send_status * 1) {
                        // skip
                    } else {
                        const updateObj = {}
                        for (const key in mapping) {
                            if (walletsSaved[walletHash][key] !== mapping[key]) {
                                updateObj[key] = mapping[key]
                            }
                        }
                        updateObj.walletToSendStatus = dataOne.wallet_to_send_status ? dataOne.wallet_to_send_status*1 : 0
                        const dataForSave = {
                            key: {
                                walletHash
                            },
                            updateObj
                        }
                        await walletDS.updateWallet(dataForSave)
                    }
                }
            } catch (e) {
                if (config.debug.appErrors) {
                    console.log('UpdateWalletsDaemon save error ' + e.message)
                }
                Log.errDaemon('UpdateWalletsDaemon save error ' + e.message)
                return false
            }
        }

        return false
    }

}

export default new UpdateWalletsDaemon
