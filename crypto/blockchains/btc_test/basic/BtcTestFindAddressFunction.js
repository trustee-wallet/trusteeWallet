/**
 * @version 0.5
 * @constructor
 */
import BlocksoftUtils from '../../../common/BlocksoftUtils'

export default async function BtcTestFindAddressFunction(address, transaction) {
    const indexedAddresses = {}
    indexedAddresses[address] = 1

    let inputMy = BlocksoftUtils.toBigNumber(0)
    let inputOthers = BlocksoftUtils.toBigNumber(0)
    let inputMaxValue = 0
    let inputMaxAddress = ''
    let inputMyAddress = ''
    if (transaction.inputs) {
        for (let i = 0, ic = transaction.inputs.length; i < ic; i++) {
            let vinAddress
            const vinValue = transaction.inputs[i].value_int
            const vinBN = BlocksoftUtils.toBigNumber(vinValue)
            if (typeof transaction.inputs[i].addresses !== 'undefined') {
                vinAddress = transaction.inputs[i].addresses[0]
            } else if (typeof transaction.inputs[i].addr !== 'undefined') {
                vinAddress = transaction.inputs[i].addr
            }
            if (typeof indexedAddresses[vinAddress] !== 'undefined') {
                inputMy = inputMy.add(vinBN)
                inputMyAddress = vinAddress
            } else {
                if (inputMaxValue < vinValue * 1 && vinAddress) {
                    inputMaxAddress = vinAddress
                    inputMaxValue = vinValue * 1
                }
                inputOthers = inputOthers.add(vinBN)
            }
        }
    }
    let outputMy = BlocksoftUtils.toBigNumber(0)
    let outputOthers = BlocksoftUtils.toBigNumber(0)
    let outputMaxValue = 0
    let outputMaxAddress = ''

    let outputMyAddress = ''
    const allMyAddresses = []
    if (transaction.outputs) {
        for (let j = 0, jc = transaction.outputs.length; j < jc; j++) {
            let voutAddress
            const voutValue = transaction.outputs[j].value_int
            const voutBN = BlocksoftUtils.toBigNumber(voutValue)
            if (typeof transaction.outputs[j].addresses !== 'undefined') {
                voutAddress = transaction.outputs[j].addresses[0]
            } else if (typeof transaction.outputs[j].scriptPubKey !== 'undefined' && typeof transaction.outputs[j].scriptPubKey.addresses !== 'undefined') {
                voutAddress = transaction.outputs[j].scriptPubKey.addresses[0]
            }

            if (typeof indexedAddresses[voutAddress] !== 'undefined') {
                outputMy = outputMy.add(voutBN)
                outputMyAddress = voutAddress
                allMyAddresses.push(outputMyAddress)
            } else {
                if (outputMaxValue < voutValue * 1 && voutAddress) {
                    outputMaxAddress = voutAddress
                    outputMaxValue = voutValue * 1
                }
                outputOthers = outputOthers.add(voutBN)
            }
        }
    }

    let output
    if (inputMy.toString() === '0') { // my only in output
        output = {
            direction: 'income',
            from: inputMaxAddress || 'mining',
            to: outputMyAddress,
            value: outputMy.toString()
        }
    } else if (outputMy.toString() === '0') { // my only in input
        output = {
            direction: 'outcome',
            from: inputMyAddress,
            to: outputMaxAddress,
            value: (inputOthers.toString() === '0') ? outputOthers.toString() : inputMy.toString()
        }
    } else { // both input and output
        if (outputMaxAddress) {// there are other address
            output = {
                direction: 'outcome',
                from: inputMyAddress,
                to: outputMaxAddress,
                value: outputOthers.toString()
            }
        } else {
            output = {
                direction: 'outcome',
                from: inputMyAddress,
                to: outputMyAddress,
                value: inputMy.sub(outputMy).toString()
            }
        }
    }
    output.allMyAddresses = allMyAddresses
    return output
}
