/**
 * @author Ksu
 * @version 0.11
 * @todo not used, need fully do with local crypto to check all functions in xmr-core
 * await MoneroUtilsForTx.derive_key_image_from_tx('','','','')
 */
import MoneroUtils from './MoneroUtils'

// import { DefaultDevice } from 'xmr-core/xmr-crypto-utils/lib'
// eslint-disable-next-line camelcase
// import { hash_to_ec } from "xmr-core/xmr-crypto-utils/lib/crypto-ops/hash_ops"

const hwdev = new DefaultDevice()

const elliptic = require('elliptic')
const Ed25519 = elliptic.eddsa('ed25519')

const BigInteger = require('./vendor/biginteger')


// eslint-disable-next-line camelcase
function encode_varint(input) {
    let i = BigInteger.BigInteger(input)
    let out = ''
    // While i >= b10000000 = 128
    while (i.compare(0x80) >= 0) {
        // out.append i & b01111111 | b10000000
        out += ('0' + ((i.lowVal() & 0x7f) | 0x80).toString(16)).slice(-2)
        const pow = new BigInteger.BigInteger(2).pow(7)
        i = i.divide(pow)
    }
    out += ('0' + i.toJSValue().toString(16)).slice(-2)
    return out
}

export default {


    // eslint-disable-next-line camelcase
    async derive_key_image_from_tx(tx_pub, view_sec, spend_pub, spend_sec, output_index) {

        const recvDerivationKsu = this.generate_key_derivation(
            tx_pub,
            view_sec
        )

        const recvDerivationXmr = await hwdev.generate_key_derivation(
            tx_pub,
            view_sec
        )

        console.log('recv_derivation_ksu', recvDerivationKsu.toString('hex'))
        console.log('recv_derivation_xmr', recvDerivationXmr)

        const ephemeralSecKsu = this.derive_secret_key(
            recvDerivationKsu,
            output_index,
            spend_sec
        )

        const ephemeralSecXmr = await hwdev.derive_secret_key(
            recvDerivationXmr,
            output_index,
            spend_sec
        )
        console.log('ephemeral_sec_ksu', ephemeralSecKsu.toString('hex'))
        console.log('ephemeral_sec_xmr', ephemeralSecXmr)


        const ephemeralPubKsu = MoneroUtils.secret_key_to_public_key(ephemeralSecKsu)
        const ephemeralPubXmr = await hwdev.secret_key_to_public_key(ephemeralSecXmr)
        console.log('ephemeral_pub_ksu', ephemeralPubKsu.toString('hex'))
        console.log('ephemeral_pub_xmr', ephemeralPubXmr)

        const keyImageKsu = this.generate_key_image(
            ephemeralPubKsu.toString('hex'),
            ephemeralSecKsu.toString('hex')
        )

        const keyImageXmr = await hwdev.generate_key_image(
            ephemeralPubXmr,
            ephemeralSecXmr
        )

        // not ok ! console.log('key_image_ksu', keyImageKsu.toString('hex'))
        console.log('key_image_xmr', keyImageXmr)

        return keyImageXmr

    },


    /**
     The key image is formed I = x*H(P)
     Takes as input a secret key x and public key P, and returns I = xHp (P), the key
     image. This is part of the GEN algorithm

     hash_to_ec(pub, point);
     ge_scalarmult(&point2, &unwrap(sec), &point);
     ge_tobytes(&image, &point2);
     */
    generate_key_image(pubHex, secHex) {
        if (!pubHex || !secHex || pubHex.length !== 64 || secHex.length !== 64) {
            throw Error('Invalid input length')
        }
        const myEcBuf = this.hash_to_ec(pubHex)
    },

    /**
     The hash_to_ec function is called to hash pub (which is your P) into point, giving us your H(P)
     Inputs a key, hashes it, and then does the equivalent in bitwise operations of multiplying the resulting integer by the base point and then by 8

     keccak(pubkey->data, sizeof(pubkey->data), hash, sizeof(hash));
     ge_fromfe_frombytes_vartime(&point, hash);
     ge_mul8(&point2, &point);
     ge_p1p1_to_p3(res, &point2);
     */
    hash_to_ec(keyHex) {
        // this is ok
        const keyHashBuffer = Buffer.from(MoneroUtils.cn_fast_hash(keyHex), 'hex')
        // but this in not
        const P = Ed25519.g.mul(Ed25519.decodeInt(keyHashBuffer))
        const res = P.mul(Ed25519.decodeInt(8))
        const resPoint = Ed25519.encodePoint(res)
        console.log('resPointKsu', resPoint)
        console.log('resPointXmr', hash_to_ec(keyHex))
        return resPoint
    },

    /**
     checked
     Takes a secret key b, and a public key P, and outputs 8·bP. (The 8 being for the purpose of the secret key set). This is used in derive_public_key
     as part of creating one-time addresses
     var P = primitive_ops_1.ge_scalarmult(pub, sec); // Multiply a scalar *sec* by a point *pub*
     return primitive_ops_1.ge_scalarmult(P, xmr_str_utils_1.d2s("8")); //mul8 to ensure group

     bool crypto_ops::generate_key_derivation(const public_key &key1, const secret_key &key2, key_derivation &derivation) {
        ge_p3 point;
        ge_p2 point2;
        ge_p1p1 point3;
        assert(sc_check(&key2) == 0);
        if (ge_frombytes_vartime(&point, &key1) != 0) {
          return false;
        }
        ge_scalarmult(&point2, &unwrap(key2), &point);
        ge_mul8(&point3, &point2);
        ge_p1p1_to_p2(&point2, &point3);
        ge_tobytes(&derivation, &point2);
        return true;
     }
     */
    generate_key_derivation(pubHex, secHex) {
        if (pubHex.length !== 64 || secHex.length !== 64) {
            throw Error('Invalid input length')
        }
        const secretBuffer = Buffer.from(secHex, 'hex')
        const P = Ed25519.decodePoint(pubHex).mul(Ed25519.decodeInt(secretBuffer))
        const res = P.mul(Ed25519.decodeInt(8))
        return Buffer.from(Ed25519.encodePoint(res))
    },

    /**
     checked
     void crypto_ops::derivation_to_scalar(const key_derivation &derivation, size_t output_index, ec_scalar &res) {
        struct {
          key_derivation derivation;
          char output_index[(sizeof(size_t) * 8 + 6) / 7];
        } buf;
        char *end = buf.output_index;
        buf.derivation = derivation;
        tools::write_varint(end, output_index);
        assert(end <= buf.output_index + sizeof buf.output_index);
        hash_to_scalar(&buf, end - reinterpret_cast<char *>(&buf), res);
      }
     */
    derivation_to_scalar(derivation, outIndex) {
        let buf = derivation.toString()
        buf += encode_varint(outIndex)
        return MoneroUtils.hash_to_scalar(buf)
    },

    /**
     checked
     void crypto_ops::derive_secret_key(const key_derivation &derivation, size_t output_index,
     const secret_key &base, secret_key &derived_key) {
        ec_scalar scalar;
        assert(sc_check(&base) == 0);
        derivation_to_scalar(derivation, output_index, scalar);
        sc_add(&unwrap(derived_key), &unwrap(base), &scalar);
      }
     */
    derive_secret_key(derivationHexOrBuffer, outIndex, secHex) {
        const str = typeof derivationHexOrBuffer === 'string' ? derivationHexOrBuffer : derivationHexOrBuffer.toString('hex')
        if (str.length !== 64 || secHex.length !== 64) {
            throw Error('Invalid input length!')
        }
        const buff = Buffer.alloc(80)

        const scalarB = Buffer.from(this.derivation_to_scalar(str, outIndex), 'hex')

        for (let i = 0, ic = scalarB.length; i < ic; i++) {
            buff[i] = scalarB[i]
            buff[i + 40] = scalarB[i]
        }
        const res = MoneroUtils.sc_add(buff, secHex)
        return Buffer.from(res, 'hex').subarray(0, 32)
    }
}
