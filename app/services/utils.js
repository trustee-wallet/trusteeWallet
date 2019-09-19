import { Clipboard } from 'react-native'
import bip21 from 'bip21'
import { parse } from 'eth-url-parser'
import _ from 'lodash'


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

export function decodeTransactionQrCode(param) {
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

    try {
        const data = bip21.decode(param.data);
        res.status = 'success';
        res.data.address = data.address;
        res.data.amount =  typeof data.options.amount != 'undefined' ? data.options.amount : '';
        res.data.currencyCode = 'BTC';
    } catch (err) {
        error = err;
    }

    if(_.isEmpty(res.data)) {
        res.status = 'fail';
        res.data.parsedUrl = param.data;
    }

    return res;
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

};

export default utils;