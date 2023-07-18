/**
 * @version 0.5
 * https://github.com/tronscan/tronscan-frontend/wiki/TRONSCAN-API
 */
import TrxTransactionsProvider from './TrxTransactionsProvider'
import BlocksoftUtils from '../../../common/BlocksoftUtils'
import BlocksoftCryptoLog from '../../../common/BlocksoftCryptoLog'
import BlocksoftAxios from '@crypto/common/BlocksoftAxios'
import Database from '@app/appstores/DataSource/Database/main'
import TransactionFilterTypeDict from '@appV2/dicts/transactionFilterTypeDict'

const SWAPS = require('../dict/swaps')
export default class TrxTransactionsTrc20Provider extends TrxTransactionsProvider {
    _token = false

    setLink(token) {
        this._token = token
        this._tronscanLink = 'https://apilist.tronscan.org/api/contract/events?sort=-timestamp&count=true&limit=50&contract=' + token + '&address='
    }

    /**
     * @param {string} scanData.account.address
     * @param {Object} transaction
     * @param {string} transaction.amount 1000000
     * @param {string} transaction.transferFromAddress 'TUbHxAdhPk9ykkc7SDP5e9zUBEN14K65wk'
     * @param {string} transaction.data ''
     * @param {string} transaction.decimals 6
     * @param {string} transaction.tokenName 'Tether USD'
     * @param {string} transaction.transferToAddress 'TUoyiQH9wSfYdJRhsXtgmgDvpWipPrQN8a'
     * @param {string} transaction.block 15847100
     * @param {string} transaction.id ''
     * @param {string} transaction.confirmed true
     * @param {string} transaction.transactionHash '4999b0965c1a5b17cbaa862b9357a32c9b8d096e170f4eecee929159b0b73ad3'
     * @param {string} transaction.timestamp: 1577796345000
     * @return {UnifiedTransaction}
     * @private
     */
    async _unifyTransaction(scanData, transaction) {
        const address = scanData.account.address.trim()
        let transactionStatus = 'new'
        if (transaction.confirmed) {
            transactionStatus = 'success'
        } else if (transaction.block > 0) {
            transactionStatus = 'fail'
        }

        let txTokenName = false
        let formattedTime
        try {
            formattedTime = BlocksoftUtils.toDate(transaction.timestamp / 1000)
        } catch (e) {
            e.message += ' timestamp error transaction data ' + JSON.stringify(transaction)
            throw e
        }
        if (typeof transaction.amount === 'undefined') {
            // noinspection ES6MissingAwait
            BlocksoftCryptoLog.err('TrxTransactionsTrc20Provider._unifyTransaction buggy tx ' + JSON.stringify(transaction))
        }

        const res = {
            transactionHash: transaction.transactionHash,
            blockHash: '',
            blockNumber: transaction.block,
            blockTime: formattedTime,
            blockConfirmations: this._lastBlock - transaction.block,
            transactionDirection: (address.toLowerCase() === transaction.transferFromAddress.toLowerCase()) ? 'outcome' : 'income',
            addressFrom: (address.toLowerCase() === transaction.transferFromAddress.toLowerCase()) ? '' : transaction.transferFromAddress,
            addressTo: (address.toLowerCase() === transaction.transferToAddress.toLowerCase()) ? '' : transaction.transferToAddress,
            addressAmount: typeof transaction.amount !== 'undefined' ? transaction.amount.toString() : '0',
            transactionStatus: transactionStatus,
            transactionFee: 0,
            inputValue: transaction.data
        }

        let needData = false
        if (res.addressAmount.indexOf('115792089237316195423570985008687907853269984665640564039457') === 0) {
            res.addressAmount = '0'
            needData = true
        }
        if (typeof SWAPS[res.addressTo] !== 'undefined') {
            res.addressTo = SWAPS[res.addressTo]
            res.transactionDirection = 'swap_outcome'
            res.addressAmount = '0'
            needData = true
        } else if (typeof SWAPS[res.addressFrom] !== 'undefined') {
            res.addressFrom = SWAPS[res.addressFrom]
            res.transactionDirection = 'swap_income'
            res.addressAmount = '0'
            needData = true
        } else if (res.transactionDirection === 'outcome') {
            needData = true
        }



        if (needData) {
            const diff = scanData.account.transactionsScanTime - transaction.timestamp / 1000
            if (diff > 60000) {
                return false
            }
        }


        if (needData) {
            const tmp = await BlocksoftAxios.get('https://apilist.tronscan.org/api/transaction-info?hash=' + res.transactionHash)
            res.transactionFee = tmp.data.cost.fee * 1 + tmp.data.cost.energy_fee * 1

            const isMine = address.toLowerCase() === tmp.data.ownerAddress.toLowerCase()
            if (res.transactionFee * 1 > 0 && isMine) {
                const savedTRX = await Database.query(` SELECT * FROM transactions WHERE transaction_hash='${res.transactionHash}' AND currency_code='TRX' `)
                if (!savedTRX || !savedTRX.array || savedTRX.array.length === 0) {
                    BlocksoftCryptoLog.log('TrxTransactionsTrc20Provider._unifyTransaction added fee for ' + res.transactionHash + ' amount ' + res.addressAmount + ' fee ' + res.transactionFee)
                    const saveFee = {
                        'account_id': 0,
                        'address_amount': 0,
                        'address_from': res.addressFrom,
                        'address_to': res.addressTo,
                        'block_confirmations': res.blockConfirmations,
                        'block_number': res.blockNumber,
                        'block_time': res.blockTime,
                        'created_at': res.blockTime,
                        'currency_code': 'TRX',
                        'mined_at': res.blockTime,
                        'transaction_direction': res.transactionDirection,
                        'transaction_fee': res.transactionFee,
                        'transaction_filter_type': TransactionFilterTypeDict.FEE,
                        'transaction_hash': res.transactionHash,
                        'transaction_status': res.transactionStatus,
                        'transactions_scan_time': new Date().getTime(),
                        'wallet_hash': scanData.account.walletHash
                    }
                    await Database.setTableName('transactions').setInsertData({ insertObjs: [saveFee] }).insert()
                }
            }
            if (typeof tmp.data.trc20TransferInfo !== 'undefined') {
                for (const info of tmp.data.trc20TransferInfo) {
                    if (info.contract_address !== this._token) continue
                    if (info.from_address === address) {
                        if (info.to_address === address) {
                            res.transactionDirection = 'self'
                        } else {
                            res.transactionDirection = 'outcome'
                        }
                    } else if (info.to_address === address) {
                        res.transactionDirection = 'income'
                        res.addressAmount = info.amount_str
                    } else {
                        continue
                    }
                }
            }
            if (res.addressAmount * 1 === 0) {
				if (res.transactionFee * 1 === 0) {
					return false
				} else {
					if (res.transactionDirection !== 'outcome' || !isMine) {
						return false
					}
				}
            }
        } else if (res.addressAmount * 1 === 0) {
            return false
        }

        return { res, txTokenName }
    }
}
