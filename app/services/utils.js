import { Clipboard, Linking, Platform } from 'react-native'
import { parse } from 'eth-url-parser'
import _ from 'lodash'
import { check, PERMISSIONS, request } from 'react-native-permissions'
import Log from './Log/Log'
import { setQRConfig, setQRValue } from '../appstores/Actions/QRCodeScannerActions'
import { strings } from './i18n'
import NavStore from '../components/navigation/NavStore'
import { showModal } from '../appstores/Actions/ModalActions'

const axios = require('axios')

export function copyToClipboard(data) {
    Clipboard.setString(data);
}

export function renderError(field, array){
    if(array.length > 0){
        let result = array.find((array) => { return array.field === field; });
        if(typeof result != 'undefined'){
            return result.msg;
        }
    }
    else return '';
}

export function removeByKey(array, params){
    array.some(function(item, index) {
        return (array[index][params.key] === params.value) ? !!(array.splice(index, 1)) : false;
    });
    return array;
}

export function getArrayItem(field, array){
    if(array.length > 0){
        let result = array.find((array) => { return array.field === field; });
        if(typeof result != 'undefined'){
            return result.msg;
        }
    }
    else return '';
}

export const capitalize = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
};

export function normalizeWithDecimals(val, decimals) {
    let tmpSplit;
    let value = val.replace(/\,/g, '.');
    value = value.replace(/[^0-9.]*/g, '');
    value = value.replace(/\.{2,}/g, '.');
    //value = value.replace(/\.,/g, ',');
    //value = value.replace(/\,\./g, ',');
    //value = value.replace(/\,{2,}/g, ',');
    value = value.replace(/\.[0-9]+\./g, '.');

    tmpSplit = value.split('.');

    if(typeof tmpSplit[1] != 'undefined' && tmpSplit[1].length > 2){
        value = tmpSplit[0] + "." + tmpSplit[1].substring(0, decimals);
    }

    value = (value[0] == '0' && value[1] == '0') || (value[0] == '0' && +value[1]) ? '0' : value;
    return !value || value == '.' ? '' : value
}

export async function decodeTransactionQrCode(param) {
    let error = {};
    const res = {
        status : '',
        data : {}
    };

    try {
        const data = parse(param.data);
        res.status = 'success';
        res.data.address = data.target_address;
        if(typeof data.parameters != 'undefined'){
            if(typeof data.parameters.value != 'undefined'){
                res.data.amount = data.parameters.value;
            } else if(typeof data.parameters.amount != 'undefined') {
                res.data.amount = data.parameters.amount;
            } else {
                res.data.amount = '';
            }
        } else {
            res.data.amount = '';
        }

        res.data.currencyCode = 'ETH';

    } catch (err) {
        error = err;
    }

    if (res.status !== 'success') {
        try {

            let tmp = param.data.split(':')
            let network = tmp[0].toLowerCase()
            if (!tmp[1] || tmp[1].length < 5) {
                throw new Error('no network ' + JSON.stringify(tmp))
            }
            tmp.shift()

            tmp = tmp.join(':')
            !tmp.includes('?') ? tmp += "?amount=" : null
            tmp = tmp.split('?')

            res.data.address = tmp[0];
            res.status = 'success';

            if (network === 'litecoin' || network === 'ltc') {
                res.data.currencyCode = 'LTC';
            } else if (network === 'doge') {
                res.data.currencyCode = 'DOGE';
            } else if (network === 'ethereum' || network === 'eth') {
                res.data.currencyCode = 'ETH';
            } else if (network === 'verge' || network === 'xvg') {
                res.data.currencyCode = 'XVG';
            } else {
                res.data.currencyCode = 'BTC';
            }

            if (!tmp[1] || tmp[1].length < 5) {
                throw new Error('no address ' + JSON.stringify(tmp))
            }

            tmp = tmp[1].split('&')
            res.data.amount = ''

            for (let sub of tmp) {
                let tmp2 = sub.split('=')
                if (tmp2[0].toLowerCase() === 'amount') {
                    res.data.amount = typeof tmp2[1] != 'undefined' ? tmp2[1].toLowerCase() : '';
                } else if (tmp2[0].toLowerCase() === 'r') {
                    let bitpay = await axios.get(tmp2[1], {
                        headers: {
                            "Accept": 'application/payment-request'
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
            console.log(err)
            error = err;
        }
    }

    if(_.isEmpty(res.data)) {
        res.status = 'fail';
        res.data.parsedUrl = param.data;
    }

    return res;
}

export const checkQRPermission = async (callback) => {
    if(Platform.OS === 'android'){
        const res = await check(PERMISSIONS.ANDROID.CAMERA)

        console.log(res)

        if(res === 'blocked' || res === 'denied'){
            request(
                Platform.select({
                    android: PERMISSIONS.ANDROID.CAMERA,
                }),
            ).then((res) => {
                if(res !== 'denied'){
                    callback()
                }
            })
        } else {
            callback()
        }
    }

    if(Platform.OS === 'ios'){
        const res = await check(PERMISSIONS.IOS.CAMERA)


        if(res === 'denied'){
            request(
                Platform.select({
                    ios: PERMISSIONS.IOS.CAMERA,
                }),
            ).then((res) => {

                if(res === 'blocked'){
                    showModal({
                        type: 'OPEN_SETTINGS_MODAL',
                        icon: false,
                        title: strings('modal.openSettingsModal.title'),
                        description: strings('modal.openSettingsModal.description'),
                        btnSubmitText: strings('modal.openSettingsModal.btnSubmitText'),
                        btnCancelCallback: () => {  }
                    }, () => {
                        Linking.openURL('app-settings:')
                    })
                } else {
                    callback()
                }
            })
        } else if(res === 'blocked'){
            showModal({
                type: 'OPEN_SETTINGS_MODAL',
                icon: false,
                title: strings('modal.openSettingsModal.title'),
                description: strings('modal.openSettingsModal.description'),
                btnSubmitText: strings('modal.openSettingsModal.btnSubmitText'),
                btnCancelCallback: () => {  }
            }, () => {
                Linking.openURL('app-settings:')
            })
        } else {
            callback()
        }
    }
}

const utils = {

    langCodeToWord: (data) => {
        switch(data) {
            case 'ru-RU':
                return 'Russian';
            case 'en-US':
                return 'English';
            default:
                break;
        }
    },

    prettierNumber: (raw, fractionDigits = 5, whileNotNull = true) => {

        const decimal = raw.toString().split(".")[1]

        if(whileNotNull && typeof decimal != "undefined"){
            while(true){
                if((+raw).toFixed(fractionDigits).split(".")[1] == 0)
                    fractionDigits += 1
                else
                    break
            }

            return (+raw).toFixed(fractionDigits)
        }

        return (+raw).toFixed(fractionDigits).replace(/([0-9]+(\.[0-9]+[1-9])?)(\.?0+$)/,'$1')
    }


}

export default utils
