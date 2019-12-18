import BlocksoftCryptoLog from '../../common/BlocksoftCryptoLog'
import BlocksoftUtils from '../../common/BlocksoftUtils'

/**
 * @author Ksu
 * @version 0.3
 */
const Dispatcher = require('../../blockchains/Dispatcher').init()

class BlocksoftBalances {

    /**
     * @type {{}}
     * @private
     */
    _processor = {}

    /**
     * @type {{}}
     * @private
     */
    _allSettings = {}

    /**
     * @type {{currencyCode, address, fee, jsonData}}
     * @private
     */
    _data = {}

    /**
     * @type {{}}
     * @private
     */
    _currencySettings = {}

    /**
     * @param {string} currencyCode
     * @return {BlocksoftBalances}
     */
    setCurrencyCode(currencyCode) {
        this._data.currencyCode = currencyCode
        if (!this._processor[currencyCode]) {
            /**
             * @type {EthScannerProcessor|BtcScannerProcessor|UsdtScannerProcessor}
             */
            this._processor[currencyCode] = Dispatcher.getScannerProcessor(currencyCode)
            this._allSettings[currencyCode] = Dispatcher._getSettings(currencyCode)
        }
        this._currencySettings = this._allSettings[currencyCode]
        return this
    }

    /**
     * @param {string} address
     * @return {BlocksoftBalances}
     */
    setAddress(address) {
        this._data.address = address.trim()
        return this
    }

    /**
     * @param {*} jsonData
     * @return {BlocksoftBalances}
     */
    setAdditional(jsonData) {
        this._data.jsonData = jsonData
        return this
    }

    /**
     * @return {Promise<{int:balance, int:provider}>}
     */
    async getBalance() {
        let currencyCode = this._data.currencyCode
        if (!currencyCode) {
            throw new Error('plz set currencyCode before calling')
        }
        if (currencyCode === 'BTC' && this._data.address.toString().substr(0, 1) === 'm') {
            throw new Error('plz check btc address as its testnet and mainnet is selected')
        }
        try {
            return this._processor[currencyCode].getBalance(this._data.address, this._data.jsonData)
        } catch (e) {
            e.code = 'ERROR_SYSTEM'
            throw e
        }
    }


    /**
     * @param {string|int|Object} fee
     * @return {BlocksoftBalances}
     */
    setFee(fee) {
        this._data.fee = fee
        return this
    }

    getAddressToForTransferAll(addressFrom) {
        if (this._data.currencyCode === 'BTC_TEST') {
            return 'mjojEgUSi68PqNHoAyjhVkwdqQyLv9dTfV'
        }
        return addressFrom
    }

    async getTransferAllBalance(balance = false) {
        let currencyCode = this._data.currencyCode

        if (!currencyCode) {
            throw new Error('plz set currencyCode before calling')
        }

        if (balance === false) { // use submitted balance if there is recent request (from ui)
            try {
                BlocksoftCryptoLog.log(`BlocksoftBalances.getTransferAllBalance ${currencyCode} started ${this._data.address} `)
                let tmp = await this._processor[currencyCode].getBalance(this._data.address)
                balance = BlocksoftUtils.add(tmp.balance, tmp.unconfirmed)
                BlocksoftCryptoLog.log(`BlocksoftBalances.getTransferAllBalance ${currencyCode} got ${this._data.address} data`, tmp)
            } catch (e) {
                e.message = `BlocksoftBalances.getTransferAllBalance ${currencyCode} error ` + e.message
                // noinspection ES6MissingAwait
                BlocksoftCryptoLog.err(`BlocksoftBalances.getTransferAllBalance ${currencyCode} ${this._data.address} `, e)
                let newError = new Error('server.not.responding.all.balance')
                newError.log = e.message
                throw newError
            }
        }

        if (typeof(this._currencySettings.feesCurrencyCode) != 'undefined' && this._currencySettings.feesCurrencyCode && this._currencySettings.feesCurrencyCode !== currencyCode) {
            BlocksoftCryptoLog.log(`BlocksoftBalances.getTransferAllBalance ${currencyCode} will be paid as ${this._currencySettings.feesCurrencyCode}`)
            return balance
        }

        if (balance <= 0) {
            BlocksoftCryptoLog.log(`BlocksoftBalances.getTransferAllBalance ${this._data.currencyCode} not enough funds, current = ${balance}`)
            let e = new Error('SERVER_RESPONSE_NOTHING_TO_TRANSFER')
            e.code = 'ERROR_USER'
            throw e
        }

        let amount = this._getTransferAllBalanceMinusFee(balance, this._data.fee)
        BlocksoftCryptoLog.log(`BlocksoftBalances.getTransferAllBalance ${currencyCode} finished ${this._data.address} with balance-fee`, amount)

        if (amount*1 <= 0) {
            let e = new Error(`not enough funds, current balance - fee = ${balance} - ${JSON.stringify(this._data.fee)} = ${amount} ${this._data.currencyCode}` )
            e.code = 'ERROR_BALANCE'
            e.diff = -1 * amount + 1
            throw e
        }

        return amount
    }

    _getTransferAllBalanceMinusFee(balance, feeIntOrObject) {
        let fee = feeIntOrObject
        if (feeIntOrObject && typeof feeIntOrObject.feeForTx !== 'undefined') {
            fee = feeIntOrObject.feeForTx
        }
        let res = (BlocksoftUtils.toBigNumber(balance)).sub(BlocksoftUtils.toBigNumber(fee)).toString()  //new BN(balance).sub(new BN(fee)).toString()
        BlocksoftCryptoLog.log(`BlocksoftBalances._getTransferAllBalanceMinusFee ${balance} - ${fee} => ${res}`)
        if (res < 0) {
            let e = new Error('balance is less than fee')
            e.code = 'ERROR_BALANCE_MINUS_FEE'
            throw e
        }
        return res
    }



}

const singleBlocksoftBalances = new BlocksoftBalances()

export default singleBlocksoftBalances
