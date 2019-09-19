/**
 * @author Ksu
 * @version 0.3
 */
import BlocksoftCryptoLog from '../../common/BlocksoftCryptoLog'
import BlocksoftUtils from '../../common/BlocksoftUtils'

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
     * @type {{currencyCode, address, fee}}
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
     * @return {Promise<int>}
     */
    async getBalance() {
        let currencyCode = this._data.currencyCode
        if (!currencyCode) {
            throw new Error('plz set currencyCode before calling')
        }
        try {
            return this._processor[currencyCode].getBalance(this._data.address)
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
                balance = await this._processor[currencyCode].getBalance(this._data.address)
                BlocksoftCryptoLog.log(`BlocksoftBalances.getTransferAllBalance ${currencyCode} got ${this._data.address} with balance`, balance)
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
            let e = new Error(`not enough funds, current = ${balance} ${this._data.currencyCode}` )
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
        return res
    }



}

const singleBlocksoftBalances = new BlocksoftBalances()

export default singleBlocksoftBalances
