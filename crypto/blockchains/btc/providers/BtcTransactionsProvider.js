import BlocksoftAxios from '../../../common/BlocksoftAxios'
import BlocksoftCryptoLog from '../../../common/BlocksoftCryptoLog'
import BlocksoftUtils from '../../../common/BlocksoftUtils'

const CACHE_ERRORS_VALID_TIME = 60000 // 1 minute

const CACHE_ERRORS = {
    mainTime: 0,
    mainSecondTime: 0,
    mainThirdTime: 0,
    alternativeTime: 0
}

let CACHE_HISTORY = []

class BtcTransactionsProvider {
    constructor(settings) {
        if (typeof settings === 'undefined' || !settings) {
            throw new Error('BtcTransactionsProvider requires settings')
        }
        if (typeof settings.network === 'undefined') {
            throw new Error('BtcTransactionsProvider requires settings.network')
        }
        switch (settings.network) {
            case 'dogecoin':
                this._blockcypherApiPath = `https://api.blockcypher.com/v1/doge/main`
                this._insightApiPath = false
                break
            case 'litecoin':
                this._blockcypherApiPath = `https://api.blockcypher.com/v1/ltc/main`
                this._insightApiPath = `https://insight.litecore.io/api/txs/`
                break
            case 'mainnet':
                this._blockcypherApiPath = `https://api.blockcypher.com/v1/btc/main`
                this._insightApiPath = `https://insight.bitpay.com/api/txs/`
                break
            case 'testnet':
                this._blockcypherApiPath = `https://api.blockcypher.com/v1/btc/test3`
                this._insightApiPath = `https://test-insight.bitpay.com/api/txs/`
                break
            default:
                throw new Error('while retrieving Bitcoin Fee Processor - unknown Bitcoin network specified. Got : ' + settings.network)
        }
    }

    /**
     * @param {string} address
     * @return {Promise<[]>}
     * @private
     */
    async _getMain(address) {
        if (!this._insightApiPath) {
            return -1
        }
        let link = `${this._insightApiPath}?address=${address}`
        CACHE_HISTORY.push(link)
        let tmp = await BlocksoftAxios.get(link)
        /**
         * @param {Array} tmp.data.txs
         * @param {number} tmp.data.txs[].valueIn
         * @param {number} tmp.data.txs[].valueOut
         * @param {Array} tmp.data.txs[].vin
         * @param {Array} tmp.data.txs[].vin
         */
        if (!tmp.data || typeof tmp.data.txs === 'undefined') {
            // noinspection ExceptionCaughtLocallyJS
            throw new Error('Undefined tx ' + link + ' ' + JSON.stringify(tmp.data))
        }
        let ic = tmp.data.txs.length
        let txs = []
        for (let i = 0; i < ic; i++) {
            let row = tmp.data.txs[i]
            delete row.valueIn
            delete row.valueOut
            if (row.vin && row.vin.length) {
                for (let vinRow of row.vin) {
                    delete vinRow.scriptSig.asm
                }
            }
            txs.push(row)
        }
        return txs
    }

    /**
     * @param {string} address
     * @return {Promise<[]>}
     * @private
     */
    async _getMainSecond(address) {
        let link = `${this._blockcypherApiPath}/addrs/${address}/full`
        CACHE_HISTORY.push(link)
        /**
         * @param {Array} tmp.data.txs
         * @param {string} tmp.data.txs[].block_height
         * @param {string} tmp.data.txs[].confirmed
         * @param {string} tmp.data.txs[].ver
         * @param {Array} tmp.data.txs[].inputs
         * @param {Array} tmp.data.txs[].inputs[].addresses
         * @param {string} tmp.data.txs[].inputs[].addresses[]
         * @param {string} tmp.data.txs[].inputs[].output_index
         * @param {string} tmp.data.txs[].inputs[].script
         * @param {string} tmp.data.txs[].inputs[].sequence
         * @param {string} tmp.data.txs[].inputs[].prev_hash
         * @param {string} tmp.data.txs[].inputs[].output_value
         * @param {string} tmp.data.txs[].next_outputs
         * @param {Array} tmp.data.txs[].outputs
         * @param {Array} tmp.data.txs[].outputs[].addresses
         * @param {string} tmp.data.txs[].outputs[].script_type
         * @param {string} tmp.data.txs[].outputs[].spent_by
         */
        let tmp = await BlocksoftAxios.get(link)
        if (!tmp.data || typeof tmp.data.txs === 'undefined') {
            // noinspection ExceptionCaughtLocallyJS
            throw new Error('Undefined tx ' + link + ' ' + JSON.stringify(tmp.data))
        }
        let ic = tmp.data.txs.length
        let txs = []
        for (let i = 0; i < ic; i++) {
            let row = tmp.data.txs[i]
            let parsedVin = []
            let parsedVout = []

            if (row.inputs && row.inputs.length) {
                let j = 0
                for (let vinRow of row.inputs) {
                    parsedVin.push({
                        addr : vinRow.addresses && vinRow.addresses.length > 0 ? vinRow.addresses[0] : null,
                        doubleSpentTxID: null,
                        n: j,
                        vout: vinRow.output_index,
                        scriptSig: {
                            hex : vinRow.script
                        },
                        sequence: vinRow.sequence,
                        txid: vinRow.prev_hash,
                        value: BlocksoftUtils.toBtc(vinRow.output_value) * 1,
                        valueSat: vinRow.output_value,
                    })
                    j++
                }
            }

            if (typeof(row.next_outputs) != 'undefined') {
                let outputs = await BlocksoftAxios.get(row.next_outputs.replace('start=20', 'start=0').replace('limit=20', 'limit=200'))
                if (outputs.data.outputs) {
                    row.outputs = outputs.data.outputs
                }
            }

            if (row.outputs && row.outputs.length) {
                let j = 0
                for (let voutRow of row.outputs) {
                    let scriptPubKey = {
                        addresses: voutRow.addresses,
                        asm: "",
                        hex: ""
                    }

                    let type = voutRow.script_type
                    if (voutRow.script_type === 'pay-to-script-hash') type = 'scripthash'
                    if (voutRow.script_type === 'pay-to-pubkey-hash') type = 'pubkeyhash'
                    if (type !== 'null-data') {
                        scriptPubKey.type = type
                    } else if (!voutRow.addresses) {
                        scriptPubKey = {}
                    }

                    parsedVout.push({
                        n: j,
                        scriptPubKey,
                        spentTxId: typeof(voutRow.spent_by) === 'undefined' ? null : voutRow.spent_by,
                        value : voutRow.value > 0 ? BlocksoftUtils.toBtc(voutRow.value) : "",
                    })

                    j++
                }
            }



            txs.push({
                blockhash : row.block_hash,
                blockheight: row.block_height,
                blocktime: Date.parse(row.confirmed) / 1000,
                fees: BlocksoftUtils.toBtc(row.fees) * 1,
                locktime : typeof(row.lock_time) === 'undefined' ? 0 : row.lock_time,
                size : row.size,
                time: Date.parse(row.confirmed) / 1000,
                txid : row.hash,
                version : row.ver,
                confirmations : row.confirmations,
                vin : parsedVin,
                vout : parsedVout

            })
        }
        return txs
    }

    /**
     * @param address
     * @return {Promise<[]|number>}
     */
    async get(address) {
        CACHE_HISTORY = []
        let txs = -1
        let now = new Date().getTime()
        BlocksoftCryptoLog.log('BtcTransactionsProvider.get started', address)

        let msg = ''
        if (now - CACHE_ERRORS.mainTime > CACHE_ERRORS_VALID_TIME) {
            try {
                txs = await this._getMain(address)
            } catch (e) {
                txs = -1
                CACHE_ERRORS.mainTime = now
                msg += ' ' + e.message
            }
        }

        if (now - CACHE_ERRORS.mainSecondTime > CACHE_ERRORS_VALID_TIME && txs === -1) {
            try {
                txs = await this._getMainSecond(address)
            } catch (e) {
                txs = -1
                CACHE_ERRORS.mainSecondTime = now
                msg += ' ' + e.message
            }
        }

        if (txs === -1) {
            BlocksoftCryptoLog.log('BtcTransactionsProvider.get nothing responding ' + JSON.stringify(CACHE_HISTORY) + msg)
            return []
        }

        return txs
    }
}

module.exports.init = function(settings) {
    return new BtcTransactionsProvider(settings)
}
