import {BigNumber} from 'bignumber.js'
import BlocksoftUtils from './BlocksoftUtils'

class BlocksoftBN {

    innerBN = false

    constructor(val) {
        try {
            // noinspection JSCheckFunctionSignatures,JSUnresolvedVariable
            this.innerBN = new BigNumber(val)
        } catch (e) {
            throw new Error(e.message + ' while BlocksoftBN.constructor ' + val)
        }
    }


    get() {
        return this.innerBN.toString()
    }

    add(val) {
        if (!val || val.toString() === '0') {
            return false
        }
        let val2
        try {
            val = BlocksoftUtils.fromENumber(val)
            val2 = BigNumber(val)
        } catch (e) {
            throw new Error(e.message + ' while BlocksoftBN.add transform ' + val)
        }
        try {
            this.innerBN = this.innerBN.plus(val2)
        } catch (e) {
            throw new Error(e.message + ' while BlocksoftBN.adding ' + val)
        }
    }

    diff(val) {
        if (!val || val.toString() === '0') {
            return this
        }
        let val2
        try {
            val = BlocksoftUtils.fromENumber(val)
            val2 = BigNumber(val)
        } catch (e) {
            throw new Error(e.message + ' while BlocksoftBN.minus transform ' + val)
        }
        try {
            this.innerBN = this.innerBN.minus(val2)
        } catch (e) {
            throw new Error(e.message + ' while BlocksoftBN.minus ' + val)
        }
        return this
    }

}

export default BlocksoftBN
