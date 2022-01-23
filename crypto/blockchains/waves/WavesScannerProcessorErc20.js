/**
 * @version 0.5
 */
import BlocksoftCryptoLog from '@crypto/common/BlocksoftCryptoLog'
import BlocksoftAxios from '@crypto/common/BlocksoftAxios'
import BlocksoftExternalSettings from '@crypto/common/BlocksoftExternalSettings'
import WavesScannerProcessor from '@crypto/blockchains/waves/WavesScannerProcessor'
import TransactionFilterTypeDict from '@appV2/dicts/transactionFilterTypeDict'
import BlocksoftUtils from '@crypto/common/BlocksoftUtils'

export default class WavesScannerProcessorErc20 extends WavesScannerProcessor {

    constructor(settings) {
        super(settings)
        this._tokenAddress = settings.tokenAddress
    }

    /**
     * https://nodes.wavesnodes.com/api-docs/index.html#/assets/getAssetBalanceByAddress
     * https://nodes.wavesnodes.com/assets/balance/3PGixfWP1pcuWwND2rDLf2n94J7egSf4uz4/DG2xFkPdDwKUoBkzGAhQtLpSGzfXLiCYPEzeKH2Ad24p
     * @return {Promise<{balance, provider}>}
     */
    async getBalanceBlockchain(address) {

        if (this._mainCurrencyCode === 'ASH') {
            this._apiPath = await BlocksoftExternalSettings.get('ASH_SERVER')
        } else {
            this._apiPath = await BlocksoftExternalSettings.get('WAVES_SERVER')
        }
        address = address.trim()
        BlocksoftCryptoLog.log(this._settings.currencyCode + ' WavesScannerProcessorErc20 getBalanceBlockchain address ' + address)

        const link = this._apiPath + '/assets/balance/' + address + '/' + this._tokenAddress
        const res = await BlocksoftAxios.get(link)
        if (!res) {
            return false
        }
        try {
            return { balance: res.data.balance, unconfirmed: 0, provider: 'wavesnodes.com' }
        } catch (e) {
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' WavesProcessorErc20 getBalanceBlockchain address ' + address + ' balance ' + JSON.stringify(res) + ' to hex error ' + e.message)
        }
        return false
    }

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
        let addressAmount = transaction.amount
        const transactionFee = transaction.feeAsset && transaction.feeAssetId ? 0 : transaction.fee

        let transactionDirection = false
        let transactionFilterType = TransactionFilterTypeDict.USUAL

        if (typeof transaction.order1 !== 'undefined') {
            if (transaction.order1.assetPair.priceAsset !== this._tokenAddress) {
                return false
            }
            if (transaction.order2.amount === addressAmount) {
                transactionDirection = 'swap_income'
                addressAmount = transaction.order2.amount * transaction.order1.price
            } else {
                transactionDirection = 'swap_outcome'
                addressAmount = transaction.order1.amount * transaction.order2.price
            }
            transactionFilterType = TransactionFilterTypeDict.SWAP
            addressAmount = BlocksoftUtils.fromUnified(BlocksoftUtils.toUnified(addressAmount, 14), this._settings.decimals)
        } else if (transaction.assetId === this._tokenAddress) {
            transactionDirection = 'self'
            if (addressFrom === address) {
                if (addressTo !== address) {
                    transactionDirection = 'outcome'
                }
            } else if (addressTo === address) {
                transactionDirection = 'income'
            }
        } else {
            return false
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
