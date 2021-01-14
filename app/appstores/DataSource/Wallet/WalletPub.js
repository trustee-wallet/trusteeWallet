/**
 * @version 0.9
 */
import DBInterface from '../DB/DBInterface'
import Log from '../../../services/Log/Log'

import accountDS from '../Account/Account'
import accountHdDS from '../Account/AccountHd'
import walletDS from './Wallet'

import BlocksoftKeysStorage from '../../../../crypto/actions/BlocksoftKeysStorage/BlocksoftKeysStorage'
import BlocksoftKeys from '../../../../crypto/actions/BlocksoftKeys/BlocksoftKeys'
import BlocksoftAxios from '../../../../crypto/common/BlocksoftAxios'
import BlocksoftFixBalance from '../../../../crypto/common/BlocksoftFixBalance'
import BlocksoftExternalSettings from '../../../../crypto/common/BlocksoftExternalSettings'

const CACHE = {}
const CACHE_NOW_UPDATING = {}

class WalletPub {

    /**
     * @param {string} walletPub.walletHash
     * @param {string} walletPub.walletPubType
     * @param {string} walletPub.walletPubValue
     * @param {string} walletPub.currencyCode
     * @param {string} walletPub.balance
     * @param {string} walletPub.unconfirmed
     */
    saveWalletPub = async (walletPub, source) => {
        const dbInterface = new DBInterface()

        const now = Math.round(new Date().getTime() / 1000)

        let sql = `INSERT INTO wallet_pub (wallet_hash, currency_code, wallet_pub_type, wallet_pub_value, balance_scan_time, transactions_scan_time) 
        VALUES ('${walletPub.walletHash}', '${walletPub.currencyCode}', '${walletPub.walletPubType}','${walletPub.walletPubValue}', 0, 0)`
        if (typeof walletPub.balance !== 'undefined') {
            sql = `INSERT INTO wallet_pub (wallet_hash, currency_code, wallet_pub_type, wallet_pub_value, balance_scan_time, transactions_scan_time,
                    balance_fix, balance_txt, unconfirmed_fix, unconfirmed_txt) 
                    VALUES ('${walletPub.walletHash}', '${walletPub.currencyCode}', '${walletPub.walletPubType}','${walletPub.walletPubValue}', '${now}', '${now}',
                    ${walletPub.balance * 1}, '${walletPub.balance}', ${walletPub.unconfirmed * 1}, '${walletPub.unconfirmed}')`
        }
        await dbInterface.setQueryString(sql).query()
        CACHE[walletPub.walletHash] = false
    }

    /**
     * @param {string} params.walletHash
     * @param {string} params.currencyCode
     * @returns {Promise<[{id, walletPubType, walletPubValue, walletPubLastIndex, balanceFix, balanceTxt, balanceProvider}]|boolean>}
     */
    getWalletPubs = async (params) => {
        if (params && typeof params.walletHash !== 'undefined') {
            if (typeof CACHE[params.walletHash] !== 'undefined' && CACHE[params.walletHash] !== false) {
                return CACHE[params.walletHash]
            }
        }

        let where = []
        if (params) {
            if (typeof params.walletHash !== 'undefined') {
                where.push(`wallet_pub.wallet_hash='${params.walletHash}'`)
            }
            if (typeof params.currencyCode !== 'undefined') {
                where.push(`wallet_pub.currency_code='${params.currencyCode}'`)
            }
        }


        if (where.length > 0) {
            where = ' WHERE ' + where.join(' AND ')
        } else {
            where = ''
        }

        const dbInterface = new DBInterface()

        const res = await dbInterface.setQueryString(`
        SELECT id, 
        wallet_hash AS walletHash,
        wallet_pub_type AS walletPubType, 
        wallet_pub_value AS walletPubValue, 
        wallet_pub_last_index AS walletPubLastIndex, 
        wallet_hash AS walletHash,
        currency_code AS currencyCode,
        balance_fix AS balanceFix, 
        balance_txt AS balanceTxt,
        unconfirmed_fix AS unconfirmedFix,
        unconfirmed_txt AS unconfirmedTxt,
        balance_provider AS balanceProvider,
        balance_scan_time AS balanceScanTime,
        transactions_scan_time AS transactionsScanTime
        FROM wallet_pub 
        ${where}
        `).query()
        if (!res || !res.array || !res.array.length) return false


        let pub
        const unique = {}
        const toRemove = []
        for (pub of res.array) {
            if (pub.walletPubType === 'btc.84') {
                pub.currencyCode = 'BTC_SEGWIT'
            }
            if (typeof CACHE[pub.walletHash] === 'undefined' || CACHE[pub.walletHash]  === false) {
                CACHE[pub.walletHash] = {}
            }
            const key = pub.walletHash + '_' + pub.walletPubType
            if (typeof unique[key] === 'undefined') {
                CACHE[pub.walletHash][pub.walletPubType] = pub
                CACHE[pub.walletHash][pub.walletPubType].balance = BlocksoftFixBalance(pub, 'balance')
                CACHE[pub.walletHash][pub.walletPubType].unconfirmed = BlocksoftFixBalance(pub, 'unconfirmed')
                unique[key] = pub.id
            } else {
                toRemove.push({old : pub.id, to : unique[key]})
            }
        }
        Log.daemon('DS/WalletPub.getWalletPubs toRemove', toRemove)
        if (toRemove.length > 0) {
            let tmp
            for (tmp of toRemove) {
                const sql3 = `UPDATE account SET wallet_pub_id=${tmp.to} WHERE wallet_pub_id=${tmp.old}`
                await dbInterface.setQueryString(sql3).query()
                const sql4 = `DELETE FROM wallet_pub WHERE id=${tmp.old}`
                await dbInterface.setQueryString(sql4).query()
            }
        }

        if (params && typeof params.walletHash !== 'undefined') {
            return CACHE[params.walletHash]
        } else {
            return CACHE
        }
    }

    /**
     * @param {string} params.walletHash
     * @param {string} params.currencyCode
     */
    getOrGenerate = async (params) => {
        Log.daemon('DS/WalletPub getOrGenerated started', params)
        let xpubs = await this.getWalletPubs(params)
        if (!xpubs || typeof xpubs['btc.44'] === 'undefined' || typeof xpubs['btc.84'] === 'undefined' || typeof xpubs['btc.49'] === 'undefined') {
            Log.daemon('DS/WalletPub called BTC pub generation')
            const mnemonic = await BlocksoftKeysStorage.getWalletMnemonic(params.walletHash, 'WalletPub.getOrGenerate')
            if (!xpubs || typeof xpubs['btc.44'] === 'undefined') {
                const tmp = await BlocksoftKeys.discoverXpub({ mnemonic, currencyCode: params.currencyCode })
                await this.saveWalletPub({ walletHash: params.walletHash, currencyCode: params.currencyCode, walletPubType: 'btc.44', walletPubValue: tmp }, 'getOrGenerate')
            }
            if (!xpubs || typeof xpubs['btc.49'] === 'undefined') {
                const tmp = await BlocksoftKeys.discoverXpub({ mnemonic, currencyCode: params.currencyCode + '_SEGWIT_COMPATIBLE' })
                await this.saveWalletPub({ walletHash: params.walletHash, currencyCode: params.currencyCode, walletPubType: 'btc.49', walletPubValue: tmp }, 'getOrGenerate')
            }
            if (!xpubs || typeof xpubs['btc.84'] === 'undefined') {
                const tmp = await BlocksoftKeys.discoverXpub({ mnemonic, currencyCode: params.currencyCode + '_SEGWIT' })
                await this.saveWalletPub({ walletHash: params.walletHash, currencyCode: params.currencyCode, walletPubType: 'btc.84', walletPubValue: tmp }, 'getOrGenerate')
            }
            xpubs = await this.getWalletPubs(params)
            Log.daemon('DS/WalletPub called BTC pub generated')
        }
        return xpubs
    }

    /**
     * @param {object} params
     * @param {string} params.currencyCode
     * @param {string} params.walletHash
     * @param {string} params.needSegwit
     * @param {string} params.needSegwitCompatible
     * @param {string} params.needLegacy
     * @returns {Promise<void>}
     */
    discoverMoreAccounts = async (params, source = '') => {
        Log.daemon('DS/WalletPub discoverMoreAccounts started ' + source, params)
        const xpubs = await this.getOrGenerate(params)
        if (params.needLegacy) {
            const xpub = xpubs['btc.44']
            await this._discoverMoreAccountsForXpub(xpub, 0, false, source)
        }
        if (params.needSegwitCompatible) {
            const xpub = xpubs['btc.49']
            await this._discoverMoreAccountsForXpub(xpub, 0, false, source)
        }
        if (params.needSegwit) {
            const xpub = xpubs['btc.84']
            await this._discoverMoreAccountsForXpub(xpub, 0, false, source)
        }
        return true
    }

    /**
     * @param xpub
     * @param derivationIndex
     * @param setSelectedFunction
     * @param source
     * @returns {Promise<boolean>}
     * @private
     */
    _discoverMoreAccountsForXpub = async (xpub, derivationIndex = 0, setSelectedFunction = false, source = '') => {
        // @todo removed index and function in params
        const max = await accountHdDS.getAccountsMaxForScanPub({ walletPubId: xpub.id, currencyCode: 'BTC' }, source)

        Log.daemon('DS/WalletPub _discoverMoreAccountsForXpub started ' + source + ' maxForXpub ' + JSON.stringify(max) + ' xpub ' + JSON.stringify(xpub))

        if (max && max.accountsDerivationIndex > -1) {
            const newDerivationIndex = max.accountsDerivationIndex * 1 + 1
            if (newDerivationIndex > derivationIndex) {
                derivationIndex = newDerivationIndex
            }
        }
        const cacheTitle = 'xpub_' + xpub.id + '_from_' + derivationIndex

        if (typeof CACHE_NOW_UPDATING[cacheTitle] !== 'undefined') {
            return false
        }

        CACHE_NOW_UPDATING[cacheTitle] = 1
        let subtitle = 'UPDATE_BALANCE' + source
        let plus = 2
        if (!max || max.accountsTotal < 1) {
            subtitle = 'UPDATE_BALANCE_NO_MAX' + source
            plus = 1
        } else if (setSelectedFunction) {
            setSelectedFunction(max)
        }
        if (max.accountsTotal > 10) {
            return false
        }

        Log.daemon('DS/WalletPub _discoverMoreAccountsForXpub ' + source + ' ' + xpub.currencyCode + ' derivation will start from ' + derivationIndex)
        try {
            const discoverParams = { walletHash: xpub.walletHash, currencyCode: [xpub.currencyCode], fromIndex: derivationIndex, toIndex: derivationIndex + plus, walletPubId: xpub.id, fullTree: true }
            let step = 0
            let result
            do {
                step++
                discoverParams.fromIndex = discoverParams.toIndex
                discoverParams.toIndex = discoverParams.fromIndex + plus
                result = await accountDS.discoverAccounts(discoverParams, subtitle + '_TRY_' + step)
                if (step > 3) {
                    plus = 5
                }
            } while (result && result.newSaved === 0 && step < 10)
            Log.daemon('DS/WalletPub discoverMoreAccountsForXpub derivation finished')
            if (plus === 1 && setSelectedFunction) {
                setSelectedFunction()
            }
        } catch (e) {
            Log.errDaemon('DS/WalletPub discoverMoreAccountsForXpub derivation error ' + e.message)
        }

        delete CACHE_NOW_UPDATING[cacheTitle]

    }

    /**
     * @param {Object} params
     * @param {string} params.mnemonic
     * @param {string} params.walletHash
     * @param {string} params.force
     * @param {string} source
     * @returns {Promise<{BTC: [], BTC_SEGWIT: [], walletPubId}>}
     */
    discoverFromTrezor = async (params, source) => {
        let mnemonic
        if (typeof params.mnemonic === 'undefined' || !params.mnemonic) {
            mnemonic = await BlocksoftKeysStorage.getWalletMnemonic(params.walletHash, 'WalletPub.discoverFromTrezor ' + source)
        } else {
            mnemonic = params.mnemonic
        }
        if (!mnemonic) {
            throw new Error('mnemonic not found')
        }

        const derivations = { 'BTC': [], 'BTC_SEGWIT': [], 'BTC_SEGWIT_COMPATIBLE' : [] }
        Log.daemon('DS/WalletPub discoverFromTrezor ' + source + ' discover Xpub started')
        const xpubs = await Promise.all([
            BlocksoftKeys.discoverXpub({ mnemonic, currencyCode: 'BTC' }),
            BlocksoftKeys.discoverXpub({ mnemonic, currencyCode: 'BTC_SEGWIT_COMPATIBLE' }),
            BlocksoftKeys.discoverXpub({ mnemonic, currencyCode: 'BTC_SEGWIT' }),
        ])
        Log.daemon('DS/WalletPub discoverFromTrezor ' + source + ' scan discovered Xpub stared')

        const trezorServer = await BlocksoftExternalSettings.getTrezorServer('BTC_TREZOR_SERVER', 'hdOn')
        Log.daemon(`LINK1 ${trezorServer}/api/v2/xpub/${xpubs[0]}?details=tokens&tokens=used&gap=9999`)
        Log.daemon(`LINK2 ${trezorServer}/api/v2/xpub/${xpubs[1]}?details=tokens&tokens=used&gap=9999`)
        Log.daemon(`LINK2 ${trezorServer}/api/v2/xpub/${xpubs[2]}?details=tokens&tokens=used&gap=9999`)
        const importCheckUsed = await BlocksoftAxios.getWithoutBraking(`${trezorServer}/api/v2/xpub/${xpubs[0]}?details=tokens&tokens=used&gap=9999`)
        const importCheckUsed1 = await BlocksoftAxios.getWithoutBraking(`${trezorServer}/api/v2/xpub/${xpubs[1]}?details=tokens&tokens=used&gap=9999`)
        const importCheckUsed2 = await BlocksoftAxios.getWithoutBraking(`${trezorServer}/api/v2/xpub/${xpubs[2]}?details=tokens&tokens=used&gap=9999`)
        let toSave = false
        const xPubBalances = [
            {
                balance : 0,
                unconfirmed : 0
            },
            {
                balance: 0,
                unconfirmed: 0
            },
            {
                balance: 0,
                unconfirmed: 0
            }
        ]
        if (importCheckUsed && importCheckUsed.data && importCheckUsed.data.usedTokens > 0) {
            xPubBalances[0].balance = importCheckUsed.data.balance
            xPubBalances[0].unconfirmed = importCheckUsed.data.unconfirmedBalance
            if (importCheckUsed.data.usedTokens === 1 && importCheckUsed.data.tokens[0].path === 'm/44\'/0\'/0\'/0/0') {
                Log.daemon('DS/WalletPub discoverFromTrezor ' + source + ' scan BTC Xpub found nothing')
                // do nothing
            } else {
                Log.daemon('DS/WalletPub discoverFromTrezor ' + source + ' scan BTC Xpub found ' + importCheckUsed.data.tokens.length)
                toSave = true
                let token
                for (token of importCheckUsed.data.tokens) {
                    const tmp = { path: token.path, alreadyShown: token.transfers > 0 }
                    derivations.BTC.push(tmp)
                    Log.daemon('DS/WalletPub discoverFromTrezor ' + source + ' pushed BTC ' + JSON.stringify(token))
                }
            }
        }
        if (importCheckUsed1 && importCheckUsed1.data && importCheckUsed1.data.usedTokens > 0) {
            xPubBalances[1].balance = importCheckUsed1.data.balance
            xPubBalances[1].unconfirmed = importCheckUsed1.data.unconfirmedBalance
            if (importCheckUsed1.data.usedTokens === 1 && (importCheckUsed1.data.tokens[0].path === 'm/49\'/0\'/0\'/0/1' || importCheckUsed1.data.tokens[0].path === 'm/49\'/0\'/0\'/0/0')) {
                Log.daemon('DS/WalletPub discoverFromTrezor ' + source + ' scan BTC_SEGWIT_COMPATIBLE Xpub found nothing')
                // do nothing
            } else {
                Log.daemon('DS/WalletPub discoverFromTrezor ' + source + ' scan BTC_SEGWIT_COMPATIBLE Xpub found ' + importCheckUsed1.data.tokens.length)
                toSave = true
                let token
                for (token of importCheckUsed1.data.tokens) {
                    const tmp = { path: token.path, alreadyShown: token.transfers > 0 }
                    derivations.BTC_SEGWIT_COMPATIBLE.push(tmp)
                    Log.daemon('DS/WalletPub discoverFromTrezor ' + source + ' pushed BTC_SEGWIT_COMPATIBLE ' + JSON.stringify(token))
                }
            }
        }
        if (importCheckUsed2 && importCheckUsed2.data && importCheckUsed2.data.usedTokens > 0) {
            xPubBalances[2].balance = importCheckUsed2.data.balance
            xPubBalances[2].unconfirmed = importCheckUsed2.data.unconfirmedBalance
            if (importCheckUsed2.data.usedTokens === 1 && importCheckUsed2.data.tokens[0].path === 'm/84\'/0\'/0\'/0/0') {
                Log.daemon('DS/WalletPub discoverFromTrezor ' + source + ' scan BTC_SEGWIT Xpub found nothing')
                // do nothing
            } else {
                Log.daemon('DS/WalletPub discoverFromTrezor ' + source + ' scan BTC_SEGWIT Xpub found ' + importCheckUsed2.data.tokens.length)
                toSave = true
                let token
                for (token of importCheckUsed2.data.tokens) {
                    const tmp = { path: token.path, alreadyShown: token.transfers > 0 }
                    derivations.BTC_SEGWIT.push(tmp)
                    Log.daemon('DS/WalletPub discoverFromTrezor ' + source + ' pushed BTC_SEGWIT ' + JSON.stringify(token))
                }
            }
        }

        if (toSave || params.force) {
            await walletDS.updateWallet({ walletHash : params.walletHash, walletIsHd: 1 })
            await this.saveWalletPub({ walletHash : params.walletHash, currencyCode: 'BTC', walletPubType: 'btc.44', walletPubValue: xpubs[0], balance : xPubBalances[0].balance, unconfirmed : xPubBalances[0].unconfirmed }, 'fromTrezor')
            await this.saveWalletPub({ walletHash : params.walletHash, currencyCode: 'BTC', walletPubType: 'btc.49', walletPubValue: xpubs[1], balance : xPubBalances[1].balance, unconfirmed : xPubBalances[1].unconfirmed }, 'fromTrezor')
            await this.saveWalletPub({ walletHash : params.walletHash, currencyCode: 'BTC', walletPubType: 'btc.84', walletPubValue: xpubs[2], balance : xPubBalances[2].balance, unconfirmed : xPubBalances[2].unconfirmed }, 'fromTrezor')
            Log.daemon('DS/WalletPub discoverFromTrezor ' + source + ' saved xpubs', {toSave, params, derivations})
        }
        const check = await this.getWalletPubs({walletHash : params.walletHash, currencyCode: 'BTC'})

        let token

        if (check && typeof check['btc.44'] !== 'undefined') {
            derivations.walletPubId = check['btc.44'].id

            if (derivations.BTC && derivations.BTC.length > 0) {
                for (token of derivations.BTC) {
                    token.walletPubId = check['btc.44'].id
                }
            }
            if (derivations.BTC_SEGWIT_COMPATIBLE && derivations.BTC_SEGWIT_COMPATIBLE.length > 0) {
                for (token of derivations.BTC_SEGWIT_COMPATIBLE) {
                    token.walletPubId = check['btc.49'].id
                }
            }
            if (derivations.BTC_SEGWIT && derivations.BTC_SEGWIT.length > 0) {
                for (token of derivations.BTC_SEGWIT) {
                    token.walletPubId = check['btc.84'].id
                }
            }
        }

        Log.daemon('DS/WalletPub discoverFromTrezor ' + source + ' import derivations', derivations)

        return derivations
    }

}

export default new WalletPub()
