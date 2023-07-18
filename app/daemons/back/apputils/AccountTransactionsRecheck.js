/**
 * @version 0.11
 */
import Log from '@app/services/Log/Log'
import transactionDS from '@app/appstores/DataSource/Transaction/Transaction'
import appNewsDS from '@app/appstores/DataSource/AppNews/AppNews'
import { BlocksoftTransfer } from '@crypto/actions/BlocksoftTransfer/BlocksoftTransfer'
import settingsActions from '@app/appstores/Stores/Settings/SettingsActions'
import config from '@app/config/config'

const CACHE_TO_REMOVE = {} // couldnt remove on first scan - as BTC is scanned in few accounts

export default async function AccountTransactionsRecheck(newTransactions, account, source) {

    const transactionUpdateObj = {
        transactionsScanTime: Math.round(new Date().getTime() / 1000)
    }

    if (!newTransactions || typeof newTransactions === 'undefined') {
        transactionUpdateObj.transactionsScanLog = 'not txs '
        return transactionUpdateObj
    }

    if (typeof CACHE_TO_REMOVE[account.currencyCode] === 'undefined') {
        CACHE_TO_REMOVE[account.currencyCode] = {}
    }

    const dbTransactions = {}
    const toRemove = []
    const dbNonces = {}

    try {
        const tmps = await transactionDS.getTransactions({
            currencyCode: account.currencyCode,
            walletHash: account.walletHash,
            noOrder: true,
            noOld: true
        },  'AccountTransactionsRecheck dbTransactions ' + source)
        if (tmps && tmps.length > 0) {
            let tmp
            for (tmp of tmps) {
                if (tmp.addressFrom === '' && typeof tmp.transactionJson !== 'undefined' && tmp.transactionJson && typeof tmp.transactionJson.nonce !== 'undefined' && typeof tmp.transactionJson.delegatedNonce === 'undefined') {
                    const key = tmp.addressFromBasic + '_' + tmp.transactionJson.nonce
                    if (typeof dbNonces[key] === 'undefined') {
                        dbNonces[key] = []
                    }
                    dbNonces[key].push(tmp)
                }
                if (typeof dbTransactions[tmp.transactionHash] !== 'undefined') {
                    // rmv double
                    Log.daemon('AccountTransactionsRecheck dbTransactions  will remove ' + tmp.id)
                    toRemove.push(tmp.id)
                    continue
                } else {
                    dbTransactions[tmp.transactionHash] = tmp
                }
                if (typeof tmp.transactionsOtherHashes !== 'undefined' && tmp.transactionsOtherHashes) {
                    const tmp2 = tmp.transactionsOtherHashes.split(',')
                    if (tmp2) {
                        let part
                        for (part of tmp2) {
                            dbTransactions[part] = dbTransactions[tmp.transactionHash]
                        }
                    }
                }
            }
        }
    } catch (e) {
        Log.errDaemon('AccountTransactionsRecheck dbTransactions something wrong ' + account.currencyCode + ' ' + e.message)
    }

    if (toRemove.length > 0) {
        await transactionDS.removeTransactions(toRemove)
    }
    if (!account.transactionsScanLog || account.transactionsScanLog.length < 10) {
        source = 'FIRST'
    }

    /**
     * @property {*} transactionHash
     * @property {*} blockHash
     * @property {*} blockNumber
     * @property {*} blockTime
     * @property {*} blockConfirmations
     * @property {*} transactionDirection
     * @property {*} addressFrom
     * @property {*} addressTo
     * @property {*} addressAmount
     * @property {*} transactionStatus
     * @property {*} transactionFee
     * @property {*} contractAddress
     * @property {*} inputValue
     * @property {*} transactionJson
     */
    let transaction
    let transactionsError = ''
    let changesCount = 0
    const unique = {}
    try {
        for (transaction of newTransactions) {
            if (typeof unique[transaction.transactionHash] !== 'undefined') {
                continue
            }
            unique[transaction.transactionHash] = 1
            try {
                const tmp = await AccountTransactionRecheck(transaction, dbTransactions[transaction.transactionHash], account, source)
                if (typeof dbTransactions[transaction.transactionHash] !== 'undefined') {
                    delete dbTransactions[transaction.transactionHash]
                    if (typeof CACHE_TO_REMOVE[account.currencyCode][transaction.transactionHash] !== 'undefined') {
                        delete CACHE_TO_REMOVE[account.currencyCode][transaction.transactionHash]
                    }
                }
                if (tmp.isChanged > 0) {

                    if (transaction.transactionStatus === 'success' || transaction.transactionStatus === 'confirming') {
                        if (typeof transaction.transactionJson !== 'undefined' && transaction.transactionJson && typeof transaction.transactionJson.nonce !== 'undefined' && typeof transaction.transactionJson.delegatedNonce === 'undefined') {
                            let key = transaction.addressFromBasic  + '_' + transaction.transactionJson.nonce
                            if (typeof dbNonces[key] !== 'undefined' && dbNonces[key].length > 1) {
                                for (let nonced of dbNonces[key]) {
                                    if (nonced.transactionHash !== transaction.transactionHash) {
                                        await transactionDS.saveTransaction({
                                            transactionStatus: 'replaced',
                                            transactionsScanLog: nonced.transactionsScanLog + ' dropped by nonce'
                                        }, nonced.id, 'replaced')
                                    }
                                }
                            }
                        }
                    }

                    changesCount++
                }
            } catch (e) {
                e.message = ' TX ' + transaction.transactionHash + ' ' + e.message
                // noinspection ExceptionCaughtLocallyJS
                throw e
            }
        }
    } catch (e) {
        if (config.debug.appErrors) {
            console.log('AccountTransactionsRecheck parsing error ' + e.message, e)
        }
        transactionsError += ' parsing error ' + e.message
    }

    if (dbTransactions) {
        const now = new Date().getTime()
        for (const hash in dbTransactions) {
            const dbTransaction = dbTransactions[hash]
            if (dbTransaction.blockConfirmations > 40) {
                continue
            }

            let minutesToWait = 0
            let minutesToInform = 0
            if (account.currencyCode === 'USDT') {
                minutesToWait = 1200
                minutesToInform = 12000
            } else if (account.currencyCode === 'ETH' || account.currencyCode.indexOf('ETH_') === 0) {
                minutesToWait = 240
                minutesToInform = 400
            } else if (dbTransaction.transactionStatus === 'new' || dbTransaction.transactionStatus === 'pending') {
                minutesToWait = 20 // pending tx will be in the list - checked in trezor
                minutesToInform = 200
            } else if (dbTransaction.transactionStatus === 'confirming') {
                minutesToWait = 10
                minutesToInform = 200
            } else {
                continue
            }

            if (typeof CACHE_TO_REMOVE[account.currencyCode][hash] === 'undefined') {
                CACHE_TO_REMOVE[account.currencyCode][hash] = { ts: now, count: 0 }
                continue
            }

            const minutesFromScan = Math.round((now - CACHE_TO_REMOVE[account.currencyCode][hash].ts) / 60000)
            CACHE_TO_REMOVE[account.currencyCode][hash].count++
            if (account.currencyCode === 'BTC') {
                if (minutesFromScan < 20 || CACHE_TO_REMOVE[account.currencyCode][hash].count < 10) {
                    continue // 10 minutes from last recheck as btc are in several accounts
                }
            } else {
                if (minutesFromScan < 2 || CACHE_TO_REMOVE[account.currencyCode][hash].count < 3) {
                    continue // other currencies are scanned in one account
                }
            }

            const time = dbTransaction.updatedAt || dbTransaction.createdAt
            const minutes = Math.round((now - new Date(time).getTime()) / 60000)
            if (minutes > minutesToWait && (dbTransaction.transactionStatus !== 'fail' && dbTransaction.transactionStatus !== 'no_energy')) {
                await BlocksoftTransfer.setMissingTx(account, dbTransaction)

                await transactionDS.saveTransaction({
                    transactionStatus: 'missing',
                    transactionsScanLog: dbTransaction.transactionsScanLog + ' dropped after ' + minutes + ' from ' + time
                }, dbTransaction.id, 'missing')

                if (dbTransaction.addressAmount > 0 && minutes < minutesToInform) {
                   await addNews(dbTransaction, account, source, 'FOUND_OUT_TX_STATUS_MISSING')
                }
            }
        }
    }

    if (changesCount > 0) {
        transactionUpdateObj.transactionsScanLog = 'all ok, changed ' + changesCount
        if (transactionsError) {
            transactionUpdateObj.transactionsScanLog += ', ' + transactionsError
        }
    } else {
        transactionUpdateObj.transactionsScanLog = 'not changed txs ' + transactionsError
    }
    return transactionUpdateObj
}

async function AccountTransactionRecheck(transaction, old, account, source) {
    // Log.daemon('AccountTransactionRecheck in ' + JSON.stringify(transaction) + ' old ' + JSON.stringify(old))
    let blocksToUpdate = 50
    if (account.currencyCode.indexOf('TRX') !== -1) {
        blocksToUpdate = 1000
    }
    const line = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')
    let tmpMsg = ''

    let newAddressTo = transaction.addressTo
    if (typeof newAddressTo === 'undefined' || newAddressTo === false) {
        newAddressTo = ''
    }

    if (typeof transaction.addressAmount === 'undefined') {
        // Log.daemon('UpdateAccountTransactions ' + account.currencyCode + ' skip as no addressAmount', tmpMsg, transaction)
        return false
    }
    let newAmount = typeof transaction.addressAmount === 'undefined' ? '0' : transaction.addressAmount.toString()
    if (newAmount.length > 10) {
        newAmount = newAmount.substring(0, 10)
    }
    if (newAmount === '000000000') {
        newAmount = 0
    }

    if (typeof old === 'undefined' || !old) {
        if (newAmount === 0) {
            tmpMsg = `SKIP AS ZERO AMOUNT ${account.currencyCode} HASH ${transaction.transactionHash} CONF ${transaction.blockConfirmations} AMOUNT ${transaction.addressAmount} FROM ${transaction.addressFrom} TO ${transaction.addressTo}`
            // Log.daemon('UpdateAccountTransactions ' + account.currencyCode + ' skip 1', tmpMsg, transaction)
            return { isChanged: 0, tmpMsg }
        }

        tmpMsg = ` INSERT ${account.currencyCode} HASH ${transaction.transactionHash} CONF ${transaction.blockConfirmations} AMOUNT ${transaction.addressAmount} FROM ${transaction.addressFrom} TO ${transaction.addressTo}`
        if (source !== 'FIRST' && transaction.addressAmount > 0) {
            tmpMsg += ' with PUSH ' + source
        }
        transaction.currencyCode = account.currencyCode
        transaction.walletHash = account.walletHash
        transaction.accountId = account.id
        transaction.createdAt = transaction.blockTime // to make created tx more accurate
        transaction.minedAt = transaction.blockTime
        transaction.transactionsScanTime = Math.round(new Date().getTime() / 1000)
        transaction.transactionsScanLog = line + ' ' + tmpMsg
        if (!transaction.transactionDirection) {
            transaction.transactionDirection = 'outcome'
        }

        await transactionDS.saveTransaction(transaction, false, 'old undefined ' + tmpMsg)
        // Log.daemon('UpdateAccountTransactions ' + account.currencyCode + ' added', tmpMsg, transaction)
        if (source !== 'FIRST' && transaction.addressAmount > 0) {
            await addNews(transaction, account, source, 'new')
        }
        return { isChanged: 1, tmpMsg }
    }

    if (old.transactionHash !== transaction.transactionHash) {
        // Log.daemon('UpdateAccountTransactions ' + account.currencyCode + ' old is replaced - would not place DB HASH ' + old.transactionHash + ' != SCANNED HASH ' + transaction.transactionHash, old, transaction)
        return { isChanged: 0, tmpMsg: ` DROPPED SCANNED ${transaction.transactionHash} DB ${old.transactionHash}` }
    }

    if (typeof old.updateSkip !== 'undefined') {
        return { isChanged: 0, tmpMsg: ` SKIPPED SCANNED ${transaction.transactionHash} DB ${old.transactionHash}` }
    }

    let oldAmount = typeof old.addressAmount === 'undefined' ? '0' : old.addressAmount.toString()
    if (oldAmount.length > 10) {
        oldAmount = oldAmount.substring(0, 10)
    }
    if (oldAmount === '000000000') {
        oldAmount = 0
    }


    let oldAddressTo = old.addressTo
    if (typeof oldAddressTo === 'undefined' || !oldAddressTo) {
        oldAddressTo = ''
    }

    if (old.transactionOfTrusteeWallet > 0) {
        const transactionPart = {
            transactionStatus: transaction.transactionStatus,
            blockConfirmations: transaction.blockConfirmations
        }

        if (!old.createdAt) {
            tmpMsg = ` TWALLET UPDATE ${account.id} ${account.currencyCode} HASH ${transaction.transactionHash} by CREATED NEW ${transaction.blockTime} OLD ${old.createdAt} AMOUNT ${transaction.addressAmount} FROM ${transaction.addressFrom} TO ${transaction.addressTo}`
        } else if (transaction.blockTime && (!old.minedAt || old.minedAt !== transaction.blockTime)) {
            tmpMsg = ` TWALLET UPDATE ${account.id} ${account.currencyCode} HASH ${transaction.transactionHash} by MINED NEW ${transaction.blockTime} OLD ${old.minedAt} AMOUNT ${transaction.addressAmount} FROM ${transaction.addressFrom} TO ${transaction.addressTo}`
        } else if (old.transactionStatus !== transaction.transactionStatus || !old.createdAt) {
            tmpMsg = ` TWALLET UPDATE ${account.id} ${account.currencyCode} HASH ${transaction.transactionHash} by STATUS NEW ${transaction.transactionStatus} OLD ${old.transactionStatus} AMOUNT ${transaction.addressAmount} FROM ${transaction.addressFrom} TO ${transaction.addressTo}`
        } else if (!old.transactionFee && old.transactionFee !== transaction.transactionFee) {
            tmpMsg = ` TWALLET UPDATE ${account.id} ${account.currencyCode} HASH ${transaction.transactionHash} by FEE ${transaction.transactionFee} AMOUNT ${transaction.addressAmount} FROM ${transaction.addressFrom} TO ${transaction.addressTo}`
        } else if (!old.addressAmount || old.addressAmount * 1 !== transaction.addressAmount * 1) {
            tmpMsg = ` TWALLET UPDATE ${account.id} ${account.currencyCode} HASH ${transaction.transactionHash} by AMOUNT NEW ${transaction.addressAmount} OLD ${old.addressAmount} FROM ${transaction.addressFrom} TO ${transaction.addressTo}`
        } else if (old.blockConfirmations === transaction.blockConfirmations || (old.blockConfirmations > blocksToUpdate && transaction.blockConfirmations > blocksToUpdate)) {
            tmpMsg = ` TWALLET SKIP ${account.id} ${account.currencyCode} HASH ${transaction.transactionHash} CONF ${transaction.blockConfirmations} OLD CONF ${old.blockConfirmations} STATUS ${old.transactionStatus}`
            return { isChanged: 0, tmpMsg }
        } else {
            tmpMsg = ` TWALLET UPDATE ${account.id} ${account.currencyCode} HASH ${transaction.transactionHash} by CONF NEW ${transaction.blockConfirmations} OLD ${old.blockConfirmations} STATUS ${transaction.transactionStatus} AMOUNT ${transaction.addressAmount} FROM ${transaction.addressFrom} TO ${transaction.addressTo}`
        }

        if (!old.transactionFee && transaction.transactionFee) {
            tmpMsg += ' PLUS FEE ' + transaction.transactionFee
            transactionPart.transactionFee = transaction.transactionFee
            transactionPart.transactionFeeCurrencyCode = transaction.transactionFeeCurrencyCode || ''
        }
        if (!old.createdAt) {
            transactionPart.createdAt = transaction.blockTime
        }
        transactionPart.minedAt = transaction.blockTime
        transactionPart.transactionsScanTime = Math.round(new Date().getTime() / 1000)
        transactionPart.transactionsScanLog = line + ' ' + tmpMsg
        if (old && old.transactionsScanLog) {
            transactionPart.transactionsScanLog += ' ' + old.transactionsScanLog
        }
        if (old.transactionDirection !== transaction.transactionDirection) {
            Log.daemon('UpdateAccountTransactions ' + account.currencyCode + ' by TWALLET DIRECTION id ' + old.id + ' address ' + account.address + ' hash ' + transaction.transactionHash + ' OLD ' + old.transactionDirection + ' NEW ' + transaction.transactionDirection)
        }
        await transactionDS.saveTransaction(transactionPart, old.id, 'old trustee ' + tmpMsg)

        if (old.transactionStatus !== transaction.transactionStatus && source !== 'FIRST' && transaction.addressAmount > 0) {
            await addNews(transaction, account, source, 'old')
        }
        return { isChanged: 1, tmpMsg }
    }

    let updateDirection = false
    if (!old.createdAt) {
        tmpMsg = ` FULL UPDATE ${account.id} ${account.currencyCode} HASH ${transaction.transactionHash} by CREATED NEW ${transaction.blockTime} OLD ${old.createdAt} AMOUNT ${transaction.addressAmount} FROM ${transaction.addressFrom} TO ${transaction.addressTo}`
    } else  if (transaction.blockTime && (!old.minedAt || old.minedAt !== transaction.blockTime)) {
        tmpMsg = ` FULL UPDATE ${account.id} ${account.currencyCode} HASH ${transaction.transactionHash} by MINED NEW ${transaction.blockTime} OLD ${old.minedAt} AMOUNT ${transaction.addressAmount} FROM ${transaction.addressFrom} TO ${transaction.addressTo}`
    } else if (old.transactionStatus !== transaction.transactionStatus) {
        tmpMsg = ` FULL UPDATE ${account.id} ${account.currencyCode} HASH ${transaction.transactionHash} by STATUS NEW ${transaction.transactionStatus} OLD ${old.transactionStatus} AMOUNT ${transaction.addressAmount} FROM ${transaction.addressFrom} TO ${transaction.addressTo}`
    } else if (oldAmount !== newAmount) {
        tmpMsg = ` FULL UPDATE ${account.id} ${account.currencyCode} HASH ${transaction.transactionHash} by AMOUNT NEW ${newAmount} OLD ${oldAmount} AMOUNT ${transaction.addressAmount} FROM ${transaction.addressFrom} TO ${transaction.addressTo}`
    } else if (oldAddressTo !== newAddressTo) {
        tmpMsg = ` FULL UPDATE ${account.id} ${account.currencyCode} HASH ${transaction.transactionHash} by ADDRESS_TO ${newAddressTo} OLD ${oldAddressTo} AMOUNT ${transaction.addressAmount} FROM ${transaction.addressFrom} TO ${transaction.addressTo}`
        if (!newAddressTo && old.transactionDirection === 'outcome') {
            updateDirection = true
        }
    } else if (old.addressFrom !== transaction.addressFrom) {
        tmpMsg = ` FULL UPDATE ${account.id} ${account.currencyCode} HASH ${transaction.transactionHash} by ADDRESS_FROM ${transaction.addressFrom} OLD ${old.addressFrom} AMOUNT ${transaction.addressAmount} FROM ${transaction.addressFrom} TO ${transaction.addressTo}`
    } else if (old.blockConfirmations === transaction.blockConfirmations || (old.blockConfirmations > blocksToUpdate && transaction.blockConfirmations > blocksToUpdate)) {
        tmpMsg = ` SKIP ${account.id} ${account.currencyCode} HASH ${transaction.transactionHash} CONF ${transaction.blockConfirmations} OLD CONF ${old.blockConfirmations} STATUS ${old.transactionStatus}`
        // Log.daemon('UpdateAccountTransactions ' + account.currencyCode + ' skip 3 ' + transaction.transactionHash)
        return { isChanged: 0, tmpMsg }
    } else {
        tmpMsg = ` FULL UPDATE ${account.currencyCode} HASH ${transaction.transactionHash} by CONF NEW ${transaction.blockConfirmations} OLD ${old.blockConfirmations} STATUS ${transaction.transactionStatus} AMOUNT ${transaction.addressAmount} FROM ${transaction.addressFrom} TO ${transaction.addressTo}`
    }
    transaction.createdAt = transaction.blockTime
    transaction.minedAt = transaction.blockTime
    if (old.transactionDirection !== transaction.transactionDirection) {
        Log.daemon('UpdateAccountTransactions ' + account.currencyCode + ' by DIRECTION ' + (updateDirection ? 'UPDATE ': 'SKIP') + ' id ' + old.id + ' address ' + account.address + ' hash ' + transaction.transactionHash + ' OLD ' + old.transactionDirection + ' NEW ' + transaction.transactionDirection)
        if (!updateDirection) {
            delete transaction.transactionDirection
        }
    }
    transaction.transactionsScanTime = Math.round(new Date().getTime() / 1000)
    transaction.transactionsScanLog = line + ' ' + tmpMsg + ' '
    if (old && old.transactionsScanLog) {
        transaction.transactionsScanLog += ' ' + old.transactionsScanLog
    }
    await transactionDS.saveTransaction(transaction, old.id, 'old ' + tmpMsg)
    // Log.daemon('UpdateAccountTransactions ' + account.currencyCode + ' update 2', tmpMsg, transaction)
    return { isChanged: 1, tmpMsg }
}

async function addNews(transaction, account, source, type) {
    const transactionsNotifs = await settingsActions.getSetting('transactionsNotifs')
    if (transactionsNotifs !== '1') {
        return
    }
    if (type === 'new') {
        const now = new Date().getTime()
        const time = transaction.createdAt
        const minutes = Math.round((now - new Date(time).getTime()) / 60000)
        if (minutes > 5760 ) { // 4 day
            return false
        }
    }
    let needToPopup = 1
    if (transaction.transactionStatus === 'confirming') {
        needToPopup = 0
    } else if (transaction.transactionStatus === 'delegated') {
        needToPopup = 0
    }
    let name = ''
    if (type === 'FOUND_OUT_TX_STATUS_MISSING') {
        name = type
    } else if (transaction.transactionDirection === 'income') {
        name = 'FOUND_IN_TX'
    } else {
        name = 'FOUND_OUT_TX_STATUS_' + transaction.transactionStatus.toUpperCase()
    }

    const data = {
        walletHash: account.walletHash,
        currencyCode: account.currencyCode,
        newsSource: source,
        newsNeedPopup: needToPopup,
        newsGroup: 'TX_SCANNER',
        newsName: name,
        newsJson: transaction,
        newsUniqueKey: transaction.transactionHash
    }
    await appNewsDS.saveAppNews(
        data
    )
}
