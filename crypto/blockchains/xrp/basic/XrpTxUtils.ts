export namespace XrpTxUtils {
    export const amountPrep = function( current: string) : string {
        const tmp = current.toString().split('.')
        if (typeof tmp[1] !== 'undefined' && tmp[1].length > 6) {
            current = tmp[0] + '.' + tmp[1].substr(0, 6)
        }
        return current.toString()
    }
}
