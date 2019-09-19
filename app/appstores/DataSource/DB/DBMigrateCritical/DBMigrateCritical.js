import DBOpen from '../DBOpen'
import DBInterface from '../DBInterface'
import DBInit from '../DBInit/DBInit'

import cryptoWalletsDS from '../../CryptoWallets/CryptoWallets'
import accountDS from '../../Account/Account'
import walletDS from '../../Wallet/Wallet'
import accountBalanceActions from '../../../Actions/AccountBalancesActions'

class DBMigrateCritical {

    async run() {

        await DBOpen.open()

        let conn = new DBInterface()

        const tableExists = await (conn.setQueryString(`SELECT name FROM sqlite_master WHERE type='table' AND name='wallet'`)).query()
        if (tableExists.array.length === 0) {
            return true
        }

        let resultOld = await (conn.setQueryString(`SELECT * FROM wallet`)).query()

        if (typeof resultOld.array[0] != 'undefined' && typeof resultOld.array[0].wallet_mnemonic === 'undefined') {
            // there are result but no wallet_mnemonic so its already new DB
            return true
        }

        const tableDrops = await (conn.setQueryString(`SELECT name FROM sqlite_master WHERE type='table'`)).query()
        for (let tableDrop of tableDrops.array) {
            if (tableDrop.name.indexOf('sqlite') !== -1 || tableDrop.name === 'wallet_backup') {
                continue
            }
            let sql = `DROP TABLE ${tableDrop.name}`
            if (tableDrop.name === 'wallet') {
                sql = `ALTER TABLE ${tableDrop.name} RENAME TO wallet_backup`
            }
            try {
                await (conn.setQueryString(sql)).query()
            } catch (e) {
                alert(e.message)
                break
            }
        }

        let resultOld2 = await (conn.setQueryString(`SELECT * FROM wallet_backup`)).query()
        if (!resultOld2.array[0].wallet_mnemonic) {
            alert('BAD BACKUP!')
        }

        await DBInit.init()

        for(let old of resultOld.array) {
            const storedKey = await cryptoWalletsDS.saveWallet({walletName : old.wallet_name, walletMnemonic: old.wallet_mnemonic})
            await walletDS.saveWallet(storedKey, old.wallet_name, '')
            await accountDS.discoverAccounts(storedKey)
            await accountBalanceActions.initBalances(storedKey)
        }

    }

}

export default new DBMigrateCritical()
