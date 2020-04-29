/**
 * @version 0.9
 * @misha to add tests
 */
export default function prettyNumber(raw, fractionDigits = 5, whileNotNull = true) {

    const decimal = raw.toString().split('.')[1]

    if (whileNotNull && typeof decimal !== 'undefined') {
        while (true) {
            if ((+raw).toFixed(fractionDigits).split('.')[1] == 0)
                fractionDigits += 1
            else
                break
        }

        return (+raw).toFixed(fractionDigits)
    }

    return (+raw).toFixed(fractionDigits).replace(/([0-9]+(\.[0-9]+[1-9])?)(\.?0+$)/, '$1')
}
