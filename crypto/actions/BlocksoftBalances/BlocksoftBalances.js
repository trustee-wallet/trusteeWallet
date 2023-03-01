/**
 * @author Ksu
 * @version 0.5
 */
import BlocksoftDispatcher from '../../blockchains/BlocksoftDispatcher'
import BlocksoftCryptoLog from '../../common/BlocksoftCryptoLog'
import BlocksoftDict from '../../common/BlocksoftDict'
import BlocksoftExternalSettings from '@crypto/common/BlocksoftExternalSettings'

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
     * @type {{currencyCode, address, fee, jsonData, walletHash}}
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
            this._processor[currencyCode] = BlocksoftDispatcher.getScannerProcessor(currencyCode)
            this._allSettings[currencyCode] = BlocksoftDict.getCurrencyAllSettings(currencyCode)
        }
        this._currencySettings = this._allSettings[currencyCode]
        return this
    }

    setWalletHash(walletHash) {
        this._data.walletHash = walletHash
        return this
    }

    /**
     * @param {string|string[]} address
     * @return {BlocksoftBalances}
     */
    setAddress(address) {
        this._data.address = typeof address.trim !== 'undefined' ? address.trim() : address
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
     * @return {Promise<{balance:*, frozen: *, frozenEnergy: *, balanceAvailable: *, balanceStaked: *, provider:*, unconfirmed:*, addresses : *, balanceScanBlock : *}>}
     */
    async getBalance(source) {
        BlocksoftCryptoLog.log('BlocksoftBalances.getBalance ' + this._data.currencyCode + ' ' + this._data.address + ' started')
        const currencyCode = this._data.currencyCode
        if (!currencyCode) {
            throw new Error('plz set currencyCode before calling')
        }
        if (currencyCode === 'BTC' && this._data.address.toString().substr(0, 1) === 'm') {
            throw new Error('plz check btc address as its testnet and mainnet is selected')
        }
        let res
        try {
            res = await this._processor[currencyCode].getBalanceBlockchain(this._data.address, this._data.jsonData, this._data.walletHash, source)
            res.address = this._data.address
            res.currencyCode = currencyCode
        } catch (e) {
            e.code = 'ERROR_SYSTEM'
            throw e
        }
        BlocksoftCryptoLog.log('BlocksoftBalances.getBalance ' + this._data.currencyCode + ' ' + this._data.address + ' ended ' + JSON.stringify(res))
        return res
    }

    getBalanceHodl() {
        const currencyCode = this._data.currencyCode
        if (!currencyCode) {
            throw new Error('plz set currencyCode before calling')
        }
        let hodl = 0
        if (currencyCode === 'XRP') {
            hodl = BlocksoftExternalSettings.getStatic('XRP_MIN')
        } else if (currencyCode === 'XLM') {
            hodl = 1
        }
        return hodl
    }

    async getResources(source) {
        const currencyCode = this._data.currencyCode
        if (!currencyCode) {
            throw new Error('plz set currencyCode before calling')
        }
        let res
        try {
            res = await this._processor[currencyCode].getResourcesBlockchain(this._data.address, this._data.jsonData, this._data.walletHash, source)
        } catch (e) {
            e.code = 'ERROR_SYSTEM'
            throw e
        }
        BlocksoftCryptoLog.log('BlocksoftBalances.getResources ' + this._data.currencyCode + ' ' + this._data.address + ' ended ' + JSON.stringify(res))
        return res
    }

    async isMultisig(source) {
        const currencyCode = this._data.currencyCode
        if (!currencyCode) {
            throw new Error('plz set currencyCode before calling')
        }
        let res
        try {
            res = await this._processor[currencyCode].isMultisigBlockchain(this._data.address, this._data.jsonData, this._data.walletHash, source)
        } catch (e) {
            e.code = 'ERROR_SYSTEM'
            throw e
        }
        BlocksoftCryptoLog.log('BlocksoftBalances.isMultisigBlockchain ' + this._data.currencyCode + ' ' + this._data.address + ' ended ' + JSON.stringify(res))
        return res
    }
}

const singleBlocksoftBalances = new BlocksoftBalances()
export default singleBlocksoftBalances
