/**
 * @version 0.5
 */
import { crypto, base58Encode } from '@waves/ts-lib-crypto'

export default class AshAddressProcessor {

    async setBasicRoot(root) {

    }

    /**
     * @param {string|Buffer} _privateKey
     * @param {*} data
     * @returns {Promise<{privateKey: string, address: string, addedData: *}>}
     */
    async getAddress(_privateKey, data = {}, superPrivateData = {}) {

        const all = crypto({seed: superPrivateData.mnemonic })
        const key2 = all.keyPair()

        // nope: console.log(` buff2 ` + base58Encode(buildAddress(key2.publicKey, 'A')))

        // 1. take the byte array representation of generated public key
        // 2. create new byte array XX
        // 3. first two byte values in array XX would be [1, 65] which stands for address version and chainId (character ‘A’)
        const prefix = [1, 65]

        // 4. calculate Keccak256.hash(Blake2b256.hash(pk)) where pk is public key array of bytes
        const blaked = all.blake2b(key2.publicKey)
        const keccaked = all.keccak(blaked)

        // 5. append result of step 4 to array XX
        const appended = all.concat(prefix, keccaked)

        // 6. generate checksum of array XX and append it to XX. Checksum algorithm:
        //    1.  generate Blake2b256 hash of given array
        //    2. take the first 4 elements of generated Blake2b256 hash
        const hash = all.blake2b(appended).slice(0, 4)
        const hashed = all.concat(appended, hash)

        // 7. Encode the result array XX to Base58 string
        // 8. Append 'Æx' character to the end of encoded string
        const address = 'Æx' + base58Encode(hashed)
        const pubKey = base58Encode(key2.publicKey)
        const privKey = base58Encode(key2.privateKey)
        return { address, privateKey: privKey, addedData: { pubKey} }

    }
}
