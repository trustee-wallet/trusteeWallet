/**
 * @version 0.5
 */
import BlocksoftCryptoLog from '../../common/BlocksoftCryptoLog'
import BlocksoftAxios from '../../common/BlocksoftAxios'
import BlocksoftUtils from '../../common/BlocksoftUtils'
import DogeFindAddressFunction from '../doge/basic/DogeFindAddressFunction'

const API_PATH = 'https://testnet.blockexplorer.com/api/addr/'
const API_TX_PATH = 'https://testnet.blockexplorer.com/api/txs/?address='

export default class BtcTestScannerProcessor {

    /**
     * @type {number}
     * @private
     */
    _blocksToConfirm = 5

    /**
     * https://testnet.blockexplorer.com/api/addr/mrEZPSepSrV2DveXpXnAyBMugUvUBhNiJS
     * @param {string} address
     * @return {Promise<{int:balance, int:provider}>}
     */
    async getBalance(address) {
        BlocksoftCryptoLog.log('BtcTestScannerProcessor.getBalance started', address)
        let link = API_PATH + address
        let res = await BlocksoftAxios.getWithoutBraking(link)
        if (!res || !res.data || typeof(res.data.balanceSat) === 'undefined') {
            return {balance : 0, unconfirmed: 0, provider: 'blockexplorer.com' }
        }
        return {balance: res.data.balanceSat, unconfirmed: res.data.unconfirmedBalanceSat, provider: 'blockexplorer.com' }
    }

    /**
     * https://testnet.blockexplorer.com/api/txs/?address=mn5hqUL6kXUV4yocWxfJh9JGBv7mT3MgJe
     * @param {string} address
     * @param {*} jsonData
     * @return {Promise<UnifiedTransaction[]>}
     */
    async getTransactions(address, jsonData = {}) {
        BlocksoftCryptoLog.log('BtcTestScannerProcessor.getTransactions started ', address)
        let link = API_TX_PATH + address
        let tmp = await BlocksoftAxios.getWithoutBraking(link)
        if (!tmp || typeof tmp.data === 'undefined' || !tmp.data || typeof tmp.data.txs === 'undefined') {
            return []
        }
        let transactions = []
        for (let tx of tmp.data.txs) {
            let transaction = await  this._unifyTransaction(address, tx)
            transactions.push(transaction)
        }
        BlocksoftCryptoLog.log('BtcTestScannerProcessor.getTransactions finished', address + ' total: ' + transactions.length)
        return transactions
    }

    /**
     * @param {string} address
     * @param {string} legacyAddress
     * @param {string} transaction.txid '5be83026d82b56e8df7fa309e0b50132cb5cac228f83103532b20e0c991a3f9b'
     * @param {string} transaction.version 1
     * @param {string} transaction.locktime 0
     * @param {string} transaction.vin[].txid 'edb7ff5921e396528005bc330abb97de8bcdf8d1e4e3d1b6b2caaf05d2938b4f'
     * @param {string} transaction.vin[].vout 1
     * @param {string} transaction.vin[].sequence 4294967294
     * @param {string} transaction.vin[].n 0
     * @param {string} transaction.vin[].scriptSig.hex
     * @param {string} transaction.vin[].scriptSig.asm
     * @param {string} transaction.vin[].addr '1HQzoxQsbjm44hc9rcJyX9KVmNAsyWyswB'
     * @param {string} transaction.vin[].valueSat 4462902
     * @param {string} transaction.vin[].value 0.04462902
     * @param {string} transaction.vin[].doubleSpentTxID null
     * @param {string} transaction.vout[].value '0.00066989'
     * @param {string} transaction.vout[].n 0
     * @param {string} transaction.vout[].scriptPubKey.hex '76a914b553a4d94bcb4692665e4b620e93ebeb84dc366488ac'
     * @param {string} transaction.vout[].scriptPubKey.asm 'OP_DUP OP_HASH160 b553a4d94bcb4692665e4b620e93ebeb84dc3664 OP_EQUALVERIFY OP_CHECKSIG'
     * @param {string} transaction.vout[].scriptPubKey.addresses[] [ '1HXmWQShG2VZ2GXb8J2CZmVTEoDUmeKyAQ' ]
     * @param {string} transaction.vout[].scriptPubKey.type 'pubkeyhash'
     * @param {string} transaction.vout[].spentTxId null
     * @param {string} transaction.vout[].spentIndex null
     * @param {string} transaction.vout[].spentHeight null
     * @param {string} transaction.blockhash '00000000000000000080793ab209cd621c1453ae2e0ab1bcc1c815ddc57d13f2'
     * @param {string} transaction.blockheight 615754
     * @param {string} transaction.confirmations 297
     * @param {string} transaction.time 1577796419
     * @param {string} transaction.blocktime 1577796419
     * @param {string} transaction.valueOut 0.04440302
     * @param {string} transaction.size 226
     * @param {string} transaction.valueIn 0.04462902
     * @param {string} transaction.fees 0.000226
     * @return  {Promise<UnifiedTransaction>}
     * @private
     */
    async _unifyTransaction(address, transaction) {
        let showAddresses = false
        try {
            if (transaction.vin) {
                for (let i = 0, ic = transaction.vin.length; i < ic; i++) {
                    transaction.vin[i].value = transaction.vin[i].valueSat
                }
            }
            if (transaction.vout) {
                for (let i = 0, ic = transaction.vout.length; i < ic; i++) {
                    transaction.vout[i].value = BlocksoftUtils.toSatoshi(transaction.vout[i].value)
                }
            }
            showAddresses = await DogeFindAddressFunction([address], transaction)
        } catch (e) {
            e.message += ' transaction hash ' + JSON.stringify(transaction) + ' address ' + address
            throw e
        }
        let formattedTime
        try {
            formattedTime = BlocksoftUtils.toDate(typeof transaction.blocktime !== 'undefined' ? transaction.blocktime : transaction.time)
        } catch (e) {
            e.message += ' timestamp error transaction data ' + JSON.stringify(transaction)
            throw e
        }
        let confirmations = Math.abs(transaction.confirmations * 1)
        return {
            transaction_hash: transaction.txid,
            block_hash: transaction.blockhash,
            block_number: +transaction.blockheight,
            block_time: formattedTime,
            block_confirmations: confirmations,
            transaction_direction: showAddresses.direction,
            address_from: showAddresses.from,
            address_to: showAddresses.to,
            address_amount: showAddresses.value,
            transaction_status: confirmations > this._blocksToConfirm ? 'success' : 'new',
            transaction_fee: BlocksoftUtils.toSatoshi(transaction.fees),
            lock_time: +transaction.locktime,
            vin: JSON.stringify(transaction.vin),
            vout: JSON.stringify(transaction.vout)
        }
    }
}
