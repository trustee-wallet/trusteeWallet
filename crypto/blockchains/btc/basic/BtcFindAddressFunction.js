/**
 * @version 0.5
 * @param {string} addresses[]
 * @param {string} transaction.hex
 * @param {string} transaction.address
 * @param {string} transaction.vin[].txid
 * @param {string} transaction.vin[].sequence
 * @param {string} transaction.vin[].n 0
 * @param {string} transaction.vin[].addresses[]
 * @param {string} transaction.vin[].addr
 * @param {string} transaction.vin[].value
 * @param {string} transaction.vin[].hex
 * @param {string} transaction.vout[].value
 * @param {string} transaction.vout[].n 0
 * @param {string} transaction.vout[].spent
 * @param {string} transaction.vout[].hex
 * @param {string} transaction.vout[].addresses[]
 * @param {string} transaction.vout[].scriptPubKey.addresses[]
 * @returns {Promise<{from: string, to: string, value: number, direction: string}>}
 * @constructor
 */
import BlocksoftBN from '../../../common/BlocksoftBN'

export default async function BtcFindAddressFunction(indexedAddresses, transaction) {
    const inputMyBN = new BlocksoftBN(0)
    const inputOthersBN = new BlocksoftBN(0)
    let inputMyAddress = ''
    const inputOthersAddresses = []
    const uniqueTmp = {}
    if (transaction.vin) {
        for (let i = 0, ic = transaction.vin.length; i < ic; i++) {
            let vinAddress
            const vinValue = transaction.vin[i].value
            if (typeof transaction.vin[i].addresses !== 'undefined') {
                vinAddress = transaction.vin[i].addresses[0]
            } else if (typeof transaction.vin[i].addr !== 'undefined') {
                vinAddress = transaction.vin[i].addr
            }
            if (!vinAddress) continue
            if (vinAddress.indexOf('OP_RETURN (omni') !== -1) {
                vinAddress = 'OMNI'
            }
            if (typeof indexedAddresses[vinAddress] !== 'undefined') {
                inputMyBN.add(vinValue)
                inputMyAddress = vinAddress
            } else {
                if (typeof uniqueTmp[vinAddress] === 'undefined') {
                    uniqueTmp[vinAddress] = 1
                    inputOthersAddresses.push(vinAddress)
                }
                inputOthersBN.add(vinValue)
            }
        }
    }

    const outputMyBN = new BlocksoftBN(0)
    const outputOthersBN = new BlocksoftBN(0)

    let outputMyAddress = ''
    const allMyAddresses = []
    const outputOthersAddresses = []
    const uniqueTmp2 = {}
    if (transaction.vout) {
        for (let j = 0, jc = transaction.vout.length; j < jc; j++) {
            let voutAddress
            const voutValue = transaction.vout[j].value
            if (typeof transaction.vout[j].addresses !== 'undefined') {
                voutAddress = transaction.vout[j].addresses[0]
            } else if (typeof transaction.vout[j].scriptPubKey !== 'undefined' && typeof transaction.vout[j].scriptPubKey.addresses !== 'undefined') {
                voutAddress = transaction.vout[j].scriptPubKey.addresses[0]
            }
            if (voutAddress.indexOf('OP_RETURN (omni') !== -1) {
                voutAddress = 'OMNI'
            }

            if (typeof indexedAddresses[voutAddress] !== 'undefined') {
                outputMyBN.add(voutValue)
                outputMyAddress = voutAddress
                allMyAddresses.push(outputMyAddress)
            } else {
                if (typeof uniqueTmp2[voutAddress] === 'undefined') {
                    uniqueTmp2[voutAddress] = 1
                    outputOthersAddresses.push(voutAddress)
                }
                outputOthersBN.add(voutValue)
            }
        }
    }

    let output
    if (inputMyBN.get() === '0') { // my only in output
        output = {
            direction: 'income',
            from: inputOthersAddresses.length > 0 ? inputOthersAddresses.join(',') : '',
            to: '', // outputMyAddress,
            value: outputMyBN.get()
        }
    } else if (outputMyBN.get() === '0') { // my only in input
        output = {
            direction: 'outcome',
            from: '', // inputMyAddress,
            to: outputOthersAddresses.length > 0 ? outputOthersAddresses.join(',') : '',
            value: (inputOthersBN.get() === '0') ? outputOthersBN.get() : inputMyBN.get()
        }
    } else { // both input and output
        if (outputOthersAddresses.length > 0) {// there are other address
            output = {
                direction: 'outcome',
                from: '', // inputMyAddress,
                to: outputOthersAddresses.join(','),
                value: outputOthersBN.get()
            }
        } else {
            output = {
                direction: 'self',
                from: '', // inputMyAddress,
                to: '', // outputMyAddress,
                value: Math.abs(inputMyBN.diff(outputMyBN).get())
            }
        }
    }
    output.from = output.from.substr(0, 255)
    output.to = output.to.substr(0, 255)
    output.allMyAddresses = allMyAddresses
    return output
}
