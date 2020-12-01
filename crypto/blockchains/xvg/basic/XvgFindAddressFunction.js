/**
 * @version 0.5
 * https://api.vergecurrency.network/node/api/XVG/mainnet/tx/abcda88bdb3968c5e444694ce3914cdec34f3afab73627bf201d34493d5e3aae/coins
 * @param {string} address
 * @param {string} tmp.inputs[].address
 * @param {string} tmp.inputs[].value
 * @param {string} tmp.outputs[].address
 * @param {string} tmp.outputs[].value
 * @returns {Promise<{from: string, to: string, value: number, direction: string}>}
 * @constructor
 */
import BlocksoftUtils from '../../../common/BlocksoftUtils'
import BlocksoftBN from '../../../common/BlocksoftBN'

export default async function XvgFindAddressFunction(address, tmp) {

    const inputMyBN = new BlocksoftBN(0)
    const inputOthersBN = new BlocksoftBN(0)
    const inputOthersAddresses = []
    const uniqueTmp = {}

    let input
    for (input of tmp.inputs) {
        if (input.address) {
            const vinAddress = input.address
            if (vinAddress === address) {
                inputMyBN.add(input.value)
            } else {
                if (typeof uniqueTmp[vinAddress] === 'undefined') {
                    uniqueTmp[vinAddress] = 1
                    inputOthersAddresses.push(vinAddress)
                }
                inputOthersBN.add(input.va)
            }
        }
    }

    const outputMyBN = new BlocksoftBN(0)
    const outputOthersBN = new BlocksoftBN(0)
    const outputOthersAddresses = []
    const uniqueTmp2 = {}

    let output
    for (output of tmp.outputs) {
        if (output.address) {
            const voutAddress = output.address
            if (output.address === address) {
                outputMyBN.add(output.value)
            } else {
                if (typeof uniqueTmp2[voutAddress] === 'undefined') {
                    uniqueTmp2[voutAddress] = 1
                    outputOthersAddresses.push(voutAddress)
                }
                outputOthersBN.add(output.value)
            }
        }
    }

    if (inputMyBN.get() === '0') { // my only in output
        output = {
            direction: 'income',
            from: inputOthersAddresses.length > 0 ? inputOthersAddresses.join(',') : '',
            to: '', // address,
            value: outputMyBN.get()
        }
    } else if (outputMyBN.get() === '0') { // my only in input
        output = {
            direction: 'outcome',
            from: '', // address,
            to: outputOthersAddresses.length > 0 ? outputOthersAddresses.join(',') : '',
            value: (inputOthersBN.get() === '0') ? outputOthersBN.get() : inputMyBN.get()
        }
    } else { // both input and output
        if (outputOthersAddresses.length > 0) {// there are other address
            output = {
                direction: 'outcome',
                from: '', // address,
                to: outputOthersAddresses.join(','),
                value: outputOthersBN.get()
            }
        } else {
            output = {
                direction: 'self',
                from: '', // address,
                to: '', // address,
                value: inputMyBN.diff(outputMyBN).get()
            }
        }
    }
    output.from = output.from.substr(0, 255)
    output.to = output.to.substr(0, 255)


    return output
}
