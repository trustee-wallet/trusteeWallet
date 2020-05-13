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
import BlocksoftUtils from '../../../common/BlocksoftUtils'

export default async function BtcFindAddressFunction(indexedAddresses, transaction) {
    let inputMy = BlocksoftUtils.toBigNumber(0)
    let inputOthers = BlocksoftUtils.toBigNumber(0)
    let inputMyAddress = ''
    const inputOthersAddresses = []
    const uniqueTmp = {}
    if (transaction.vin) {
        for (let i = 0, ic = transaction.vin.length; i < ic; i++) {
            let vinAddress
            const vinValue = transaction.vin[i].value
            const vinBN = BlocksoftUtils.toBigNumber(vinValue)
            if (typeof transaction.vin[i].addresses !== 'undefined') {
                vinAddress = transaction.vin[i].addresses[0]
            } else if (typeof transaction.vin[i].addr !== 'undefined') {
                vinAddress = transaction.vin[i].addr
            }
            if (!vinAddress) continue
            if (typeof indexedAddresses[vinAddress] !== 'undefined') {
                inputMy = inputMy.add(vinBN)
                inputMyAddress = vinAddress
            } else {
                if (typeof uniqueTmp[vinAddress] === 'undefined') {
                    uniqueTmp[vinAddress] = 1
                    inputOthersAddresses.push(vinAddress)
                }
                inputOthers = inputOthers.add(vinBN)
            }
        }
    }

    let outputMy = BlocksoftUtils.toBigNumber(0)
    let outputOthers = BlocksoftUtils.toBigNumber(0)

    let outputMyAddress = ''
    const allMyAddresses = []
    const outputOthersAddresses = []
    const uniqueTmp2 = {}
    if (transaction.vout) {
        for (let j = 0, jc = transaction.vout.length; j < jc; j++) {
            let voutAddress
            const voutValue = transaction.vout[j].value
            const voutBN = BlocksoftUtils.toBigNumber(voutValue)
            if (typeof transaction.vout[j].addresses !== 'undefined') {
                voutAddress = transaction.vout[j].addresses[0]
            } else if (typeof transaction.vout[j].scriptPubKey !== 'undefined' && typeof transaction.vout[j].scriptPubKey.addresses !== 'undefined') {
                voutAddress = transaction.vout[j].scriptPubKey.addresses[0]
            }

            if (typeof indexedAddresses[voutAddress] !== 'undefined') {
                outputMy = outputMy.add(voutBN)
                outputMyAddress = voutAddress
                allMyAddresses.push(outputMyAddress)
            } else {
                if (typeof uniqueTmp2[voutAddress] === 'undefined') {
                    uniqueTmp2[voutAddress] = 1
                    outputOthersAddresses.push(voutAddress)
                }
                outputOthers = outputOthers.add(voutBN)
            }
        }
    }

    let output
    if (inputMy.toString() === '0') { // my only in output
        output = {
            direction: 'income',
            from: inputOthersAddresses.length > 0 ? inputOthersAddresses.join(',') : '',
            to: '', // outputMyAddress,
            value: outputMy.toString()
        }
    } else if (outputMy.toString() === '0') { // my only in input
        output = {
            direction: 'outcome',
            from: '', // inputMyAddress,
            to: outputOthersAddresses.length > 0 ? outputOthersAddresses.join(',') : '',
            value: (inputOthers.toString() === '0') ? outputOthers.toString() : inputMy.toString()
        }
    } else { // both input and output
        if (outputOthersAddresses.length > 0) {// there are other address
            output = {
                direction: 'outcome',
                from: '', // inputMyAddress,
                to: outputOthersAddresses.join(','),
                value: outputOthers.toString()
            }
        } else {
            output = {
                direction: 'self',
                from: '', // inputMyAddress,
                to: '', // outputMyAddress,
                value: Math.abs(inputMy.sub(outputMy).toString())
            }
        }
    }
    output.from = output.from.substr(0, 255)
    output.to = output.to.substr(0, 255)
    output.allMyAddresses = allMyAddresses
    return output
}
