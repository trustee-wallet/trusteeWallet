/**
 * @version 0.5
 */
import BlocksoftCryptoLog from '../../../common/BlocksoftCryptoLog'
import BlocksoftUtils from '../../../common/BlocksoftUtils'

const CACHE_NONCE = {}

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
        let result

        let steps = 0
        let doStep = false
        let currentNonce = false
        do {
            doStep = false
            try {
                result = await this._innerSendTx(tx, data)
            } catch(e) {
                if (steps > 3) {
                    throw e
                } else if (e.message.indexOf('underpriced') !== -1 || e.message.indexOf('known transaction') !== -1 || e.message.indexOf('nonce') !== -1) {
                    BlocksoftCryptoLog.log('EthTxSendProvider._innerSendTx will CHANGE_NONCE step ' + steps + ' tx.nonce ' + (JSON.stringify(tx.nonce) || 'default') + ' int ' + currentNonce + ' ' + e.message)
                    steps++
                    if (currentNonce === false) {
                        currentNonce = await this._getNonce(data.addressFrom)
                    } else {
                        currentNonce = currentNonce + 1
                    }
                    tx.nonce = currentNonce
                    BlocksoftCryptoLog.log('EthTxSendProvider._innerSendTx did  CHANGE_NONCE step ' + steps + ' tx.nonce ' + (JSON.stringify(tx.nonce) || 'default') + ' int ' + currentNonce + ' ' + e.message)
                    doStep = true
                } else {
                    throw e
                }
            }
        } while (doStep)


        if (result && typeof result.hash !== 'undefined') {
            if (currentNonce !== false) {
                CACHE_NONCE[data.addressFrom] = currentNonce
                result.nonce = currentNonce
            } else {
                result.nonce = BlocksoftUtils.hexToDecimal(tx.nonce)
                delete CACHE_NONCE[data.addressFrom]
            }
        } else {
            delete CACHE_NONCE[data.addressFrom]
        }


        return result
    }


    async _getNonce(address) {
        if (typeof CACHE_NONCE[address] !== 'undefined') {
            BlocksoftCryptoLog.log('EthTxSendProvider._getNonce from cache ' + address + ' = ' + JSON.stringify(CACHE_NONCE[address]))
            return CACHE_NONCE[address] + 1
        }
        const nonce = await this._web3.eth.getTransactionCount(address, 'pending')
        BlocksoftCryptoLog.log('EthTxSendProvider._getNonce from blockchain ' + address + ' = ' + JSON.stringify(nonce))

        return nonce * 1
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
        const signData = await this._web3.eth.accounts.signTransaction(tx, data.privateKey)
        BlocksoftCryptoLog.log('EthTxSendProvider._innerSendTx signed', tx)

        return new Promise((resolve, reject) => {
            BlocksoftCryptoLog.log('EthTxSendProvider._innerSendTx promise started')
            // noinspection JSUnresolvedVariable
            return this._web3.eth.sendSignedTransaction(signData.rawTransaction)
                .on('transactionHash', (hash) => {
                    resolve({ hash })
                })
                .on('error', (e) => {
                    reject(e)
                })
        })
    }
}
