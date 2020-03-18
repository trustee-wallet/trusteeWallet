import Log from '../Log/Log'
import MarketingEvent from '../Marketing/MarketingEvent'
import BlocksoftDict from '../../../crypto/common/BlocksoftDict'
import _ from 'lodash'

const axios = require('axios')

export async function decodeTransactionQrCode(param, currencyCode) {
    const res = {
        status: '',
        data: {}
    }

    Log.log('Utils.QR started', param)
    try {

        MarketingEvent.logOnlyRealTime('qr_scan', param.data)

        let tmp = param.data.split(':')
        if (!tmp[1] || tmp[1].length < 2) {
            if (!currencyCode) {
                MarketingEvent.logOnlyRealTime('qr_error_no_network', param.data)
                return {
                    status: 'fail',
                    data: {
                        parsedUrl: param.data
                    }
                }
            } else {
                res.data.currencyCode = currencyCode
                Log.log('Utils.QR currencyCode Auto ' + res.data.currencyCode)
            }
        } else {
            const network = tmp[0].toLowerCase()
            tmp.shift()
            if (network === 'litecoin' || network === 'ltc') {
                res.data.currencyCode = 'LTC'
            } else if (network === 'ripple' || network === 'xrp') {
                res.data.currencyCode = 'RIPPLE'
            } else if (network === 'doge') {
                res.data.currencyCode = 'DOGE'
            } else if (network === 'ethereum' || network === 'eth') {
                res.data.currencyCode = 'ETH'
            } else if (network === 'verge' || network === 'xvg') {
                res.data.currencyCode = 'XVG'
            } else {
                res.data.currencyCode = 'BTC'
            }
            Log.log('Utils.QR currencyCode Scanned ' + res.data.currencyCode)
        }



        tmp = tmp.join(':')
        !tmp.includes('?') ? tmp += '?amount=' : null
        tmp = tmp.split('?')

        if (!tmp[0] || tmp[0].length < 5) {
            throw new Error('no address ' + JSON.stringify(tmp))
        }

        res.data.address = tmp[0]
        Log.log('Utils.QR address ' + res.data.address)
        res.status = 'success'



        tmp = tmp[1].split('&')
        res.data.amount = ''

        let sub
        for (sub of tmp) {
            const tmp2 = sub.split('=')
            console.log(sub)
            if (tmp2[0].toLowerCase() === 'contractaddress') {
                const contract = tmp2[1].toLowerCase()
                let code
                for (code in BlocksoftDict.Currencies) {
                    if (typeof BlocksoftDict.Currencies[code].tokenAddress === 'undefined') continue
                    if ( BlocksoftDict.Currencies[code].tokenAddress.toLowerCase() === contract) {
                        res.data.currencyCode = code
                        Log.log('Utils.QR currencyCode by Contract ' + res.data.currencyCode)
                        break
                    }
                }
            } else if (tmp2[0].toLowerCase() === 'amount') {
                res.data.amount = typeof tmp2[1] !== 'undefined' ? tmp2[1].toLowerCase() : ''
                Log.log('Utils.QR amount ' + res.data.amount)
            } else if (tmp2[0].toLowerCase() === 'r') {
                Log.log('Utils.QR bitpay link ' + tmp2[1])
                const bitpay = await axios.get(tmp2[1], {
                    headers: {
                        'Accept': 'application/payment-request'
                    }
                })
                if (typeof bitpay.data.outputs !== 'undefined' && typeof bitpay.data.outputs[0] !== 'undefined') {
                    res.data.currencyCode = bitpay.data.currency
                    res.data.amount = bitpay.data.outputs[0].amount
                    res.data.address = bitpay.data.outputs[0].address
                    res.data.memo = bitpay.data.memo
                }
            }
        }

    } catch (err) {
        Log.err('Utils.QR error ' + err.message.toString())
    }


    if (_.isEmpty(res.data)) {
        Log.err('Utils.QR is empty ', res.data)
        res.status = 'fail'
        res.data.parsedUrl = param.data
    } else {
        Log.log('Utils.QR is ok ', res)
    }

    return res
}
