/**
 * @version 0.9
 */
import Log from '../../../Log/Log'
import transactionDS from '../../../../appstores/DataSource/Transaction/Transaction'
import appNewsDS from '../../../../appstores/DataSource/AppNews/AppNews'

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
    try {
        const tmps = await transactionDS.getTransactions({
            currencyCode: account.currencyCode,
            walletHash: account.walletHash,
            noOrder: true
        })
        if (tmps && tmps.length > 0) {
            let tmp
            for (tmp of tmps) {
                dbTransactions[tmp.transactionHash] = tmp
                if (typeof tmp.transactionsOtherHashes !== 'undefined' && tmp.transactionsOtherHashes) {
                    let tmp2 = tmp.transactionsOtherHashes.split(',')
                    if (tmp2) {
                        let part
                        for (part of tmp2) {
                            dbTransactions[part] = tmp
                        }
                    }
                }
            }
        }
    } catch (e) {
        Log.errDaemon('AccountTransactionsRecheck dbTransactions something wrong ' + account.currencyCode + ' ' + e.message)
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
    try {
        for (transaction of newTransactions) {
            try {
                const tmp = await AccountTransactionRecheck(transaction, dbTransactions[transaction.transactionHash], account, source)
                if (typeof dbTransactions[transaction.transactionHash] !== 'undefined') {
                    delete dbTransactions[transaction.transactionHash]
                    if (typeof CACHE_TO_REMOVE[account.currencyCode][transaction.transactionHash] !== 'undefined') {
                        delete CACHE_TO_REMOVE[account.currencyCode][transaction.transactionHash]
                    }
                }
                if (tmp.isChanged > 0) {
                    changesCount++
                }
            } catch (e) {
                e.message = ' TX ' + transaction.transactionHash + ' ' + e.message
                throw e
            }
        }
    } catch (e) {
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
            if (dbTransaction.currencyCode === 'USDT') {
                minutesToWait = 1200
            } else if (dbTransaction.transactionStatus === 'new' || dbTransaction.transactionStatus === 'pending') {
                minutesToWait = 20 // pending tx will be in the list - checked in trezor
            } else if (dbTransaction.transactionStatus === 'confirming') {
                minutesToWait = 10
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
            if (minutes > minutesToWait) {
                await transactionDS.saveTransaction({
                    transactionStatus: 'fail',
                    transactionsScanLog: dbTransaction.transactionsScanLog + ' dropped after ' + minutes
                }, dbTransaction.id)

                if (dbTransaction.addressAmount > 0) {
                    await appNewsDS.saveAppNews(
                        {
                            walletHash: account.walletHash,
                            currencyCode: account.currencyCode,
                            newsSource: source,
                            newsNeedPopup: 1,
                            newsGroup: 'TX_SCANNER',
                            newsName: 'FOUND_OUT_TX_STATUS_FAIL',
                            newsJson: dbTransaction
                        }
                    )
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

    let newAmount = transaction.addressAmount.toString()
    if (newAmount.length > 10) {
        newAmount = newAmount.substring(0, 10)
    }
    if (newAmount === '000000000') {
        newAmount = 0
    }

    if (typeof old === 'undefined' || !old) {
        if (newAmount === 0) {
            tmpMsg = `SKIP AS ZERO AMOUNT ${account.currencyCode} HASH ${transaction.transactionHash} CONF ${transaction.blockConfirmations} AMOUNT ${transaction.addressAmount} FROM ${transaction.addressFrom} TO ${transaction.addressTo}`
            Log.daemon('UpdateAccountTransactions skip 1', tmpMsg, transaction)
            return { isChanged: 0, tmpMsg }
        }

        tmpMsg = ` INSERT ${account.currencyCode} HASH ${transaction.transactionHash} CONF ${transaction.blockConfirmations} AMOUNT ${transaction.addressAmount} FROM ${transaction.addressFrom} TO ${transaction.addressTo}`
        transaction.currencyCode = account.currencyCode
        transaction.walletHash = account.walletHash
        transaction.accountId = account.id
        transaction.createdAt = transaction.blockTime // to make created tx more accurate
        transaction.transactionsScanTime = Math.round(new Date().getTime() / 1000)
        transaction.transactionsScanLog = line + ' ' + tmpMsg
        await transactionDS.saveTransaction(transaction)
        Log.daemon('UpdateAccountTransactions added', tmpMsg, transaction)

        if (source !== 'FIRST' && transaction.addressAmount > 0) {
            await addNews(transaction, account, source)
        }
        return { isChanged: 1, tmpMsg }
    }

    if (old.transactionHash !== transaction.transactionHash) {
        Log.daemon('UpdateAccountTransactions old is replaced - would not place DB HASH ' + old.transactionHash + ' != SCANNED HASH ' + transaction.transactionHash, old, transaction)
        return { isChanged: 0, tmpMsg: ` DROPPED SCANNED ${transaction.transactionHash} DB ${old.transactionHash}` }
    }


    let oldAmount = old.addressAmount.toString()
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

        if (old.transactionStatus !== transaction.transactionStatus || !old.createdAt) {
            tmpMsg = ` TWALLET UPDATE ${account.currencyCode} HASH ${transaction.transactionHash} by STATUS NEW ${transaction.transactionStatus} OLD ${old.transactionStatus} AMOUNT ${transaction.addressAmount} FROM ${transaction.addressFrom} TO ${transaction.addressTo}`
        } else if (!old.transactionFee && old.transactionFee !== transaction.transactionFee) {
            tmpMsg = ` TWALLET UPDATE ${account.currencyCode} HASH ${transaction.transactionHash} by FEE ${transaction.transactionFee} AMOUNT ${transaction.addressAmount} FROM ${transaction.addressFrom} TO ${transaction.addressTo}`
        } else if (!old.addressAmount || old.addressAmount * 1 !== transaction.addressAmount * 1) {
            tmpMsg = ` TWALLET UPDATE ${account.currencyCode} HASH ${transaction.transactionHash} by AMOUNT NEW ${transaction.addressAmount} OLD ${old.addressAmount} FROM ${transaction.addressFrom} TO ${transaction.addressTo}`
        } else if (old.blockConfirmations === transaction.blockConfirmations || (old.blockConfirmations > blocksToUpdate && transaction.blockConfirmations > blocksToUpdate)) {
            tmpMsg = ` TWALLET SKIP ${account.currencyCode} HASH ${transaction.transactionHash} CONF ${transaction.blockConfirmations} OLD CONF ${old.blockConfirmations} STATUS ${old.transactionStatus}`
            return { isChanged: 0, tmpMsg }
        } else {
            tmpMsg = ` TWALLET UPDATE ${account.currencyCode} HASH ${transaction.transactionHash} by CONF NEW ${transaction.blockConfirmations} OLD ${old.blockConfirmations} STATUS ${transaction.transactionStatus} AMOUNT ${transaction.addressAmount} FROM ${transaction.addressFrom} TO ${transaction.addressTo}`
        }

        if (!old.transactionFee && transaction.transactionFee) {
            tmpMsg += ' PLUS FEE ' + transaction.transactionFee
            transactionPart.transactionFee = transaction.transactionFee
            transactionPart.transactionFeeCurrencyCode = transaction.transactionFeeCurrencyCode || ''
        }
        if (!old.createdAt) {
            transactionPart.createdAt = transaction.blockTime
        }
        transactionPart.transactionsScanTime = Math.round(new Date().getTime() / 1000)
        transactionPart.transactionsScanLog = line + ' ' + tmpMsg
        if (old && old.transactionsScanLog) {
            transactionPart.transactionsScanLog += ' ' + old.transactionsScanLog
        }
        transactionPart.transactionDirection = transaction.transactionDirection
        await transactionDS.saveTransaction(transactionPart, old.id)
        Log.daemon('UpdateAccountTransactions old 1', tmpMsg, transactionPart)

        if (old.transactionStatus !== transaction.transactionStatus && source !== 'FIRST' && transaction.addressAmount > 0) {
            await addNews(transaction, account, source)
        }
        return { isChanged: 1, tmpMsg }
    }

    if (old.transactionStatus !== transaction.transactionStatus || !old.createdAt) {
        tmpMsg = ` FULL UPDATE ${account.currencyCode} HASH ${transaction.transactionHash} by STATUS NEW ${transaction.transactionStatus} OLD ${old.transactionStatus} AMOUNT ${transaction.addressAmount} FROM ${transaction.addressFrom} TO ${transaction.addressTo}`
    } else if (oldAmount !== newAmount) {
        tmpMsg = ` FULL UPDATE ${account.currencyCode} HASH ${transaction.transactionHash} by AMOUNT NEW ${newAmount} OLD ${oldAmount} AMOUNT ${transaction.addressAmount} FROM ${transaction.addressFrom} TO ${transaction.addressTo}`
    } else if (oldAddressTo !== newAddressTo) {
        tmpMsg = ` FULL UPDATE ${account.currencyCode} HASH ${transaction.transactionHash} by ADDRESS_TO ${newAddressTo} OLD ${oldAddressTo} AMOUNT ${transaction.addressAmount} FROM ${transaction.addressFrom} TO ${transaction.addressTo}`
    } else if (old.addressFrom !== transaction.addressFrom) {
        tmpMsg = ` FULL UPDATE ${account.currencyCode} HASH ${transaction.transactionHash} by ADDRESS_FROM ${transaction.addressFrom} OLD ${old.addressFrom} AMOUNT ${transaction.addressAmount} FROM ${transaction.addressFrom} TO ${transaction.addressTo}`
    } else if (old.blockConfirmations === transaction.blockConfirmations || (old.blockConfirmations > blocksToUpdate && transaction.blockConfirmations > blocksToUpdate)) {
        tmpMsg = ` SKIP ${account.currencyCode} HASH ${transaction.transactionHash} CONF ${transaction.blockConfirmations} OLD CONF ${old.blockConfirmations} STATUS ${old.transactionStatus}`
        Log.daemon('UpdateAccountTransactions skip 3 ' + transaction.transactionHash)
        return { isChanged: 0, tmpMsg }
    } else {
        tmpMsg = ` FULL UPDATE ${account.currencyCode} HASH ${transaction.transactionHash} by CONF NEW ${transaction.blockConfirmations} OLD ${old.blockConfirmations} STATUS ${transaction.transactionStatus} AMOUNT ${transaction.addressAmount} FROM ${transaction.addressFrom} TO ${transaction.addressTo}`
    }

    if (!old.createdAt) {
        transaction.createdAt = transaction.blockTime
    }
    transaction.transactionsScanTime = Math.round(new Date().getTime() / 1000)
    transaction.transactionsScanLog = line + ' ' + tmpMsg + ' '
    if (old && old.transactionsScanLog) {
        transaction.transactionsScanLog += ' ' + old.transactionsScanLog
    }
    await transactionDS.saveTransaction(transaction, old.id)
    Log.daemon('UpdateAccountTransactions update 2', tmpMsg, transaction)
    return { isChanged: 1, tmpMsg }
}

async function addNews(transaction, account, source) {
    let needToPopup = 1
    if (transaction.transactionStatus === 'confirming') {
        needToPopup = 0
    } else if (transaction.transactionStatus === 'delegated') {
        needToPopup = 0
    }
    let name = 'FOUND_OUT_TX_STATUS_' + transaction.transactionStatus.toUpperCase()
    if (transaction.transactionDirection === 'income') {
        name = 'FOUND_IN_TX'
    }
    await appNewsDS.saveAppNews(
        {
            walletHash: account.walletHash,
            currencyCode: account.currencyCode,
            newsSource: source,
            newsNeedPopup: needToPopup,
            newsGroup: 'TX_SCANNER',
            newsName: name,
            newsJson: transaction
        }
    )
}
