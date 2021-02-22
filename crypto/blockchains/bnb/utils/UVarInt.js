const BN = require('bn.js')

function VarIntFunc(signed) {
    var encodingLength = function encodingLength(n) {
        if (signed) n *= 2

        if (n < 0) {
            throw Error('varint value is out of bounds')
        }

        var bits = Math.log2(n + 1)
        return Math.ceil(bits / 7) || 1
    }

    var encode = function encode(n, buffer, offset) {
        if (n < 0) {
            throw Error('varint value is out of bounds')
        }

        buffer = buffer || Buffer.alloc(encodingLength(n))
        offset = offset || 0
        var nStr = n.toString()
        var bn = new BN(nStr, 10)
        var num255 = new BN(0xff)
        var num128 = new BN(0x80) // amino signed varint is multiplied by 2

        if (signed) {
            bn = bn.muln(2)
        }

        var i = 0

        while (bn.gten(0x80)) {
            buffer[offset + i] = bn.and(num255).or(num128).toNumber()
            bn = bn.shrn(7)
            i++
        }

        buffer[offset + i] = bn.andln(0xff) // TODO
        // encode.bytes = i + 1

        return buffer
    }
    /**
     * https://github.com/golang/go/blob/master/src/encoding/binary/varint.go#L60
     */


    var decode = function decode(bytes) {
        var x = 0
        var s = 0

        for (var i = 0, len = bytes.length; i < len; i++) {
            var b = bytes[i]

            if (b < 0x80) {
                if (i > 9 || i === 9 && b > 1) {
                    return 0
                }

                return x | b << s
            }

            x |= (b & 0x7f) << s
            s += 7
        }

        return 0
    }

    return {
        encode: encode,
        decode: decode,
        encodingLength: encodingLength
    }
}

var UVarInt = VarIntFunc(false)
exports.UVarInt = UVarInt
var VarInt = VarIntFunc(true)
exports.VarInt = VarInt
