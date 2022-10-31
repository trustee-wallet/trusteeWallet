import { BigNumber } from 'bignumber.js'
import { hexToBn, bnToHex } from '../blockchains/eth/ext/estimateGas/util'
import Log from '../../app/services/Log/Log'

import BigIntXmr from '@crypto/blockchains/xmr/ext/vendor/biginteger'
const Web3 = require('web3')

class BlocksoftUtils {

    static cutZeros(val) {
        const tmp = val.toString().split('.')
        if (typeof tmp[1] === 'undefined' || !tmp[1]) return tmp[0]

        let firstNonZero = -1
        let i = tmp[1].length - 1
        do {
            const char = tmp[1][i]
            if (char !== '0') {
                firstNonZero = i
            }
            i--
        } while (firstNonZero === -1 && i >= 0)
        const last = tmp[1].substr(0, firstNonZero + 1)
        if (!last || last === '') return tmp[0]
        return tmp[0] + '.' + last
    }

    static round(val) {
        const tmp = val.toString().split('.')
        return tmp[0].replace(' ', '')
    }

    //  // console.log('added', BlocksoftUtils.add(967282001717650,87696220292905380))
    static add(val1, val2) {
        // console.log('BlocksoftUtils add ', JSON.stringify({ val1, val2}))
        let res = 0
        if (typeof val1 === 'undefined') {
            res = val2 || ''
        } else if (typeof val2 === 'undefined' || val2 === 0 || val2 === '0' || !val2) {
            res = val1
        } else if (typeof val1.innerBN !== 'undefined') {
            if (typeof val2.innerBN !== 'undefined') {
                res = val1.innerBN.plus(val2.innerBN).toString()
            } else {
                res = val1.innerBN.plus(BigNumber(val2)).toString()
            }
        } else if (!val2 || !(val2 * 1 > 0)) {
            res =  val1
        } else {
            const str = val1.toString() + val2.toString()
            if (str.indexOf('.') !== -1 || str.indexOf(',') !== -1) {
                res = val1 * 1 + val2 * 1
            } else {
                try {
                    res = BigNumber(val1).plus(BigNumber(val2)).toString()
                } catch (e) {
                    res = val1 * 1 + val2 * 1
                }
            }
        }
        // console.log('BlocksoftUtils added ', JSON.stringify({ val1, val2, res}))
        return BlocksoftUtils.fromENumber(res)
    }

    static mul(val1, val2) {
        // console.log('BlocksoftUtils mul ', JSON.stringify({ val1, val2 }))
        if (typeof val1 === 'undefined') {
            return ''
        }
        if (typeof val2 === 'undefined') {
            return val1
        }
        if (val2 === '1' || val2 === 1) {
            return val1
        }
        if (typeof val1.innerBN !== 'undefined') {
            if (typeof val2.innerBN !== 'undefined') {
                return val1.innerBN.times(val2.innerBN).toString()
            } else {
                return val1.innerBN.times(BigNumber(val2)).toString()
            }
        }
        const str = val1.toString() + val2.toString()
        let res = 0
        if (str.indexOf('.') !== -1 || str.indexOf(',') !== -1) {
            res = val1 * val2
        } else {
            try {
                res = BigNumber(val1).times(BigNumber(val2)).toString()
            } catch (e) {
                res = val1 * val2
            }
        }
        return BlocksoftUtils.fromENumber(res)
    }

    static div(val1, val2) {
        // console.log('BlocksoftUtils div ', JSON.stringify({ val1, val2 }))
        if (typeof val1 === 'undefined') {
            return ''
        }
        if (typeof val2 === 'undefined') {
            return val1
        }
        if (val2 === '1' || val2 === 1) {
            return val1
        }
        if (typeof val1.innerBN !== 'undefined') {
            if (typeof val2.innerBN !== 'undefined') {
                return val1.innerBN.dividedBy(val2.innerBN).toString()
            } else {
                return val1.innerBN.dividedBy(BigNumber(val2 + '')).toString()
            }
        }
        const str = val1.toString() + val2.toString()
        let res = 0
        if (str.indexOf('.') !== -1 || str.indexOf(',') !== -1) {
            res = val1 / val2
        } else {
            let addedZeros = false
            if (val1.length <= val2.length + 2) {
                val1 += '00000000'
                addedZeros = true
            }
            try {
                res = BigNumber(val1).dividedBy(BigNumber(val2)).toString()
                if (addedZeros) {
                    res = res / 100000000
                }
            } catch (e) {
                res = val1 / val2
            }
        }
        return BlocksoftUtils.fromENumber(res)
    }

    static diff(val1, val2) {
        // console.log('BlocksoftUtils diff ', JSON.stringify({ val1, val2 }))
        if (typeof val1 === 'undefined') {
            return val2 || ''
        }
        if (typeof val2 === 'undefined') {
            return val1
        }
        if (!val2) {
            return val1
        }
        if (!val1) {
            return -1 * val2
        }
        if (typeof val1.innerBN !== 'undefined') {
            if (typeof val2.innerBN !== 'undefined') {
                return val1.innerBN.minus(val2.innerBN).toString()
            } else {
                return val1.innerBN.minus(BigNumber(val2 + '')).toString()
            }
        }
        const str = val1.toString() + val2.toString()
        let res = 0
        if (str.indexOf('.') !== -1 || str.indexOf(',') !== -1) {
            res = val1 - val2
        } else {
            try {
                res = BigNumber(val1).minus(BigNumber(val2 + '')).toString()
            } catch (e) {
                res = val1 - val2
            }
        }
        return BlocksoftUtils.fromENumber(res)
    }

    static fromENumber(val) {
        // console.log('BlocksoftUtils fromE ', JSON.stringify(val))
        if (val === null || typeof (val) === 'undefined' || !val) {
            return 0
        }
        val = val.toString().toLowerCase()
        if (val.indexOf('0x') === 0) {
            return BigIntXmr.BigInteger(val).toString()
        }
        if (val.indexOf('e') === -1) {
            return val
        }
        const parts = val.split('e')
        const number = parts[1].substr(0, 1)
        const power = parts[1].substr(1)
        const first = parts[0].split('.')
        if (number === '+') {
            return this.fromUnified(parts[0], power)
        } else if (typeof power !== 'undefined' && power*1 > 0) {
            return '0.' + ('0'.repeat(power - 1)) + first[0] + (typeof first[1] !== 'undefined' ? first[1] : '')
        } else {
            return '0.0'
        }
    }

    static toSatoshi(val) {
        return this.fromUnified(val, 8)
    }

    static toBtc(val) {
        return this.toUnified(val, 8)
    }

    static toUnified(val, decimals = 8) {
        if (typeof val === 'undefined' || val === 'undefined' || !val) {
            return 0
        }
        if (typeof val === 'object') {
            val = val.toString()
        }
        if (typeof val === 'number') {
            val += ''
        }
        // noinspection JSUnresolvedVariable,JSCheckFunctionSignatures
        let added = ''
        const till = 18 - decimals
        if (till < 0) {
            throw new Error('toUnified till is less then 0, decimals = ' + decimals)
        }
        for (let i = 0; i < till; i++) {
            added += '0'
        }
        const parts = val.split('.')
        // noinspection JSUnresolvedVariable
        const tmp = parts[0] + added
        const res = Web3.utils.fromWei(tmp, 'ether')
        // console.log('BlocksoftUtils toUnified ', JSON.stringify(val), JSON.stringify(res))
        return res
    }

    static fromUnified(val, decimals = 8) {
        // console.log('BlocksoftUtils fromUnified ', JSON.stringify(val))
        if (typeof val === 'undefined') return 0
        val = val.toString()
        const parts = val.split('.')
        let number = parts[0]
        if (!parts[1] || !parts[1].length) return (number + '0'.repeat(decimals))

        // fill the letters after point
        const letters = parts[1].split('')
        let needToFill = decimals
        for (let i = 0, ic = letters.length; i < ic; i++) {
            needToFill--
            number += letters[i]
            if (needToFill === 0) break
        }
        for (let i = 0; i < needToFill; i++) {
            number += '0'
        }

        // cut first 0
        let cutted = ''
        let started = false
        for (let i = 0, ic = number.length; i < ic; i++) {
            if (!started && number[i] === '0') continue
            cutted += number[i]
            started = true
        }

        return cutted || 0
    }

    static toWei(val, from = 'ether') {
        // console.log('BlocksoftUtils toWei ', JSON.stringify(val))
        if (typeof val === 'undefined') {
            throw new Error('toWei val is undefined')
        }
        if (typeof val === 'number') {
            val += ''
        }
        const parts = val.toString().split('.')
        if (typeof parts[1] === 'undefined' || parts[1] === '' || !parts[1]) {
            // noinspection JSUnresolvedVariable
            return Web3.utils.toWei(val, from)
        }

        let decimals = 18
        if (from === 'gwei') {
            decimals = 9
        }
        const newVal = parts[0] + '.' + parts[1].substring(0, decimals)
        return Web3.utils.toWei(newVal, from)
    }

    static toGwei(val) {
        // console.log('BlocksoftUtils toGwei ', JSON.stringify(val))
        if (typeof val === 'number') {
            val += ''
        }

        // noinspection JSUnresolvedVariable
        let newVal = 0
        try {
            // noinspection JSUnresolvedVariable,JSCheckFunctionSignatures
            const tmp = val.split('.')
            newVal = Web3.utils.fromWei(tmp[0], 'gwei')
        } catch (e) {
            e.message = JSON.stringify(val) + ' ' + e.message
            Log.err('BlocksoftUtils.toGwei error ' + e.message)
        }
        return newVal
    }

    static toEther(val) {
        // console.log('BlocksoftUtils toEth ', JSON.stringify(val))
        if (typeof val === 'number') {
            val += ''
        }

        // noinspection JSUnresolvedVariable
        let newVal
        try {
            // noinspection JSUnresolvedVariable
            newVal = Web3.utils.fromWei(val, 'ether')
        } catch (e) {
            e.message = JSON.stringify(val) + ' ' + e.message
        }
        return newVal
    }

    static toDate(timeStamp, multiply = true) {
        if (timeStamp.toString().indexOf('T') !== -1) {
            return timeStamp
        } else if (timeStamp && timeStamp > 0) {
            if (multiply) {
                timeStamp = timeStamp * 1000
            }
            return (new Date(timeStamp)).toISOString()
        } else {
            return new Date().toISOString()
        }
    }

    static hexToUtf(hex) {
        return Web3.utils.hexToUtf8(hex)
    }

    static utfToHex(str) {
        return Web3.utils.utf8ToHex(str)
    }


    static hexToDecimal(hex) {
        if (hex.toString().indexOf('0x') === 0) {
            return Web3.utils.hexToNumber(hex)
        }
        return hex
    }

    static hexToDecimalWalletConnect(hex) {
        return hexToBn(hex).toString()
    }

    static decimalToHexWalletConnect(decimal) {
        return bnToHex(decimal)
    }

    static decimalToHex(decimal, len = 0) {
        let str = Web3.utils.toHex(decimal).substr(2)
        if (len > 0) {
            if (len < str.length) {
                throw new Error('hex ' + decimal + ' => ' + str + ' is longer then ' + len + ' and equal ' + str.length )
            }
            str = '0'.repeat(len - str.length) + str
        }
        return str
    }

    static hexToDecimalBigger(hex) {
        return BigIntXmr.BigInteger(hex).toString()
    }
}

export default BlocksoftUtils
