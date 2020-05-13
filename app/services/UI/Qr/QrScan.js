/**
 * @version 0.9
 */
import Log from '../../Log/Log'
import MarketingEvent from '../../Marketing/MarketingEvent'
import BlocksoftDict from '../../../../crypto/common/BlocksoftDict'
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
            } else if (network === 'bitcoingold' || network === 'btg') {
                res.data.currencyCode = 'BTG'
            } else if (network === 'bitcoinsv' || network === 'bsv') {
                res.data.currencyCode = 'BSV'
            } else if (network === 'tron' || network === 'trx') {
                res.data.currencyCode = 'TRX'
            } else if (network === 'ripple' || network === 'xrp') {
                res.data.currencyCode = 'RIPPLE'
            } else if (network === 'doge' || network === 'dogecoin') {
                res.data.currencyCode = 'DOGE'
            } else if (network === 'ethereum' || network === 'eth') {
                res.data.currencyCode = 'ETH'
            } else if (network === 'verge' || network === 'xvg') {
                res.data.currencyCode = 'XVG'
            } else if (network === 'bitcoin(testnet)') {
                res.data.currencyCode = 'BTC_TEST'
            } else if (network === 'ethereumropsten') {
                res.data.currencyCode = 'ETH_ROPSTEN'
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
        let contract = false
        let symbol = false
        for (sub of tmp) {
            const tmp2 = sub.split('=')

            if (tmp2[0].toLowerCase() === 'contractaddress') {
                contract = typeof tmp2[1] !== 'undefined' ? tmp2[1].toUpperCase() : ''
                Log.log('Utils.QR contract ' + contract)
            } else if (tmp2[0].toLowerCase() === 'symbol') {
                symbol = typeof tmp2[1] !== 'undefined' ? tmp2[1].toUpperCase() : ''
                Log.log('Utils.QR symbol ' + symbol)
            } else if (tmp2[0].toLowerCase() === 'amount') {
                res.data.amount = typeof tmp2[1] !== 'undefined' ? tmp2[1].toLowerCase() : ''
                Log.log('Utils.QR amount ' + res.data.amount)
            } else if (tmp2[0].toLowerCase() === 'needtodisable') {
                res.data.needToDisable = typeof tmp2[1] !== 'undefined' ? tmp2[1].toLowerCase() : ''
                Log.log('Utils.QR needToDisable ' + res.data.needToDisable)
            } else if (tmp2[0].toLowerCase() === 'label') {
                res.data.label = typeof tmp2[1] !== 'undefined' ? tmp2[1].toLowerCase() : ''
                res.data.label = decodeURI(res.data.label)
                Log.log('Utils.QR label ' + res.data.label)
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

        let found = false
        if (contract) {
            let code
            for (code in BlocksoftDict.Currencies) {
                let dictToken = false
                if (typeof BlocksoftDict.Currencies[code].tokenAddress !== 'undefined') {
                    dictToken = BlocksoftDict.Currencies[code].tokenAddress.toUpperCase()
                } else if (typeof BlocksoftDict.Currencies[code].tokenName !== 'undefined') {
                    dictToken = BlocksoftDict.Currencies[code].tokenName.toUpperCase()
                }
                if (!dictToken) continue
                if (dictToken === contract) {
                    res.data.currencyCode = code
                    Log.log('Utils.QR currencyCode by Contract ' + res.data.currencyCode)
                    found = true
                }
            }
        }
        if (!found && symbol) {
            const long = res.data.currencyCode + '_' + symbol
            if (typeof BlocksoftDict.Currencies[long] !== 'undefined') {
                res.data.currencyCode = long
                Log.log('Utils.QR currencyCide by Long ' + long)
            } else if (symbol === 'USDT') {
                if (res.data.currencyCode === 'BTC') {
                    res.data.currencyCode = 'USDT'
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
        if (currencyCode && currencyCode !== res.data.currencyCode) {
            res.data.parsedCurrencyCode = res.data.currencyCode
            res.data.currencyCode = currencyCode
            Log.log('Utils.QR is ok with updated currencyCode', res)
        } else {
            Log.log('Utils.QR is ok ', res)
        }
    }

    return res
}
