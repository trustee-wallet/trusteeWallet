/**
 * @version 0.11
 * @param val
 * @returns {string}
 */
export const normalizeInputWithDecimals = (val, decimals) => {
    let tmpSplit
    if (typeof val === 'undefined' || !val) return ''
    let value = val.toString().replace(',', '.')

    value = value
        .replace(/[^\d.]/g, '')
        .replace(/(\..*)\./g, '$1')
    //value = value.replace(/[^0-9.]*/g, '')
    //value = value.replace(/\.{2,}/g, '.')
    //value = value.replace(/\.,/g, ',');
    //value = value.replace(/\,\./g, ',');
    //value = value.replace(/\,{2,}/g, ',');
    //value = value.replace(/\.[0-9]+\./g, '.')

    let splitted = 0
    if (!decimals) {
        value = value.replace('.', '')
    } else {
        tmpSplit = value.split('.')
        if (typeof tmpSplit[1] !== 'undefined') {
            splitted = tmpSplit[1]
            if (tmpSplit[1].length > 2) {
                value = tmpSplit[0] + '.' + tmpSplit[1].substring(0, decimals)
            }
        }
    }

    if (value[0] === '0') {
        if (value[1] === '0') {
            return '0'
        } else if (splitted * 1 > 0) {
            return '0.' + splitted
        } else if (value[1] === '.') {
            if (value.toString().length > 2) {
                return value
            } else {
                return '0.'
            }
        } else if (value[1] * 1 > 0) {
            return value.substring(1)
        } else {
            return '0'
        }
    } else if (value === '.') {
        return '0.'
    } else if (!value) {
        return ''
    } else {
        return value
    }
}
