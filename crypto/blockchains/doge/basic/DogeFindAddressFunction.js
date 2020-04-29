/**
 * @version 0.5
 * @param {string} addresses[]
 * @param {string} transaction.hex
 * @param {string} transaction.address
 * @param {string} transaction.vin[].txid aa31777a9db759f57fd243ef47419939f233d16bc3e535e9a1c5af3ace87cb54
 * @param {string} transaction.vin[].sequence 4294967294
 * @param {string} transaction.vin[].n 0
 * @param {string} transaction.vin[].addresses [ 'DFDn5QyHH9DiFBNFGMcyJT5uUpDvmBRDqH' ]
 * @param {string} transaction.vin[].addr '1HQzoxQsbjm44hc9rcJyX9KVmNAsyWyswB'
 * @param {string} transaction.vin[].value 44400000000
 * @param {string} transaction.vin[].hex 47304402200826f97d3432452abedd4346553de0b0c2d401ad7056b155e6462484afd98aa902202b5fb3166b96ded33249aecad7c667c0870c1
 * @param {string} transaction.vout[].value 59999824800
 * @param {string} transaction.vout[].n 0
 * @param {string} transaction.vout[].spent true
 * @param {string} transaction.vout[].hex 76a91456d49605503d4770cf1f32fbfb69676d9a72554f88ac
 * @param {string} transaction.vout[].addresses  [ 'DD4DKVTEkRUGs7qzN8b7q5LKmoE9mXsJk4' ]
 * @param {string} transaction.vout[].scriptPubKey.addresses[] [ '1HXmWQShG2VZ2GXb8J2CZmVTEoDUmeKyAQ' ]
 * @returns {Promise<{from: string, to: string, value: number, direction: string}>}
 * @constructor
 */
import BlocksoftUtils from '../../../common/BlocksoftUtils'

export default async function DogeFindAddressFunction(addresses, transaction) {

    let inputMy = BlocksoftUtils.toBigNumber(0)
    let inputOthers = BlocksoftUtils.toBigNumber(0)
    const inputOthersAddresses = []
    const uniqueTmp = {}

    const address1 = addresses[0]
    const address2 = addresses[addresses.length - 1] // two is max for now
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
            if (vinAddress === address1 || vinAddress === address2) {
                inputMy = inputMy.add(vinBN)
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

            if (voutAddress === address1 || voutAddress === address2) {
                outputMy = outputMy.add(voutBN)
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
            to: '', // address1,
            value: outputMy.toString()
        }
    } else if (outputMy.toString() === '0') { // my only in input
        output = {
            direction: 'outcome',
            from: '', // address1,
            to: outputOthersAddresses.length > 0 ? outputOthersAddresses.join(',') : '',
            value: (inputOthers.toString() === '0') ? outputOthers.toString() : inputMy.toString()
        }
    } else { // both input and output
        if (outputOthersAddresses.length > 0) {// there are other address
            output = {
                direction: 'outcome',
                from: '', // address1,
                to:  outputOthersAddresses.join(','),
                value: outputOthers.toString()
            }
        } else {
            output = {
                direction: 'self',
                from: '', // address1,
                to: '', // address1,
                value: inputMy.sub(outputMy).toString()
            }
        }
    }
    output.from = output.from.substr(0, 255)
    output.to = output.to.substr(0, 255)

    return output
}
