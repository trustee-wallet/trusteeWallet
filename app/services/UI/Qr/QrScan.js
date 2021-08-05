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
    if (typeof param.data === 'undefined' || !param.data) {
        Log.log('Utils.QR no data, param', param)
        return false
    }
    try {

        MarketingEvent.logOnlyRealTime('qr_scan', param.data)

        let fullLink = param.data
        let tmp = param.data.split(':')
        if (tmp[0] === 'wc') {
            res.data.isWalletConnect = true
            if (typeof tmp[1] !== 'undefined') {
                tmp = tmp[1].split('?')
            }
            res.data.walletConnect = {
                fullLink,
                wc : tmp[0]
            }
            /*
            for now - not needed - wc too but lets keep
            if (typeof tmp[1] !== 'undefined') {
                tmp = tmp[1].split('&')
                for (let tmp1 of tmp) {
                    tmp1 = tmp1.split('=')
                    if (typeof tmp1[1] === 'undefined') continue
                    res.data.walletConnect[tmp1[0]] = decodeURI(tmp1[1])
                }
            }
            */
            return res
        } else if (!tmp[1] || tmp[1].length < 2) {
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
                res.data.currencyCode = 'XRP'
            } else if (network === 'stellar' || network === 'xlm') {
                res.data.currencyCode = 'XLM'
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
            } else if (network === 'monero') {
                res.data.currencyCode = 'XMR'
            } else if (network === 'binance' || network === 'bnb') {
                res.data.currencyCode = 'XLM'
            } else {
                res.data.currencyCode = 'BTC'
            }
            Log.log('Utils.QR currencyCode Scanned ' + res.data.currencyCode)
        }


        tmp = tmp.join(':')
        !tmp.includes('?') ? tmp += '?amount=' : null
        tmp = tmp.split('?')

        if (!tmp[0] || tmp[0].length < 5) {
            if (tmp[1].indexOf('bitpay') === -1) {
                throw new Error('no address ' + JSON.stringify(tmp))
            }
        }

        res.data.address = tmp[0]
        Log.log('Utils.QR address ' + res.data.address)
        res.status = 'success'

        tmp = tmp[1].split('&')
        res.data.amount = ''

        let sub
        let contract = false
        let symbol = false
        let coinbaseAddress = false

        if (res.data.address.length > 9 && res.data.address.substring(res.data.address.length - 9) === '/transfer') {
            // ethereum:0x6b175474e89094c44da98b954eedeac495271d0f/transfer?address=0x84071465e0eabae8bbf589b8338a1345ac0040b4
            contract = res.data.address.substring(0, res.data.address.length - 9).toUpperCase()
            Log.log('Utils.QR coinbaseContract ' + contract)
        }

        for (sub of tmp) {
            const tmp2 = sub.split('=')

            if (tmp2[0].toLowerCase() === 'address') {
                coinbaseAddress = typeof tmp2[1] !== 'undefined' ? tmp2[1].toUpperCase() : ''
                Log.log('Utils.QR coinbaseAddress ' + coinbaseAddress)
            } else if (tmp2[0].toLowerCase() === 'contractaddress') {
                contract = typeof tmp2[1] !== 'undefined' ? tmp2[1].toUpperCase() : ''
                Log.log('Utils.QR contract ' + contract)
            } else if (tmp2[0].toLowerCase() === 'symbol') {
                symbol = typeof tmp2[1] !== 'undefined' ? tmp2[1].toUpperCase() : ''
                Log.log('Utils.QR symbol ' + symbol)
            } else if (tmp2[0].toLowerCase() === 'amount') {
                res.data.amount = typeof tmp2[1] !== 'undefined' ? tmp2[1].toLowerCase() : ''
                res.data.inputType = 'CRYPTO'
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
                    if (res.data.amount) {
                        res.data.inputType = 'CRYPTO'
                    }
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
        if (found && coinbaseAddress) {
            res.data.address = coinbaseAddress
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
        Log.err('Utils.QR error ' + err.message)
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
