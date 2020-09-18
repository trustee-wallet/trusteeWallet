/**
 * @author Ksu
 * @version 0.11
 *
 * based on
 * https://github.com/Coinomi/bip39-coinomi
 */
import MoneroDict from './MoneroDict'
import BlocksoftUtils from '../../../common/BlocksoftUtils'

const crc32 = require('buffer-crc32')

export default {
    secret_spend_key_to_words(secretSpendKeyBufferOrHex, walletHash) {
        const buff = typeof secretSpendKeyBufferOrHex === 'string' ? Buffer.from(secretSpendKeyBufferOrHex, 'hex') : secretSpendKeyBufferOrHex
        var seed = []
        var forChecksum = ''
        for (var i = 0; i < 32; i += 4) {
            var w0 = 0
            for (var j = 3; j >= 0; j--) {
                w0 = w0 * 256 + buff[i + j]
                if (typeof buff[i + j] === 'undefined') {
                    throw new Error('XMR word for wallet ' + walletHash + ' need to be rechecked as buff is too low')
                }
            }

            var w1 = w0 % MoneroDict.monero_words_english.length
            var w2 = ((w0 / MoneroDict.monero_words_english.length | 0) + w1) % MoneroDict.monero_words_english.length
            var w3 = (((w0 / MoneroDict.monero_words_english.length | 0) / MoneroDict.monero_words_english.length | 0) + w2) % MoneroDict.monero_words_english.length

            seed.push(MoneroDict.monero_words_english[w1])
            seed.push(MoneroDict.monero_words_english[w2])
            seed.push(MoneroDict.monero_words_english[w3])
            forChecksum += MoneroDict.monero_words_english[w1].substring(0, MoneroDict.monero_words_english_prefix_len)
            forChecksum += MoneroDict.monero_words_english[w2].substring(0, MoneroDict.monero_words_english_prefix_len)
            forChecksum += MoneroDict.monero_words_english[w3].substring(0, MoneroDict.monero_words_english_prefix_len)
        }
        const crc32Res = crc32(forChecksum)
        const crc32Decimal = BlocksoftUtils.hexToDecimal('0x' + crc32Res.toString('hex'))
        seed.push(seed[crc32Decimal % 24])
        return seed.join(' ')
    }
}
