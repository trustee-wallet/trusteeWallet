/**
 * @version 0.11
 * https://github.com/Coinomi/bip39-coinomi/releases
 */
import BlocksoftKeys from '../../actions/BlocksoftKeys/BlocksoftKeys'

import { soliditySha3 } from 'web3-utils'
import MoneroUtils from './ext/MoneroUtils'
import MoneroMnemonic from './ext/MoneroMnemonic'

const bip32 = require('bip32')
const bitcoin = require('bitcoinjs-lib')
const networksConstants = require('../../common/ext/networks-constants')

const BTC = networksConstants['mainnet'].network

export default class XmrSecretsProcessor {

    /**
     * @param {string} data.mnemonic
     */
    async getWords(data) {
        const seed = await BlocksoftKeys.getSeedCached(data.mnemonic)
        const seedHex = seed.toString('hex')
        if (seedHex.length < 128) {
            throw new Error('bad seedHex')
        }
        const root = bip32.fromSeed(seed)
        const child = root.derivePath('m/44\'/128\'/0\'/0/0')
        const keyPair = bitcoin.ECPair.fromPrivateKey(child.privateKey, { network: BTC })

        const rawPrivateKey = keyPair.privateKey
        const rawSecretSpendKey = soliditySha3(rawPrivateKey)
        const rawSecretSpendKeyBuffer = Buffer.from(rawSecretSpendKey.substr(2), 'hex')

        let secretSpendKey = MoneroUtils.sc_reduce32(rawSecretSpendKeyBuffer)
        const secretSpendLength = secretSpendKey.length
        if (secretSpendLength < 64) {
            for (let i = secretSpendLength; i<64; i++) {
                secretSpendKey = secretSpendKey + '0'
            }
        }

        const secretViewKey = MoneroUtils.hash_to_scalar(secretSpendKey)

        const words = MoneroMnemonic.secret_spend_key_to_words(secretSpendKey)

        const publicSpendKey = MoneroUtils.secret_key_to_public_key(secretSpendKey)

        const publicViewKey = MoneroUtils.secret_key_to_public_key(secretViewKey)

        const address = MoneroUtils.pub_keys_to_address(0, publicSpendKey, publicViewKey)


        /*console.log({
            secretSpendKey,
            secretViewKey,
            words,
            publicViewKey: publicViewKey.toString('hex'),
            publicSpendKey: publicSpendKey.toString('hex'),
            address
        })*/

        return words
    }
}
