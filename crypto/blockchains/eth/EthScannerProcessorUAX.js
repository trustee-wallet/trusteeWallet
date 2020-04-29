/**
 * @version 0.5
 */
import BlocksoftCryptoLog from '../../common/BlocksoftCryptoLog'
import EthScannerProcessorErc20 from './EthScannerProcessorErc20'
import BlocksoftAxios from '../../common/BlocksoftAxios'
import BlocksoftUtils from '../../common/BlocksoftUtils'

const TXS_PATH = 'https://api.xreserve.fund/delegated-transactions?address='

export default class EthScannerProcessorUAX extends EthScannerProcessorErc20 {
    async getTransactionsBlockchain(address) {
        BlocksoftCryptoLog.log('EthUAXScannerProcessor.getTransactions started ' + address)

        const txsBasic = await super.getTransactionsBlockchain(address)

        const link = TXS_PATH + address
        const txs = await BlocksoftAxios.getWithoutBraking(link)

        if (!txs || typeof txs.data === 'undefined' || txs.data.length === 0) {
            return txsBasic
        }

        const txBasicIndexed = {}
        let tmp
        if (txsBasic && txsBasic.length > 0) {
            for (tmp of txsBasic) {
                txBasicIndexed[tmp.transactionHash.toLowerCase()] = tmp
            }
        }

        for (tmp of txs.data) {
            if (typeof txBasicIndexed[tmp.txid.toLowerCase()] !== 'undefined') {
                // do nothing
            } else {
                let formattedTime =  tmp.createdAt
                try {
                    formattedTime = BlocksoftUtils.toDate(tmp.createdAt)
                } catch (e) {
                    e.message += ' timestamp error UAX transaction data ' + JSON.stringify(tmp)
                    throw e
                }
                const prepared =   {
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
                txsBasic.push(prepared)
            }
        }
        return txsBasic
    }
}
