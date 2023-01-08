/**
 * @version 0.5
 */
import BlocksoftCryptoLog from '../../common/BlocksoftCryptoLog'
import BlocksoftAxios from '@crypto/common/BlocksoftAxios'
import BlocksoftExternalSettings from '@crypto/common/BlocksoftExternalSettings'
import TransactionFilterTypeDict from '@appV2/dicts/transactionFilterTypeDict'
import WavesTransactionsProvider from '@crypto/blockchains/waves/providers/WavesTransactionsProvider'

export default class WavesScannerProcessor {

    constructor(settings) {
        this._settings = settings
        this._provider = new WavesTransactionsProvider()
        this._mainCurrencyCode = 'WAVES'
        if (this._settings.currencyCode === 'ASH' || this._settings.currencyCode.indexOf('ASH_') === 0) {
            this._mainCurrencyCode = 'ASH'
        }
    }

    /**
     * https://nodes.wavesnodes.com/addresses/balance/details/3P274YB5qseSE9DTTL3bpSjosZrYBPDpJ8k
     * https://nodes.wavesnodes.com/api-docs/index.html#/addresses/getWavesBalances
     * https://docs.waves.tech/en/blockchain/account/account-balance#account-balance-in-waves
     * @return {Promise<{balance, provider}>}
     */
    async getBalanceBlockchain(address) {
        if (this._mainCurrencyCode == 'ASH') {
            this._apiPath = await BlocksoftExternalSettings.get('ASH_SERVER')
        } else {
            this._apiPath = await BlocksoftExternalSettings.get('WAVES_SERVER')
        }
        address = address.trim()
        BlocksoftCryptoLog.log(this._settings.currencyCode + ' WavesScannerProcessor getBalanceBlockchain address ' + address)

        const link = this._apiPath + '/addresses/balance/details/' + address
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
        const data = await this._provider.get(address, this._mainCurrencyCode)
        const transactions = []
        for (const tx of data) {
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
        const addressTo = transaction.recipient || address

        let transactionFilterType = TransactionFilterTypeDict.USUAL
        let transactionDirection = 'self'
        if (addressFrom === address) {
            if (addressTo !== address) {
                transactionDirection = 'outcome'
            }
        } else if (addressTo === address) {
            transactionDirection = 'income'
        }

        let addressAmount = 0
        if (typeof transaction.transfers !== 'undefined') {
            for (const transfer of transaction.transfers) {
                if (transfer.recipient === address && transfer.amount*1>0) {
                    addressAmount = addressAmount + transfer.amount*1
                    transactionDirection = 'income'
                }
            }
        }
        if (addressAmount === 0 && typeof transaction.amount !== 'undefined'){
            addressAmount = transaction.amount
        }

        const transactionFee = transaction.feeAsset && transaction.feeAssetId ? 0 : transaction.fee
        if (transaction.assetId) {
            return false
        }

        if (typeof transaction.order1 !== 'undefined') {
            if (transaction.order2.amount === addressAmount) {
                transactionDirection = 'swap_outcome'
            } else {
                transactionDirection = 'swap_income'
            }
            transactionFilterType = TransactionFilterTypeDict.SWAP
        }

        const tmp = {
            transactionHash: transaction.id,
            blockHash: transaction.height,
            blockNumber: transaction.height,
            blockTime: formattedTime,
            blockConfirmations,
            transactionDirection,
            transactionFilterType,
            addressFrom: addressFrom === address ? '' : addressFrom,
            addressFromBasic: addressFrom,
            addressTo: addressTo === address ? '' : addressTo,
            addressToBasic: addressTo,
            addressAmount,
            transactionStatus,
            transactionFee
        }
        return tmp
    }
}
