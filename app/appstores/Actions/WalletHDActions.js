/**
 * @version 0.9
 */
import store from '../../store'

import Log from '../../services/Log/Log'

import walletActions from '../Stores/Wallet/WalletActions'
import { setSelectedAccount, setSelectedWallet } from '../../appstores/Stores/Main/MainStoreActions'

import walletPubDS from '../DataSource/Wallet/WalletPub'
import walletDS from '../DataSource/Wallet/Wallet'
import accountHdDS from '../DataSource/Account/AccountHd'
import accountDS from '../DataSource/Account/Account'

const walletHDActions = {

    turnOnHD: async (walletHash) => {

        Log.log('ACT/WalletHD manual turnOn called ' + walletHash)

        await walletDS.updateWallet({ walletHash, walletIsHd: 1 })
        await setSelectedWallet('ACT/WalletHD manual turnOn' )
        await walletActions.setAvailableWallets()

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

        const count = await accountHdDS.countUsed({ walletHash: wallet.walletHash, currencyCode: 'BTC' })
        if (count > 9000) {
            return 'error.too.much.addresses'
        }
        await accountDS.massUpdateAccount(`address='${address}'`, 'already_shown=2')
        const account = store.getState().mainStore.selectedAccount
        if (account) {
            if (account.address === address || account.legacyAddress === address || account.segwitAddress === address) {
                await setSelectedAccount()
            }
        }
        Log.log('ACT/WalletHD setSelectedAccountAsUsed finished ' + address)
        return count > 8900 ? 'error.near.too.much.addresses' : false
    },

    backUnusedAccounts: async function() {
        Log.log('ACT/WalletHD backUnusedAccounts called ')
        const wallet = store.getState().mainStore.selectedWallet
        const back = await accountHdDS.backUsed({ wallet_hash: wallet.wallet_hash, currency_code: 'BTC' })
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
                throw new Error('no derivations 1 found')
            }
            if (derivations.BTC.length === 0 && derivations.BTC_SEGWIT.length === 0) {
                throw new Error('no derivations 2 found')
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
