/**
 * @version 0.9
 */
import Database from '@app/appstores/DataSource/Database'

import BlocksoftKeysUtils from '@crypto/actions/BlocksoftKeys/BlocksoftKeysUtils'
import Log from '@app/services/Log/Log'
import CashBackUtils from '@app/appstores/Stores/CashBack/CashBackUtils'
import UpdateWalletsDaemon from '@app/daemons/back/UpdateWalletsDaemon'

import store from '@app/store'


const CACHE = {
    MATIC: {},
    ETH: {}
}

const CACHE_TIME = {
    MATIC: {},
    ETH: {}
}

const CACHE_VALID_TIME = 60000 // 1 minute

class Nfts {

    saveNfts = async (tokenBlockchainCode, address, nfts) => {
        if (typeof CACHE[tokenBlockchainCode][address] !== 'undefined' && CACHE[tokenBlockchainCode][address] === nfts) return false
        CACHE[tokenBlockchainCode][address] = nfts
        CACHE_TIME[tokenBlockchainCode][address] = new Date().getTime()
        const sql1 = `DELETE FROM transactions_scanners_tmp WHERE currency_code='${tokenBlockchainCode}' AND address='${address}' AND tmp_key='nfts'`
        await Database.query(sql1, true)

        const sql = `INSERT INTO transactions_scanners_tmp (
        currency_code, address, tmp_key, tmp_val
        ) VALUES (
        '${tokenBlockchainCode}', '${address}', 'nfts', '${Database.escapeString(JSON.stringify(nfts))}'
        )`
        await Database.query(sql, true)
    }

    getNfts = async (address) => {
        const sql = `SELECT currency_code, tmp_val FROM transactions_scanners_tmp WHERE address='${address}' AND tmp_key='nfts'`
        const res = await Database.query(sql, true)
        if (!res || !res.array || res.array.length === 0) {
            return false
        }
        for (const tmp of res.array) {
            try {
                CACHE[tmp.currency_code][address] = JSON.parse(Database.unEscapeString(tmp.tmp_val))
            } catch (e) {
                // do nothing
            }
        }
    }

    getNftsCache = (tokenBlockchainCode, address) => {
        if (typeof CACHE[tokenBlockchainCode][address] === 'undefined') return false
        if (typeof CACHE_TIME[tokenBlockchainCode][address] !== 'undefined') {
            const now = new Date().getTime()
            const diff = now - CACHE_TIME[tokenBlockchainCode][address]
            if (diff < CACHE_VALID_TIME) {
                return false
            }
        }
        return CACHE[tokenBlockchainCode][address]
    }
}

export default new Nfts()
