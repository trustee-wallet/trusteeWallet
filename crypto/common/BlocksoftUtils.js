const Web3 = require('web3')

class BlocksoftUtils {

    static add(val1, val2) {
        if (!val2 || !(val2 * 1 > 0)) return val1
        return BlocksoftUtils.toBigNumber(val1).add(BlocksoftUtils.toBigNumber(val2))
    }

    /**
     * @param val
     * @returns BigNumber
     */
    static toBigNumber(val) {
        // noinspection JSCheckFunctionSignatures,JSUnresolvedVariable
        return new Web3.utils.BN(val)
    }

    static fromENumber(val) {
        if (val === null || typeof(val) === 'undefined' || !val ) {
            return 0
        }
        val = val.toString()
        if (val.indexOf('e+') === -1) {
            return val
        }
        let parts = val.split('e+')
        return this.fromUnified(parts[0], parts[1])
    }

    static toSatoshi(val) {
        return this.fromUnified(val, 8)
    }

    static toBtc(val) {
        return this.toUnified(val, 8)
    }

    static toUnified(val, decimals = 8) {
        if (typeof val === 'undefined' || val === 'undefined') {
            return 0
        }
        if (typeof val === 'number') {
            val += ''
        }
        // noinspection JSUnresolvedVariable,JSCheckFunctionSignatures
        let added = ''
        let till = 18 - decimals
        if (till < 0) {
            throw new Error('toUnified till is less then 0, decimals = ' + decimals)
        }
        for (let i = 0; i < till; i++) {
            added += '0'
        }
        // noinspection JSUnresolvedVariable
        return Web3.utils.fromWei(val + added, 'ether')
    }

    static fromUnified(val, decimals = 8) {
        val = val.toString()
        let parts = val.split('.')
        let number = parts[0]
        if (!parts[1] || !parts[1].length) return (number + '0'.repeat(decimals))

        // fill the letters after point
        let letters = parts[1].split('')
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

        return cutted
    }

    static toWei(val, from = 'ether') {
        if (typeof val === 'undefined') {
            throw new Error('toWei val is undefined')
        }
        if (typeof val === 'number') {
            val += ''
        }
        // noinspection JSUnresolvedVariable
        return Web3.utils.toWei(val, from)
    }

    static toGwei(val) {
        if (typeof val === 'number') {
            val += ''
        }

        // noinspection JSUnresolvedVariable
        let newVal
        try {
            // noinspection JSUnresolvedVariable,JSCheckFunctionSignatures
            newVal = Web3.utils.fromWei(val, 'gwei')
        } catch (e) {
            e.message = JSON.stringify(val) + ' ' + e.message
        }
        return newVal
    }

    static toEther(val) {
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
    static decimalToHex(decimal, len = 0) {
        let str = Web3.utils.toHex(decimal).substr(2)
        if (len > 0) {
            str = "0".repeat(len - str.length) + str
        }
        return str
    }
}

export default BlocksoftUtils
