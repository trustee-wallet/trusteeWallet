import DBInterface from '../DB/DBInterface'
import Log from '../../../services/Log/Log'
import BlocksoftKeysStorage from '../../../../crypto/actions/BlocksoftKeysStorage/BlocksoftKeysStorage'
import BlocksoftKeys from '../../../../crypto/actions/BlocksoftKeys/BlocksoftKeys'
import accountDS from '../Account/Account'
import BlocksoftAxios from '../../../../crypto/common/BlocksoftAxios'
import walletDS from '../Wallet/Wallet'

const CACHE = {}
const CACHE_NOW_UPDATING = {}

class WalletPub {

    /**
     * @param {string} walletPub.walletHash
     * @param {string} walletPub.walletPubType
     * @param {string} walletPub.walletPubValue
     * @param {string} walletPub.currencyCode
     */
    saveWalletPub = async (walletPub) => {
        const dbInterface = new DBInterface()

        const now = Math.round(new Date().getTime() / 1000)
        await dbInterface.setQueryString(`INSERT INTO wallet_pub (wallet_hash, currency_code, wallet_pub_type, wallet_pub_value, balance_scan_time, transactions_scan_time) 
        VALUES ('${walletPub.walletHash}', '${walletPub.currencyCode}', '${walletPub.walletPubType}','${walletPub.walletPubValue}', '${now}', '${now}')`).query()
        CACHE[walletPub.walletHash] = false
    }

    /**
     * @param {string} walletPub.walletHash
     * @param {string} walletPub.currencyCode
     * @returns {Promise<[{id, walletPubType, walletPubValue, walletPubLastIndex, balanceFix, balanceTxt, balanceProvider}]|boolean>}
     */
    getWalletPubs = async (walletPub) => {
        if (typeof CACHE[walletPub.walletHash] !== 'undefined' && CACHE[walletPub.walletHash]) {
            return CACHE[walletPub.walletHash]
        }

        const dbInterface = new DBInterface()

        const res = await dbInterface.setQueryString(`
        SELECT id, 
        wallet_pub_type AS walletPubType, 
        wallet_pub_value AS walletPubValue, 
        wallet_pub_last_index AS walletPubLastIndex, 
        wallet_hash AS walletHash,
        currency_code AS currencyCode,
        balance_fix AS balanceFix, 
        balance_txt AS balanceTxt, 
        balance_provider AS balanceProvider
        FROM wallet_pub 
        WHERE wallet_hash='${walletPub.walletHash}' AND currency_code='${walletPub.currencyCode}'`).query()
        if (!res || !res.array) return false

        const tmp = {}
        let pub
        for (pub of res.array) {
            if (pub.walletPubType === 'btc.84') {
                pub.currencyCode = 'BTC_SEGWIT'
            }
            tmp[pub.walletPubType] = pub
        }
        CACHE[walletPub] = tmp
        return tmp
    }

    /**
     * @param {string} params.walletHash
     * @param {string} params.currencyCode
     */
    getOrGenerate = async (params) => {
        let xpubs = await this.getWalletPubs(params)
        if (typeof xpubs['btc.44'] === 'undefined' || typeof xpubs['btc.84'] === 'undefined') {
            Log.daemon('DS/WalletPub called BTC pub generation')
            const mnemonic = await BlocksoftKeysStorage.getWalletMnemonic(params.walletHash)
            if (typeof xpubs['btc.44'] === 'undefined') {
                const tmp = await BlocksoftKeys.discoverXpub({ mnemonic, currencyCode: params.currencyCode })
                await this.saveWalletPub({ walletHash: params.walletHash, currencyCode: params.currencyCode, walletPubType: 'btc.44', walletPubValue: tmp })
            }
            if (typeof xpubs['btc.84'] === 'undefined') {
                const tmp = await BlocksoftKeys.discoverXpub({ mnemonic, currencyCode: params.currencyCode + '_SEGWIT' })
                await this.saveWalletPub({ walletHash: params.walletHash, currencyCode: params.currencyCode, walletPubType: 'btc.84', walletPubValue: tmp })
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
     * @param {string} params.needLegacy
     * @returns {Promise<void>}
     */
    discoverMoreAccounts = async (params) => {
        Log.daemon('discoverMoreAccounts', params)
        const xpubs = await this.getOrGenerate(params)
        if (params.needLegacy) {
            const xpub = xpubs['btc.44']
            await this.discoverMoreAccountsForXpub(xpub)
        }
        if (params.needSegwit) {
            const xpub = xpubs['btc.84']
            await this.discoverMoreAccountsForXpub(xpub)
        }
    }

    discoverMoreAccountsForXpub = async (xpub, derivationIndex = 0, setSelectedFunction = false) => {
        const max = await accountDS.getAccountsMaxForScanPub({ wallet_pub_id: xpub.id })

        Log.daemon('DS/WalletPub discoverMoreAccountsForXpub maxForXpub ' + JSON.stringify(max) + ' xpub ' + JSON.stringify(xpub))

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
        let subtitle = 'UPDATE_BALANCE'
        let plus = 2
        if (!max || max.accountsTotal < 1) {
            subtitle = 'UPDATE_BALANCE_NO_MAX'
            plus = 1
        } else if (setSelectedFunction) {
            setSelectedFunction(max)
        }
        if (max.accountsTotal > 10) {
            return false
        }

        Log.daemon('DS/WalletPub discoverMoreAccountsForXpub ' + xpub.currencyCode + ' derivation will start from ' + derivationIndex)
        try {
            await accountDS.discoverAccounts({ walletHash: xpub.walletHash, currencyCode: [xpub.currencyCode], fromIndex: derivationIndex, toIndex: derivationIndex + plus, walletPubId: xpub.id, fullTree: true }, subtitle)
            Log.daemon('DS/WalletPub discoverMoreAccountsForXpub derivation finished')
            if (plus === 1 && setSelectedFunction) {
                setSelectedFunction()
            }
        } catch (e) {
            Log.errDaemon('DS/WalletPub discoverMoreAccountsForXpub derivation error ' + e.message)
        }

        delete CACHE_NOW_UPDATING[cacheTitle]

    }

    discoverNewAddressesForXpub = async (xpub, addresses, gap = 99999) => {
        Log.daemon('DS/WalletPub discoverNewAddressesForXpub ' + JSON.stringify(addresses) + ' xpub ' + JSON.stringify(xpub))
        const link = 'https://btc1.trezor.io/api/v2/xpub/' + xpub.walletPubValue + '?details=tokens&tokens=used&gap=' + gap
        const res = await BlocksoftAxios.getWithoutBraking(link)
        if (!res || !res.data || !res.data.tokens) {
            return false
        }
        let token = 0

        const derivations = {}
        derivations[xpub.currencyCode] = []
        for (token of res.data.tokens) {
            if (typeof addresses[token.name] === 'undefined') {
                continue
            }
            const tmp = { path: token.path, already_shown: 1 }
            derivations[xpub.currencyCode].push(tmp)
        }

        Log.daemon('DS/WalletPub discoverNewAddressesForXpub ' + xpub.currencyCode + ' derivation will be ' + JSON.stringify(derivations))
        try {
            await accountDS.discoverAccounts({ walletHash: xpub.walletHash, currencyCode: [xpub.currencyCode], fromIndex: -1, toIndex: -1, walletPubId: xpub.id, fullTree: true, derivations }, 'NEW_ADDRESS_FROM_XPUB')
            Log.daemon('DS/WalletPub discoverNewAddressesForXpub derivation finished')
        } catch (e) {
            Log.errDaemon('DS/WalletPub discoverNewAddressesForXpub derivation error ' + e.message)
        }
    }

    discoverOnImport = async (params) => {
        let mnemonic
        if (typeof params.mnemonic === 'undefined' || !params.mnemonic) {
            mnemonic = await BlocksoftKeysStorage.getWalletMnemonic(params.walletHash)
        } else {
            mnemonic = params.mnemonic
        }
        if (!mnemonic) {
            throw new Error('mnemonic not found')
        }

        const derivations = { 'BTC': [], 'BTC_SEGWIT': [] }
        Log.log('DS/WalletPub discoverOnImport IMPORT discover Xpub started')
        const xpubs = await Promise.all([
            BlocksoftKeys.discoverXpub({ mnemonic, currencyCode: 'BTC' }),
            BlocksoftKeys.discoverXpub({ mnemonic, currencyCode: 'BTC_SEGWIT' })
        ])
        Log.log('DS/WalletPub discoverOnImport IMPORT scan discovered Xpub stared')
        Log.log(`LINK1 https://btc1.trezor.io/api/v2/xpub/${xpubs[0]}?details=tokens&tokens=used&gap=9999`)
        Log.log(`LINK2 https://btc1.trezor.io/api/v2/xpub/${xpubs[1]}?details=tokens&tokens=used&gap=9999`)
        const importCheckUsedTmp = await Promise.all([
            BlocksoftAxios.getWithoutBraking(`https://btc1.trezor.io/api/v2/xpub/${xpubs[0]}?details=tokens&tokens=used&gap=9999`),
            BlocksoftAxios.getWithoutBraking(`https://btc1.trezor.io/api/v2/xpub/${xpubs[1]}?details=tokens&tokens=used&gap=9999`)
        ])
        const importCheckUsed = importCheckUsedTmp[0]
        const importCheckUsed2 = importCheckUsedTmp[1]
        if (importCheckUsed && importCheckUsed.data && importCheckUsed.data.usedTokens > 0) {
            if (importCheckUsed.data.usedTokens === 1 && importCheckUsed.data.tokens[0].path === 'm/44\'/0\'/0\'/0/0') {
                Log.log('DS/WalletPub discoverOnImport IMPORT scan BTC Xpub found nothing')
                // do nothing
            } else {
                Log.log('DS/WalletPub discoverOnImport IMPORT scan BTC Xpub found ' + importCheckUsed.data.tokens.length)
                await walletDS.updateWallet({ walletHash : params.walletHash, walletIsHd: 1 })
                await this.saveWalletPub({ walletHash : params.walletHash, currencyCode: 'BTC', walletPubType: 'btc.44', walletPubValue: xpubs[0] })
                let token
                for (token of importCheckUsed.data.tokens) {
                    const tmp = { path: token.path, already_shown: token.transfers > 0 }
                    derivations.BTC.push(tmp)
                    Log.log('DS/WalletPub discoverOnImport IMPORT pushed BTC ' + JSON.stringify(token))
                }
            }
        }
        if (importCheckUsed2 && importCheckUsed2.data && importCheckUsed2.data.usedTokens > 0) {
            if (importCheckUsed2.data.usedTokens === 1 && importCheckUsed2.data.tokens[0].path === 'm/84\'/0\'/0\'/0/0') {
                Log.log('DS/WalletPub discoverOnImport IMPORT scan BTC_SEGWIT Xpub found nothing')
                // do nothing
            } else {
                Log.log('DS/WalletPub discoverOnImport IMPORT scan BTC_SEGWIT Xpub found ' + importCheckUsed2.data.tokens.length)
                await walletDS.updateWallet({ walletHash : params.walletHash, walletIsHd: 1 })
                await this.saveWalletPub({ walletHash : params.walletHash, currencyCode: 'BTC', walletPubType: 'btc.84', walletPubValue: xpubs[1] })
                let token
                for (token of importCheckUsed2.data.tokens) {
                    const tmp = { path: token.path, already_shown: token.transfers > 0 }
                    derivations.BTC_SEGWIT.push(tmp)
                    Log.log('DS/WalletPub discoverOnImport IMPORT pushed BTC_SEGWIT ' + JSON.stringify(token))
                }
            }
        }

        Log.log('Import derivations ', derivations)

        return derivations
    }

}

export default new WalletPub()
