const createHash = require('create-hash')
const createHmac = require('create-hmac')

const elliptic = require('elliptic')
const ec = new elliptic.ec('secp256k1')
const Web3 = require('web3')
const ZERO = new Web3.utils.BN(0)

function toLowS(s) {
    //enforce low s
    //see BIP 62, "low S values in signatures"
    if (s.gt(new Web3.utils.BN(Buffer.from('7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF5D576E7357A4501DDFE92F46681B20A0', 'hex')))) {
        s = (new Web3.utils.BN(ec.curve.n.toArray())).sub(s);
    }
    return s;
};

function hash_sha256hmac(first, second) {
    const hmac1 = createHmac('sha256', second)
    hmac1.update(first)
    return hmac1.digest()
}

function deterministicK(badrs, d, e) {
    let v = Buffer.alloc(32);
    v.fill(0x01);
    let k = Buffer.alloc(32);
    k.fill(0x00);

    let x = Buffer.from(d, 'hex')
    let hashbuf = Buffer.from(e, 'hex')

    k = hash_sha256hmac(Buffer.concat([v, Buffer.from([0x00]), x, hashbuf]), k)
    v = hash_sha256hmac(v, k);
    k = hash_sha256hmac(Buffer.concat([v, Buffer.from([0x01]), x, hashbuf]), k);
    v = hash_sha256hmac(v, k);
    v = hash_sha256hmac(v, k);

    let T = new Web3.utils.BN(v)
    let N = new Web3.utils.BN(ec.curve.n.toArray());

    // also explained in 3.2, we must ensure T is in the proper range (0, N)
    for (let i = 0; i < badrs || !(T.lt(N) && T.gt(ZERO)); i++) {
        k = hash_sha256hmac(Buffer.concat([v, Buffer.from([0x00])]), k)
        v = hash_sha256hmac(v, k)
        v = hash_sha256hmac(v, k)
        T = new Web3.utils.BN(v);
    }
    return T;
};

function toDER(r, s) {
    let rnbuf = r.toBuffer();
    let snbuf = s.toBuffer();

    let rneg = rnbuf[0] & 0x80 ? true : false;
    let sneg = snbuf[0] & 0x80 ? true : false;

    let rbuf = rneg ? Buffer.concat([Buffer.from([0x00]), rnbuf]) : rnbuf;
    let sbuf = sneg ? Buffer.concat([Buffer.from([0x00]), snbuf]) : snbuf;

    let rlength = rbuf.length;
    let slength = sbuf.length;
    let length = 2 + rlength + 2 + slength;
    let rheader = 0x02;
    let sheader = 0x02;
    let header = 0x30;

    let der = Buffer.concat([Buffer.from([header, length, rheader, rlength]), rbuf, Buffer.from([sheader, slength]), sbuf]);
    return der;
}

export default {
    hash_sha256hmac,
    sign : function (message, privKey) {
        // hash message
        let one = createHash('sha256').update(message).digest()
        let hash = createHash('sha256').update(one).digest()
        let e = hash.toString('hex')
        let d = privKey.toString('hex')
        for (let i = 0, j = hash.length - 1; i < j; ++i, --j) {
            let t = hash[j]
            hash[j] = hash[i]
            hash[i] = t
        }

        //ECDSA sign
        let N = new Web3.utils.BN(ec.curve.n.toArray())
        let G = ec.curve.g


        let badrs = 0;
        let k, Q, r, s;
        let bnD = new Web3.utils.BN(Buffer.from(d, 'hex'))
        let bnE = new Web3.utils.BN(Buffer.from(e, 'hex'))
        do {
            if (!k || badrs > 0) {
                k = deterministicK(badrs, d, e);
            }
            badrs++
            Q = G.mul(k)
            r = Q.x.umod(N)
            s = k.invm(N).mul(bnE.add(bnD.mul(r))).umod(N)
        } while (r.cmp(ZERO) <= 0 || s.cmp(ZERO) <= 0)

        s = toLowS(s)

        let buf = toDER(r, s)
        let res = buf.toString('hex')
        return res
    }
}
