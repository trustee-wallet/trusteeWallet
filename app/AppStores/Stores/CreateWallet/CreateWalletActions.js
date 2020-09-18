/**
 * @version 0.9
 */
import store from '../../../store'
import Log from '../../../services/Log/Log'

import cryptoWalletsDS from '../../DataSource/CryptoWallets/CryptoWallets'
import walletDS from '../../DataSource/Wallet/Wallet'
import accountDS from '../../DataSource/Account/Account'
import appTaskDS from '../../DataSource/AppTask/AppTask'
import accountBalanceActions from '../Account/AccountBalancesActions'
import BlocksoftDict from '../../../../crypto/common/BlocksoftDict'

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
        flowType: data.flowType
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

        const prep = []
        if (source === 'IMPORT') {
            // oldstyle derivations = await walletPubDS.discoverOnImport({ walletHash: storedKey, derivations })
        }

        await accountDS.discoverAccounts({ walletHash: storedKey, fullTree: false, source }, source)

        Log.log('ACT/MStore proceedSaveGeneratedWallet finished discover storedWallet ' + storedKey)

        /**
         * @namespace Flow.updateAppTasks
         */
        const initedCurrencyCodes = await accountBalanceActions.initBalances(storedKey)
        if (source === 'IMPORT') {
            prep.push({
                walletHash: storedKey,
                currencyCode: 'BTC',
                taskGroup: 'IMPORT',
                taskName: 'DISCOVER_HD'
            })
            if (initedCurrencyCodes) {
                let code
                for (code in BlocksoftDict.Currencies) {
                    if (typeof initedCurrencyCodes[code] !== 'undefined') continue
                    if (code === 'BTC_TEST') continue
                    prep.push({
                        walletHash: storedKey,
                        currencyCode: code,
                        taskGroup: 'IMPORT',
                        taskName: 'DISCOVER_BALANCES_NOT_ADDED'
                    })
                }
                for (code of BlocksoftDict.VisibleCodes) {
                    delete initedCurrencyCodes[code]  // not visible - need to scan balance anyway to show news
                }
                for (code in initedCurrencyCodes) {
                    if (code === 'BTC_TEST') continue
                    prep.push({
                        walletHash: storedKey,
                        currencyCode: code,
                        taskGroup: 'IMPORT',
                        taskName: 'DISCOVER_BALANCES_HIDDEN'
                    })
                }
            }
            await appTaskDS.saveAppTasks(prep)
        }

        Log.log('ACT/MStore proceedSaveGeneratedWallet finished save storedWallet ' + storedKey)

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
