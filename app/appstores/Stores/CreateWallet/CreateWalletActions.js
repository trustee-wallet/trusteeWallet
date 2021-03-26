/**
 * @version 0.9
 */
import store from '@app/store'
import Log from '@app/services/Log/Log'

import cryptoWalletsDS from '@app/appstores/DataSource/CryptoWallets/CryptoWallets'
import walletDS from '@app/appstores/DataSource/Wallet/Wallet'
import accountDS from '@app/appstores/DataSource/Account/Account'
import appTaskDS from '@app/appstores/DataSource/AppTask/AppTask'
import accountBalanceActions from '@app/appstores/Stores/Account/AccountBalancesActions'
import WalletHDActions from '@app/appstores/Actions/WalletHDActions'

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

        await cryptoWalletsDS.setSelectedWallet(storedKey, 'ACT/MStore proceedSaveGeneratedWallet')

        await walletDS.saveWallet({ walletHash: storedKey, walletName: wallet.walletName, walletIsBackedUp: wallet.walletIsBackedUp || 0 })

        if (source === 'IMPORT') {
            try {
                await WalletHDActions.hdFromTrezor({ walletHash: storedKey, force: false, currencyCode: 'BTC' }, 'IMPORT')
                await walletDS.updateWallet({ walletHash : storedKey, walletIsHd: 1 })
            } catch (e) {
                // do nothing
            }
        }

        await accountDS.discoverAccounts({ walletHash: storedKey, fullTree: false, source }, source)

        await accountBalanceActions.initBalances(storedKey, source === 'IMPORT')

        await Log.log('ACT/MStore proceedSaveGeneratedWallet finished discover storedWallet ' + storedKey)

    } catch (e) {

        Log.log('ACT/MStore proceedSaveGeneratedWallet tryWallet ' + storedKey + ' will clean by error ' + e.message)

        await accountDS.clearAccounts({ walletHash: storedKey })

        await walletDS.clearWallet({ walletHash: storedKey })

        await appTaskDS.clearTasks({ walletHash: storedKey })

        if (prevWallet && prevWallet !== storedKey) {
            await cryptoWalletsDS.setSelectedWallet(prevWallet, 'ACT/MStore proceedSaveGeneratedWallet Revert')
        }

        Log.log('ACT/MStore proceedSaveGeneratedWallet tryWallet ' + storedKey + ' prevWallet ' + prevWallet + ' error ' + e.message)

        throw e
    }

    return storedKey
}
