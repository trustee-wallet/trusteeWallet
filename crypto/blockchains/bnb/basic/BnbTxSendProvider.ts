import BlocksoftAxios from '../../../common/BlocksoftAxios'
import { BlocksoftBlockchainTypes } from '../../BlocksoftBlockchainTypes'
import config from '../../../../app/config/config'
import BlocksoftCryptoLog from '../../../common/BlocksoftCryptoLog'
import BlocksoftUtils from '../../../common/BlocksoftUtils'
import BlocksoftExternalSettings from '../../../common/BlocksoftExternalSettings'

const elliptic = require('elliptic')
const ec = new elliptic.ec('secp256k1')
const createHash = require('create-hash')
const bech = require('bech32')


const UVarInt = require('../utils/UVarInt').UVarInt
const Encode = require('../utils/Encode')
const _tinySecp256k = require('tiny-secp256k1')

function decodeAddress(value: any) {
    const decodeAddress = bech.decode(value)
    return Buffer.from(bech.fromWords(decodeAddress.words))
}

function convertObjectToSignBytes(obj: any) {
    return Buffer.from(JSON.stringify(Encode.sortObject(obj)))
}

function encodeBinaryByteArray(bytes: any) {
    const lenPrefix = bytes.length
    return Buffer.concat([UVarInt.encode(lenPrefix), bytes])
}

function serializePubKey(unencodedPubKey: any) {
    let format = 0x2
    const y = unencodedPubKey.getY()
    const x = unencodedPubKey.getX()

    if (y && y.isOdd()) {
        format |= 0x1
    }

    let pubBz = Buffer.concat([UVarInt.encode(format), x.toArrayLike(Buffer, 'be', 32)]) // prefixed with length

    pubBz = encodeBinaryByteArray(pubBz) // add the amino prefix

    pubBz = Buffer.concat([Buffer.from('EB5AE987', 'hex'), pubBz])
    return pubBz
}

function marshalBinary(obj: any) {
    return Encode.encodeBinary(obj, -1, true).toString('hex')
}


export class BnbTxSendProvider {

    async getPrepared(data: BlocksoftBlockchainTypes.TransferData, privateData: BlocksoftBlockchainTypes.TransferPrivateData, uiData: BlocksoftBlockchainTypes.TransferUiData, type = 'usual') {
        const apiServer = await BlocksoftExternalSettings.getStatic('BNB_SERVER')
        const res = await BlocksoftAxios.getWithoutBraking(apiServer + '/api/v1/account/' + data.addressFrom)
        if (!res.data) {
            throw new Error('no data')
        }
        const account = res.data

        const unified = BlocksoftUtils.fromUnified(data.amount, 8) * 1
        const msg = {
            'inputs': [{
                'address': data.addressFrom, 'coins': [{
                    'amount': unified,
                    'denom': 'BNB'
                }]
            }],
            'outputs': [{
                'address': data.addressTo, 'coins': [{
                    'amount': unified,
                    'denom': 'BNB'
                }]
            }]
        }
        const memo = (typeof data.memo === 'undefined' || !data.memo) ? '' : data.memo
        const signMsg = {
            account_number: account.account_number + '',
            chain_id: 'Binance-Chain-Tigris',
            data: null,
            memo,
            msgs: [msg],
            sequence: account.sequence + '',
            source: '0'
        }

        const buff = convertObjectToSignBytes(signMsg)
        const signBytesHex = buff.toString('hex')

        const msgHash = createHash('sha256').update(signBytesHex, 'hex').digest()
        const keypair = ec.keyFromPrivate(privateData.privateKey, 'hex')
        const signature = _tinySecp256k.sign(msgHash, Buffer.from(privateData.privateKey, 'hex'))
        const signatureHex = signature.toString('hex')

        const pubKey = keypair.getPublic()
        const pubSerialize = serializePubKey(pubKey)

        const signatures =  [{
            pub_key: pubSerialize,
            signature: Buffer.from(signatureHex, 'hex'),
            account_number: account.account_number,
            sequence: account.sequence
        }]
        const transaction = {
            sequence: account.sequence + '',
            accountNumber: account.account_number + '',
            chainId: 'Binance-Chain-Tigris',
            msg: {
                'inputs': [{
                    'address': decodeAddress(data.addressFrom), 'coins': [{
                        'denom': 'BNB',
                        'amount': unified,
                    }]
                }],
                'outputs': [{
                    'address': decodeAddress(data.addressTo), 'coins': [{
                        'denom': 'BNB',
                        'amount': unified,
                    }]
                }],
                aminoPrefix: '2A2C87FA'
            },
            baseMsg: undefined,
            memo: memo,
            source: 0,
            signatures
        }
        return transaction
    }

    serializeTx(tx: any) {
        if (!tx.signatures) {
            throw new Error('need signature')
        }

        const msg = tx.msg || tx.baseMsg && tx.baseMsg.getMsg()
        const stdTx = {
            msg: [msg],
            signatures: tx.signatures,
            memo: tx.memo,
            source: tx.source,
            // sdk value is 0, web wallet value is 1
            data: '',
            aminoPrefix: 'F0625DEE'
        }
        const bytes = marshalBinary(stdTx)
        return bytes.toString('hex')
    }

    async sendRaw(raw: string) {
        let result = false
        try {
            // console.log(`curl -X POST -F "tx=${raw}" "https://dex.binance.org/api/v1/broadcast"`)
            const apiServer = await BlocksoftExternalSettings.getStatic('BNB_SERVER')
            const response = await fetch(apiServer + '/api/v1/broadcast?sync=true', {
                method: 'POST',
                credentials: 'same-origin',
                mode: 'same-origin',
                headers: {
                    'Content-Type': 'text/plain'
                },
                body: raw
            })
            result = await response.json()

            if (typeof result.status !== 'undefined') {
                if (result.status === 406 || result.status === 400 || result.status === 504) {
                    throw new Error(result.title)
                }
            }
        } catch (e) {
            if (config.debug.cryptoErrors) {
                console.log('BnbTransferProcessor.sendTx error ', e)
            }
            await BlocksoftCryptoLog.log('BnbTransferProcessor.sendTx error ' + e.message)
            throw e
        }
        await BlocksoftCryptoLog.log('BnbTransferProcessor.sendTx result ', result)
        return result
    }
}
