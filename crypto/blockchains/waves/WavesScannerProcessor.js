/**
 * @version 0.5
 */
import BlocksoftCryptoLog from '../../common/BlocksoftCryptoLog'
import BlocksoftAxios from '@crypto/common/BlocksoftAxios'

const API_PATH = 'https://nodes.wavesnodes.com'
export default class WavesScannerProcessor {

    constructor(settings) {
        this._settings = settings
    }

    /**
     * https://nodes.wavesnodes.com/addresses/balance/details/3P274YB5qseSE9DTTL3bpSjosZrYBPDpJ8k
     * https://nodes.wavesnodes.com/api-docs/index.html#/addresses/getWavesBalances
     * https://docs.waves.tech/en/blockchain/account/account-balance#account-balance-in-waves
     * @return {Promise<{balance, provider}>}
     */
    async getBalanceBlockchain(address) {
        address = address.trim()
        BlocksoftCryptoLog.log(this._settings.currencyCode + ' WavesScannerProcessor getBalanceBlockchain address ' + address)

        const link = API_PATH + '/addresses/balance/details/' + address
        const res = await BlocksoftAxios.get(link)
        if (!res) {
            return false
        }
        try {
            return { balance: res.data.available, unconfirmed: 0, provider: 'wavesnodes.com' }
        } catch (e) {
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' WavesProcessor getBalanceBlockchain address ' + address + ' balance ' + JSON.stringify(res) + ' to hex error ' + e.message)
        }
        return false
    }

    /**
     * https://nodes.wavesnodes.com/transactions/address/3P274YB5qseSE9DTTL3bpSjosZrYBPDpJ8k/limit/100
     * @param  {string} scanData.account.address
     * @return {Promise<[UnifiedTransaction]>}
     */
    async getTransactionsBlockchain(scanData, source) {
        const address = scanData.account.address.trim()
        const link = API_PATH + '/transactions/address/' + address + '/limit/100'
        const res = await BlocksoftAxios.get(link)
        if (!res || !res.data || typeof res.data[0] === 'undefined') {
            return false
        }
        const transactions = []
        for (const tx of res.data[0]) {
            const transaction = await this._unifyTransaction(address, tx)
            if (transaction) {
                transactions.push(transaction)
            }
        }
        return transactions
    }

    /**
     * @param address
     * @param transaction.amount 100000000
     * @param transaction.applicationStatus succeeded
     * @param transaction.assetId null
     * @param transaction.attachment
     * @param transaction.fee 100000
     * @param transaction.feeAsset
     * @param transaction.feeAssetId
     * @param transaction.height 2715839
     * @param transaction.id GxnhfderDpMwdrSfWbTN53NGB1Q2NRQXcGvYdXbzQBXo
     * @param transaction.recipient 3PQQUuGM1Fo8zz72i62dNYkB5kRxqmJkoSu
     * @param transaction.sender 3PLPGmXoDNKeWxSgJRU5vDNogbPj7hJiWQx
     * @param transaction.senderPublicKey GP9hPWAiGDfNYyCTNw6ZWoLCzUqWiYj7MybtPcu8mpkg
     * @param transaction.signature 4FewzMCYLvfQridUZtSFrDXRbDvmawUWtBxWdiEE5CeruG1qfbKbfTkudGyW6Eqs3kW4hTpABQxrhBSBuKV7uHFa
     * @param transaction.timestamp 1628523063656
     * @param transaction.type 4
     * @param transaction.version 1
     *
     * @returns {Promise<boolean>}
     * @private
     */
    async _unifyTransaction(address, transaction) {
        let transactionStatus = 'confirming'
        if (transaction.applicationStatus === 'succeeded') {
            transactionStatus = 'success'
        } else if (transaction.applicationStatus === 'script_execution_failed') {
            transactionStatus = 'fail'
        }
        let formattedTime = transaction.timestamp
        const blockConfirmations = Math.round((new Date().getTime() - transaction.timestamp) / 6000)
        try {
            formattedTime = new Date(transaction.timestamp).toISOString()
        } catch (e) {
            e.message += ' timestamp error transaction2 data ' + JSON.stringify(transaction)
            throw e
        }
        const addressFrom = transaction.sender
        const addressTo = transaction.recipient
        const addressAmount = transaction.amount
        const transactionFee = transaction.feeAsset && transaction.feeAssetId ? 0 : transaction.fee
        if (transaction.assetId) {
            return false
        }
        return {
            transactionHash: transaction.id,
            blockHash: transaction.height,
            blockNumber: transaction.height,
            blockTime: formattedTime,
            blockConfirmations,
            transactionDirection: addressFrom === address ? 'outcome' : 'income',
            addressFrom: addressFrom === address ? '' : addressFrom,
            addressFromBasic: addressFrom,
            addressTo: addressTo === address ? '' : addressTo,
            addressToBasic: addressTo,
            addressAmount,
            transactionStatus,
            transactionFee
        }
    }
}
