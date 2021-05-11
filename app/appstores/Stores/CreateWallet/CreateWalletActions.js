/**
 * @version 0.9
 */
import store from '@app/store'
import Log from '@app/services/Log/Log'

import cryptoWalletsDS from '@app/appstores/DataSource/CryptoWallets/CryptoWallets'
import cryptoWalletActions from '@app/appstores/Actions/CryptoWalletActions'
import walletDS from '@app/appstores/DataSource/Wallet/Wallet'
import accountDS from '@app/appstores/DataSource/Account/Account'
import appTaskDS from '@app/appstores/DataSource/AppTask/AppTask'
import cardDS from '@app/appstores/DataSource/Card/Card'

import accountBalanceActions from '@app/appstores/Stores/Account/AccountBalancesActions'
import WalletHDActions from '@app/appstores/Actions/WalletHDActions'
import walletActions from '@app/appstores/Stores/Wallet/WalletActions'
import ApiProxyLoad from '@app/services/Api/ApiProxyLoad'
import UpdateCardsDaemon from '@app/daemons/back/UpdateCardsDaemon'
import CashBackUtils from '@app/appstores/Stores/CashBack/CashBackUtils'

const { dispatch } = store

export function setWalletName(data) {
    dispatch({
        type: 'SET_WALLET_NAME',
        walletName: data.walletName
    })
}

export function setMnemonicLength(data) {
    dispatch({
        type: 'SET_MNEMONIC_LENGTH',
        mnemonicLength: data.mnemonicLength
    })
}

export function setWalletMnemonic(data) {
    dispatch({
        type: 'SET_WALLET_MNEMONIC',
        walletMnemonic: data.walletMnemonic
    })
}

export const setFlowType = (data) => {
    dispatch({
        type: 'SET_FLOW_TYPE',
        flowType: data.flowType,
        source : data.source || false,
        walletHash : data.walletHash || false,
        walletNumber : data.walletNumber || '0'
    })
}

export const setCallback = (data) => {
    dispatch({
        type: 'SET_CALLBACK',
        callback: data.callback
    })
}

export async function proceedSaveGeneratedWallet(wallet, source = 'GENERATION') {

    let storedKey

    const prevWallet = await cryptoWalletsDS.getSelectedWallet()

    try {
        Log.log('ACT/MStore proceedSaveGeneratedWallet called prevWallet ' + prevWallet)

        storedKey = await cryptoWalletsDS.saveWallet(wallet)

        let tmpWalletName = wallet.walletName

        let fromSaved = false
        const { cashbackToken } = await CashBackUtils.getByHash(storedKey, 'DS/Wallet getWallets redo')
        let fullWallet =  {
            walletHash: storedKey,
            walletName: tmpWalletName,
            walletToSendStatus : 0,
            walletIsBackedUp: 0,
            walletIsHd : 0,
            walletAllowReplaceByFee : 1,
            walletIsHideTransactionForFee : 1,
            walletUseLegacy : 2,
            walletUseUnconfirmed : 1,
            walletCashback : cashbackToken
        }
        if (source === 'IMPORT') {
            const res = await ApiProxyLoad.getSaved(storedKey, wallet.walletName)

            if (res && typeof res.forWalletsAll !== 'undefined' && typeof res.forWalletsAll[storedKey] !== 'undefined') {
                const savedWallet = res.forWalletsAll[storedKey]
                fullWallet = {
                    walletHash: storedKey,
                    walletName: savedWallet.wallet_name,
                    walletToSendStatus : savedWallet.wallet_to_send_status * 1,
                    walletIsBackedUp: wallet.walletIsBackedUp || 0,
                    walletIsHd : savedWallet.wallet_is_hd,
                    walletAllowReplaceByFee : savedWallet.wallet_allow_replace_by_fee,
                    walletIsHideTransactionForFee : savedWallet.wallet_is_hide_transaction_for_free,
                    walletUseLegacy : savedWallet.wallet_use_legacy,
                    walletUseUnconfirmed : savedWallet.wallet_use_unconfirmed,
                    walletNumber : wallet.walletNumber
                }
                if (tmpWalletName && tmpWalletName !== '') {
                    fullWallet.walletName = tmpWalletName
                    fullWallet.walletToSendStatus = Math.round(new Date().getTime() / 1000)
                }
                await walletDS.saveWallet(fullWallet)
                fromSaved = true

                await UpdateCardsDaemon.updateCardsDaemon({force : true}, res)
            }
        }
        if (!fromSaved) {
            if (!tmpWalletName || tmpWalletName === '') {
                tmpWalletName = await walletActions.getNewWalletName()
            }
            await walletDS.saveWallet({ walletHash: storedKey, walletName : tmpWalletName, walletIsBackedUp: wallet.walletIsBackedUp || 0, walletNumber : wallet.walletNumber })
            fullWallet.walletName = tmpWalletName
            fullWallet.walletIsBackedUp =  wallet.walletIsBackedUp || 0
            fullWallet.walletNumber = wallet.walletNumber
        }

        if (source === 'IMPORT' && !fromSaved) {
            try {
                await WalletHDActions.hdFromTrezor({ walletHash: storedKey, force: false, currencyCode: 'BTC' }, 'IMPORT')
                await walletDS.updateWallet({ walletHash : storedKey, walletIsHd: 1 })
                fullWallet.walletIsHd = 1
            } catch (e) {
                // do nothing
            }
        }

        await walletActions.addAvailableWallets(fullWallet)

        await cryptoWalletActions.setSelectedWallet(storedKey, 'ACT/MStore proceedSaveGeneratedWallet Revert', false)

        await accountDS.discoverAccounts({ walletHash: storedKey, fullTree: false, source }, source)

        await accountBalanceActions.initBalances(storedKey, source === 'IMPORT')

        await Log.log('ACT/MStore proceedSaveGeneratedWallet finished discover storedWallet ' + storedKey)
    } catch (e) {

        Log.log('ACT/MStore proceedSaveGeneratedWallet tryWallet ' + storedKey + ' will clean by error ' + e.message)

        // await cardDS.clearCards({ walletHash: storedKey })

        await accountDS.clearAccounts({ walletHash: storedKey })

        await walletDS.clearWallet({ walletHash: storedKey })

        await appTaskDS.clearTasks({ walletHash: storedKey })

        await appTaskDS.clearTasks({ walletHash: storedKey })

        if (prevWallet && prevWallet !== storedKey) {
            await cryptoWalletsDS.setSelectedWallet(prevWallet, 'ACT/MStore proceedSaveGeneratedWallet Revert')
        }

        Log.log('ACT/MStore proceedSaveGeneratedWallet tryWallet ' + storedKey + ' prevWallet ' + prevWallet + ' error ' + e.message)

        throw e
    }

    return storedKey
}
