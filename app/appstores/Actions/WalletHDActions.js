/**
 * @version 0.9
 */
import store from '@app/store'

import Log from '@app/services/Log/Log'

import { setSelectedAccount } from '@app/appstores/Stores/Main/MainStoreActions'

import walletPubDS from '@app/appstores/DataSource/Wallet/WalletPub'
import walletDS from '@app/appstores/DataSource/Wallet/Wallet'
import accountHdDS from '@app/appstores/DataSource/Account/AccountHd'
import accountDS from '@app/appstores/DataSource/Account/Account'

const walletHDActions = {

    turnOnHD: async (walletHash) => {

        Log.log('ACT/WalletHD manual turnOn called ' + walletHash)

        await walletDS.updateWallet({ walletHash, walletIsHd: 1 })

        try {
            await walletHDActions.hdFromTrezor({ walletHash, force: true, currencyCode: 'BTC' }, 'TURN_ON')
            Log.log('ACT/WalletHD manual turnOn finished ' + walletHash)
        } catch (e) {
            Log.log('ACT/WalletHD manual turnOn error ' + e.message)
        }
    },

    setSelectedAccountAsUsed: async function(address) {
        Log.log('ACT/WalletHD setSelectedAccountAsUsed called ' + address)
        const wallet = store.getState().mainStore.selectedWallet

        const res = {walletHash: wallet.walletHash}
        const count = await accountHdDS.countUsed({ walletHash: wallet.walletHash, currencyCode: 'BTC' })
        if (count > 9000) {
            res.code = 'error.too.much.addresses'
            return res
        }
        const countGap = await accountHdDS.countGap({ address, walletHash: wallet.walletHash, currencyCode: 'BTC' })
        if (countGap.gap > 20) {
            countGap.code = 'error.near.too.much.gap'
            countGap.walletHash = wallet.walletHash
            return countGap
        }
        await accountDS.massUpdateAccount(`address='${address}'`, 'already_shown=2')
        const account = store.getState().mainStore.selectedAccount
        if (account) {
            if (account.address === address || account.legacyAddress === address || account.segwitAddress === address) {
                await setSelectedAccount('WalletHD.setSelectedAccountAsUsed')
            }
        }
        Log.log('ACT/WalletHD setSelectedAccountAsUsed finished ' + address)
        if (count > 8900) {
            res.code = 'error.near.too.much.addresses'
        }
        return false
    },

    backUnusedAccounts: async function(res = {}) {
        Log.log('ACT/WalletHD backUnusedAccounts called ' + JSON.stringify(res))
        const back = await accountHdDS.backUsed(res)
        Log.log('ACT/WalletHD backUnusedAccounts finished ' + back)
        return true
    },

    /**
     * @param {Object} params
     * @param {string} params.walletHash
     * @param {string} params.currencyCode
     * @param {string} params.walletPubId
     * @param {string} params.force
     * @param source
     * @returns {Promise<boolean>}
     */
    hdFromTrezor: async function(params, source) {
        let derivations = false

        try {
            const check = await walletPubDS.getWalletPubs({ walletHash: params.walletHash, currencyCode: params.currencyCode })
            if (check) {
                throw new Error('already derived hd wallet pubs')
            }
        } catch (e) {
            e.message += ' while walletPubDS.getWalletPubs'
            throw e
        }

        try {
            derivations = await walletPubDS.discoverFromTrezor({ walletHash: params.walletHash, force: params.force }, source)
        } catch (e) {
            e.message += ' while  walletPubDS.discoverFromTrezor'
            throw e
        }

        if (!params.force) {
            if (!derivations) {
                return false
            }
            if (derivations.BTC.length === 0 && derivations.BTC_SEGWIT.length === 0) {
                return false
            }
        }

        try {
            await accountDS.discoverAccounts({ walletHash: params.walletHash, fullTree: false, source, derivations }, source)
        } catch (e) {
            Log.daemon('ACT/WalletHd hdFromTrezor discoverAccounts error ' + e.message, derivations)
        }

        try {
            let walletPubId = 0
            if (typeof derivations.walletPubId !== 'undefined') {
                walletPubId = derivations.walletPubId
            } else if (typeof params.walletPubId !== 'undefined') {
                walletPubId = params.walletPubId
            }
            await accountDS.massUpdateAccount(`wallet_hash='${params.walletHash}' AND (wallet_pub_id=0 OR wallet_pub_id IS NULL)`, 'wallet_pub_id=' + walletPubId)
        } catch (e) {
            Log.daemon('ACT/WalletHd hdFromTrezor massUpdateAccount error ' + e.message, derivations)
        }

        return derivations
    }

}

export default walletHDActions
