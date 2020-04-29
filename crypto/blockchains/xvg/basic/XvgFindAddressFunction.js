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

export default async function XvgFindAddressFunction(address, tmp) {

    let inputMy = BlocksoftUtils.toBigNumber(0)
    let inputOthers = BlocksoftUtils.toBigNumber(0)
    const inputOthersAddresses = []
    const uniqueTmp = {}

    let input
    for (input of tmp.inputs) {
        if (input.address) {
            const vinAddress = input.address
            const vinBN = BlocksoftUtils.toBigNumber(input.value)
            if (vinAddress === address) {
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

    let output
    for (output of tmp.outputs) {
        if (output.address) {
            const voutBN = BlocksoftUtils.toBigNumber(output.value)
            const voutAddress = output.address
            if (output.address === address) {
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

    if (inputMy.toString() === '0') { // my only in output
        output = {
            direction: 'income',
            from: inputOthersAddresses.length > 0 ? inputOthersAddresses.join(',') : '',
            to: '', // address,
            value: outputMy.toString()
        }
    } else if (outputMy.toString() === '0') { // my only in input
        output = {
            direction: 'outcome',
            from: '', // address,
            to: outputOthersAddresses.length > 0 ? outputOthersAddresses.join(',') : '',
            value: (inputOthers.toString() === '0') ? outputOthers.toString() : inputMy.toString()
        }
    } else { // both input and output
        if (outputOthersAddresses.length > 0) {// there are other address
            output = {
                direction: 'outcome',
                from: '', // address,
                to: outputOthersAddresses.join(','),
                value: outputOthers.toString()
            }
        } else {
            output = {
                direction: 'self',
                from: '', // address,
                to: '', // address,
                value: inputMy.sub(outputMy).toString()
            }
        }
    }
    output.from = output.from.substr(0, 255)
    output.to = output.to.substr(0, 255)


    return output
}
