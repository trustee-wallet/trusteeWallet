/**
 * @version 0.11
 */
import BlocksoftCryptoLog from '../../common/BlocksoftCryptoLog'
import EthScannerProcessorErc20 from './EthScannerProcessorErc20'
import BlocksoftAxios from '../../common/BlocksoftAxios'
import BlocksoftUtils from '../../common/BlocksoftUtils'
import DBInterface from '../../../app/appstores/DataSource/DB/DBInterface'
const TXS_PATH = 'https://api.xreserve.fund/delegated-transactions?address='

async function replaceTx(old, txid, notReplacing) {

    const now = new Date().toISOString()
    const dbInterface = new DBInterface()

    let oldTx = false
    let oldJson = false
    if (typeof notReplacing[old] !== 'undefined') {
        oldTx = notReplacing[old]
        try {
            oldJson = JSON.parse(dbInterface.unEscapeString(oldTx.transactionJson))
        } catch (e) {

        }
    }

    if (typeof notReplacing[txid] === 'undefined') {
        if (oldTx) {
            // hidden_at need to set!
            BlocksoftCryptoLog.log('EthUAXScannerProcessor.getTransactions checked kuna already replacing in db ' + old + ' actual ' + txid + ' but need to hide old')
            await dbInterface.setQueryString(`UPDATE transactions SET hidden_at = '${now}' WHERE LOWER(transaction_hash)=LOWER('${old}') AND currency_code='ETH_UAX'`).query()
        } else {
            BlocksoftCryptoLog.log('EthUAXScannerProcessor.getTransactions checked kuna already replacing in db ' + old + ' actual ' + txid + ' and old is hidden')
        }
        return false
    }


    let newJson = false
    try {
        newJson = JSON.parse(dbInterface.unEscapeString(notReplacing[txid].transactionJson))
    } catch (e) {

    }


    if (!newJson) {
        newJson = {}
    }
    if (oldJson) {
        if (typeof oldJson.memo !== 'undefined') {
            if (typeof newJson.memo !== 'undefined') {
                if (newJson.memo) {
                    newJson.memo += ' ' + oldJson.memo
                }
            } else {
                newJson.memo = oldJson.memo
            }
        }
        if (typeof oldJson.comment !== 'undefined') {
            if (typeof newJson.comment !== 'undefined') {
                if (oldJson.comment) {
                    newJson.comment += ' ' + oldJson.comment
                }
            } else {
                newJson.comment = oldJson.comment
            }
        }
        if (typeof oldJson.delegatedNonce !== 'undefined') {
            newJson.delegatedNonce = oldJson.delegatedNonce
        }
        if (typeof oldJson.nonce !== 'undefined') {
            newJson.nonce = oldJson.nonce
        }
    }

    let updateSql
    if (oldTx) {
        updateSql = `UPDATE transactions 
                     SET 
                     transaction_of_trustee_wallet=${oldTx.transactionOfTrusteeWallet}, 
                     transaction_json='${dbInterface.escapeString(JSON.stringify(newJson))}',
                     transactions_other_hashes='${old}',
                     created_at ='${oldTx.createdAt}'
                     WHERE LOWER(transaction_hash)=LOWER('${txid}') AND currency_code='ETH_UAX'`
    } else {
        updateSql = `UPDATE transactions 
                     SET transactions_other_hashes='${old}' 
                     WHERE LOWER(transaction_hash)=LOWER('${txid}') AND currency_code='ETH_UAX'`
    }
    await dbInterface.setQueryString(updateSql).query()
    BlocksoftCryptoLog.log('EthUAXScannerProcessor.getTransactions put kuna update in db ' + old + ' actual ' + txid, updateSql)
    await dbInterface.setQueryString(`UPDATE transactions SET hidden_at = '${now}' WHERE LOWER(transaction_hash)=LOWER('${old}') AND currency_code='ETH_UAX'`).query()
    BlocksoftCryptoLog.log('EthUAXScannerProcessor.getTransactions put kuna dropped in db ' + old + ' actual ' + txid)

}

export default class EthScannerProcessorUAX extends EthScannerProcessorErc20 {
    async getTransactionsBlockchain(address) {
        BlocksoftCryptoLog.log('EthUAXScannerProcessor.getTransactions started ' + address)

        const txsBasic = await super.getTransactionsBlockchain(address)
        const link = TXS_PATH + address
        const txs = await BlocksoftAxios.getWithoutBraking(link)
        if (!txs || typeof txs.data === 'undefined' || txs.data.length === 0) {
            return txsBasic
        }

        // BlocksoftCryptoLog.log('txs', JSON.parse(JSON.stringify(txs.data)))

        const dbInterface = new DBInterface()

        const delegatedByNonces = {}
        let sql = `SELECT tmp_sub_key, tmp_val FROM transactions_scanners_tmp 
            WHERE currency_code='ETH_UAX' 
            AND address='${address}'
            AND tmp_key='nonce'`
        let saved = await dbInterface.setQueryString(sql).query()
        if (saved && saved.array && saved.array.length > 0) {
            let tmp
            for (tmp of saved.array) {
                delegatedByNonces[tmp.tmp_sub_key * 1] = tmp.tmp_val.toLowerCase()
            }
        }

        const notReplacing = {}
        sql = `SELECT id, transaction_hash AS transactionHash, 
                transaction_of_trustee_wallet AS transactionOfTrusteeWallet,
                transaction_json AS transactionJson,
                created_at AS createdAt
                FROM transactions WHERE currency_code='ETH_UAX'
                AND (transactions_other_hashes IS NULL OR transactions_other_hashes = '')
                AND hidden_at IS NULL`
        saved = await dbInterface.setQueryString(sql).query()
        if (saved && saved.array && saved.array.length > 0) {
            let tmp
            for (tmp of saved.array) {
                notReplacing[tmp.transactionHash.toLowerCase()] = tmp
            }
        }

        // BlocksoftCryptoLog.log('txsBasic', txsBasic)
        // BlocksoftCryptoLog.log('txsKuna', txs.data)
        // BlocksoftCryptoLog.log('noncesKuna', delegatedByNonces)
        // BlocksoftCryptoLog.log('notReplacing', notReplacing)


        const txBasicIndexed = {}
        let key, tmp
        if (txsBasic && txsBasic.length > 0) {
            for (key in txsBasic) {
                tmp = txsBasic[key]
                txBasicIndexed[tmp.transactionHash.toLowerCase()] = key
            }
        }

        const newTxBasic = JSON.parse(JSON.stringify(txsBasic))

        for (tmp of txs.data) {
            const txid = tmp.txid.toLowerCase()
            if (typeof delegatedByNonces[tmp.nonce] !== 'undefined') {
                const old = delegatedByNonces[tmp.nonce].toLowerCase()
                if (old !== txid) {
                    BlocksoftCryptoLog.log('EthUAXScannerProcessor.getTransactions checked kuna not ok nonce ' + tmp.nonce + ' in db ' + old + ' actual ' + txid, {
                        old: notReplacing[old],
                        txid: notReplacing[txid]
                    })
                    await replaceTx(old, txid, notReplacing)
                } else {
                    BlocksoftCryptoLog.log('EthUAXScannerProcessor.getTransactions checked kuna ok nonce ' + tmp.nonce + ' in db ' + old + ' actual ' + txid)
                }
            }


            if (typeof txBasicIndexed[txid] !== 'undefined') {
                const index = txBasicIndexed[txid]
                newTxBasic[index].transactionJson.delegatedNonce = tmp.nonce
                // do nothing - found in blockchain one from kuna
                BlocksoftCryptoLog.log('EthUAXScannerProcessor.getTransactions put kuna nonce ' + tmp.nonce + ' inside ethescan tx ' + txid)
            } else {
                let formattedTime = tmp.createdAt
                try {
                    formattedTime = BlocksoftUtils.toDate(tmp.createdAt)
                } catch (e) {
                    e.message += ' timestamp error UAX transaction data ' + JSON.stringify(tmp)
                    throw e
                }
                tmp.delegatedNonce = tmp.nonce
                const prepared = {
                    transactionHash: tmp.txid,
                    blockHash: '',
                    blockNumber: 0,
                    blockTime: formattedTime,
                    blockConfirmations: '',
                    transactionDirection: tmp.to.toLowerCase() === address.toLowerCase() ? 'income' : 'outcome',
                    addressFrom: tmp.from.toLowerCase() === address.toLowerCase() ? '' : tmp.from,
                    addressTo: tmp.to.toLowerCase() === address.toLowerCase() ? '' : tmp.to,
                    addressAmount: tmp.value,
                    transactionStatus: 'confirming',
                    transactionFee: tmp.fee,
                    transactionFeeCurrencyCode: 'ETH_UAX',
                    contractAddress: '',
                    inputValue: '',
                    transactionJson: tmp
                }
                if (tmp.status === 'pending') {
                    prepared.transactionStatus = 'delegated'
                } else if (tmp.status === 'rejected') {
                    prepared.transactionStatus = 'fail'
                }
                newTxBasic.push(prepared)
                BlocksoftCryptoLog.log('EthUAXScannerProcessor.getTransactions put kuna tx ' + txid + ' as not found in etherscan')
            }
        }
        return newTxBasic
    }
}
