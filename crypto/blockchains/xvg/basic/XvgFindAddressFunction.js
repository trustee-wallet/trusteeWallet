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
    let inputMaxValue = 0
    let inputMaxAddress = ''
    
    for (let input of tmp.inputs) {
        if (input.address) {
            let vinBN = BlocksoftUtils.toBigNumber(input.value)
            if (input.address === address) {
                inputMy = inputMy.add(vinBN)
            } else {
                if (inputMaxValue < input.value * 1) {
                    inputMaxAddress = input.address
                    inputMaxValue = input.value * 1
                }
                inputOthers = inputOthers.add(vinBN)
            }
        }
    }

    let outputMy = BlocksoftUtils.toBigNumber(0)
    let outputOthers = BlocksoftUtils.toBigNumber(0)
    let outputMaxValue = 0
    let outputMaxAddress = ''

    for (let output of tmp.outputs) {
        if (output.address) {
            let voutBN = BlocksoftUtils.toBigNumber(output.value)
            if (output.address === address) {
                outputMy = outputMy.add(voutBN)
            } else {
                if (outputMaxValue < output.value * 1) {
                    outputMaxAddress = output.address
                    outputMaxValue = output.value* 1
                }
                outputOthers = outputOthers.add(voutBN)
            }
        }
    }

    let output
    if (inputMy.toString() === '0') { //my only in output
        output = {
            direction: 'income',
            from: inputMaxAddress ? inputMaxAddress : 'mining',
            to: address,
            value: outputMy.toString()
        }
    } else if (outputMy.toString() === '0') { //my only in input
        output = {
            direction: 'outcome',
            from: address,
            to: outputMaxAddress,
            value: (inputOthers.toString() === '0') ? outputOthers.toString() : inputMy.toString()
        }
    } else { // both input and output
        if (outputMaxAddress) {// there are other address
            output = {
                direction: 'outcome',
                from: address,
                to: outputMaxAddress,
                value: outputOthers.toString()
            }
        } else {
            output = {
                direction: 'outcome',
                from: address,
                to: address,
                value: inputMy.sub(outputMy).toString()
            }
        }
    }

    return output
}
