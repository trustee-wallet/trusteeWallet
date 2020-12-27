/**
 * @author Ksu
 * @version 0.20
 */
import { BlocksoftBlockchainTypes } from '../../BlocksoftBlockchainTypes'
import BlocksoftCryptoLog from '../../../common/BlocksoftCryptoLog'
import BlocksoftUtils from '../../../common/BlocksoftUtils'
import EthTmpDS from '../stores/EthTmpDS'
import EthRawDS from '../stores/EthRawDS'
import BlocksoftExternalSettings from '../../../common/BlocksoftExternalSettings'
import BlocksoftAxios from '../../../common/BlocksoftAxios'
import config from '../../../../app/config/config'


export default class EthTxSendProvider {

    private _web3: any
    private _trezorServerCode : any
    private _trezorServer : any
    private _settings : any

    constructor(web3: any, trezorServerCode : any, settings : any) {
        this._web3 = web3
        this._trezorServerCode = trezorServerCode
        this._trezorServer = 'to_load'
        this._settings = settings
    }


    async send(tx: BlocksoftBlockchainTypes.EthTx, privateData: BlocksoftBlockchainTypes.TransferPrivateData): Promise<{ transactionHash: string, transactionJson: any }> {
        // @ts-ignore
        BlocksoftCryptoLog.log('EthTxSendProvider._innerSendTx tx', tx)
        // noinspection JSUnresolvedVariable
        if (privateData.privateKey.substr(0, 2) !== '0x') {
            privateData.privateKey = '0x' + privateData.privateKey
        }
        if (tx.value.toString().substr(0, 1) === '-') {
            throw new Error('SERVER_RESPONSE_NOTHING_LEFT_FOR_FEE')
        }
        // noinspection JSUnresolvedVariable
        const signData = await this._web3.eth.accounts.signTransaction(tx, privateData.privateKey)

        // @ts-ignore
        BlocksoftCryptoLog.log('EthTxSendProvider._innerSendTx signed', tx)
        BlocksoftCryptoLog.log('EthTxSendProvider._innerSendTx hex', signData.rawTransaction)


        this._trezorServer = await BlocksoftExternalSettings.getTrezorServer(this._trezorServerCode, 'ETH.Send.sendTx')

        const link = this._trezorServer + '/api/v2/sendtx/'
        let result
        try {
            result = await BlocksoftAxios.post(link, signData.rawTransaction)
            // @ts-ignore
            BlocksoftCryptoLog.log('EthTxSendProvider._innerSendTx result ', result)
        } catch (e) {
            if (config.debug.cryptoErrors) {
                console.log('ETH Send error ' + e.message)
            }
            if (this._settings.currencyCode !== 'ETH' && this._settings.currencyCode !== 'ETH_ROPSTEN' && e.message.indexOf('bad-txns-in-belowout') !== -1) {
                throw new Error('SERVER_RESPONSE_NOT_ENOUGH_FEE')
            } else if (e.message.indexOf('dust') !== -1) {
                throw new Error('SERVER_RESPONSE_NOT_ENOUGH_AMOUNT_AS_DUST')
            } else if (e.message.indexOf('bad-txns-inputs-spent') !== -1 || e.message.indexOf('txn-mempool-conflict') !== -1) {
                throw new Error('SERVER_RESPONSE_NO_RESPONSE')
            } else if (e.message.indexOf('min relay fee not met') !== -1 || e.message.indexOf('fee for relay') !== -1 || e.message.indexOf('insufficient priority') !== -1) {
                throw new Error('SERVER_RESPONSE_NOT_ENOUGH_AMOUNT_AS_FEE')
            } else if (e.message.indexOf('insufficient fee, rejecting replacement') !== -1) {
                if (this._settings.currencyCode !== 'ETH' && this._settings.currencyCode !== 'ETH_ROPSTEN') {
                    throw new Error('SERVER_RESPONSE_NOT_ENOUGH_AMOUNT_AS_FEE_FOR_REPLACEMENT')
                } else {
                    throw new Error('UI_CONFIRM_CHANGE_AMOUNT_FOR_REPLACEMENT')
                }
            } else if (e.message.indexOf('too-long-mempool-chain') !== -1) {
                throw new Error('SERVER_RESPONSE_NO_RESPONSE')
            } else {
                await BlocksoftExternalSettings.setTrezorServerInvalid(this._trezorServerCode, this._trezorServer)
                e.message += ' link: ' + link
                throw e
            }
        }
        // @ts-ignore
        if (typeof result.data.result === 'undefined' || !result.data.result) {
            throw new Error('SERVER_RESPONSE_NOT_CONNECTED')
        }

        // @ts-ignore
        const transactionHash = result.data.result
        if (transactionHash === '') {
            throw new Error('SERVER_RESPONSE_BAD_CODE')
        }

        const nonce = BlocksoftUtils.hexToDecimal(tx.nonce)

        const transactionJson = {
            nonce,
            gasPrice: BlocksoftUtils.hexToDecimal(tx.gasPrice)
        }

        await EthTmpDS.saveNonce(tx.from, 'send_' + transactionHash, nonce)

        await EthRawDS.saveRaw({
            address: tx.from,
            currencyCode : this._settings.currencyCode,
            transactionUnique : tx.from + '_' + nonce,
            transactionHash,
            transactionRaw: signData.rawTransaction
        })

        return {transactionHash, transactionJson}
    }
}
