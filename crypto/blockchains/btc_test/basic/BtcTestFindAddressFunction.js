/**
 * @version 0.5
 * @constructor
 */
import BlocksoftBN from '../../../common/BlocksoftBN'

export default async function BtcTestFindAddressFunction(address, transaction) {
    const indexedAddresses = {}
    indexedAddresses[address] = 1

    const inputMyBN = new BlocksoftBN(0)
    const inputOthersBN = new BlocksoftBN(0)
    const inputOthersAddresses = []
    const uniqueTmp = {}
    let inputMyAddress = ''
    if (transaction.inputs) {
        for (let i = 0, ic = transaction.inputs.length; i < ic; i++) {
            let vinAddress
            const vinValue = transaction.inputs[i].value_int
            if (typeof transaction.inputs[i].addresses !== 'undefined') {
                vinAddress = transaction.inputs[i].addresses[0]
            } else if (typeof transaction.inputs[i].addr !== 'undefined') {
                vinAddress = transaction.inputs[i].addr
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
    const outputOthersAddresses = []
    const uniqueTmp2 = {}

    let outputMyAddress = ''
    const allMyAddresses = []
    if (transaction.outputs) {
        for (let j = 0, jc = transaction.outputs.length; j < jc; j++) {
            let voutAddress
            const voutValue = transaction.outputs[j].value_int
            if (typeof transaction.outputs[j].addresses !== 'undefined') {
                voutAddress = transaction.outputs[j].addresses[0]
            } else if (typeof transaction.outputs[j].scriptPubKey !== 'undefined' && typeof transaction.outputs[j].scriptPubKey.addresses !== 'undefined') {
                voutAddress = transaction.outputs[j].scriptPubKey.addresses[0]
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
                value: inputMyBN.diff(outputMyBN).toString()
            }
        }
    }
    output.from = output.from.substr(0, 255)
    output.to = output.to.substr(0, 255)
    output.allMyAddresses = allMyAddresses
    return output
}
