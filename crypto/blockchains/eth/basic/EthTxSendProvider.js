/**
 * @version 0.5
 */
import BlocksoftCryptoLog from '../../../common/BlocksoftCryptoLog'

export default class EthTxSendProvider {
    constructor(web3) {
        this._web3 = web3
    }

    /**
     * @param tx
     * @param data
     * @returns {Promise<{hash: string}>}
     */
    async send(tx, data) {
        let result, error
        try {
            result = await this._innerSendTx(tx, data)
        } catch (e) {
            if (e.message.indexOf('replacement transaction underpriced') !== -1 || e.message.indexOf('known transaction') !== -1) {
                BlocksoftCryptoLog.log('EthTxSendProvider._innerSendTx will CHANGE_NONCE', e.message)
                error = 'CHANGE_NONCE'
            } else {
                throw e
            }
        }
        if (error === 'CHANGE_NONCE') {
            try {
                tx.nonce = await this._getTxCount(data.addressFrom) + 1
                result = await this._innerSendTx(tx, data)
            } catch (e) {
                if (e.message.indexOf('replacement transaction underpriced') !== -1 || e.message.indexOf('known transaction') !== -1) {
                    BlocksoftCryptoLog.log('EthTxSendProvider._innerSendTx will CHANGE_NONCE', e.message)
                    error = 'CHANGE_NONCE2'
                } else {
                    delete (data.privateKey)
                    throw e
                }
            }
        }

        if (error === 'CHANGE_NONCE2') {
            try {
                tx.nonce = tx.nonce + 10
                result = await this._innerSendTx(tx, data)
            } catch (e) {
                delete (data.privateKey)
                throw e
            }
        }

        return result
    }

    /**
     * @param {string} address
     * @returns {Promise<int>}
     * @private
     */
    async _getTxCount(address) {
        let _this = this
        return new Promise((resolve) => {
            // noinspection JSUnresolvedVariable
            _this._web3.eth.getTransactionCount(address).then(resolve)
        })
    }


    /**
     * @param tx
     * @param data
     * @returns {Promise<{hash : string}>}
     * @private
     */
    async _innerSendTx(tx, data) {
        BlocksoftCryptoLog.log('EthTxSendProvider._innerSendTx tx', tx)
        // noinspection JSUnresolvedVariable
        if (data.privateKey.substr(0,2) !== '0x') {
            data.privateKey = '0x' + data.privateKey
        }
        // noinspection JSUnresolvedVariable
        let signData = await this._web3.eth.accounts.signTransaction(tx, data.privateKey)
        BlocksoftCryptoLog.log('EthTxSendProvider._innerSendTx signed', tx)

        return new Promise((resolve, reject) => {
            BlocksoftCryptoLog.log('EthTxSendProvider._innerSendTx promise started')
            // noinspection JSUnresolvedVariable
            return this._web3.eth.sendSignedTransaction(signData.rawTransaction)
                .on('transactionHash', (hash) => {
                    resolve({ hash })
                })
                .on('error', (e) => {
                    e.data = tx
                    reject(e)
                })
        })
    }
}
