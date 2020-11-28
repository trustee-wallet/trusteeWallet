export default function fixBalance(obj, pref) {
    if (typeof obj === 'undefined') return 0

    let balance
    if (typeof (obj[pref + 'Txt']) !== 'undefined') {
        balance = obj[pref + 'Txt']
    } else {
        balance = obj[pref + '_txt']
    }
    if (balance && balance * 1 > 0) {
        return balance
    }

    if (typeof (obj[pref + 'Fix']) !== 'undefined') {
        balance = obj[pref + 'Fix']
    } else {
        balance = obj[pref + '_fix']
    }
    if (!balance) {
        return '0'
    }
    if (balance.toString().indexOf('e') === -1) {
        return balance
    }

    return 0
}

