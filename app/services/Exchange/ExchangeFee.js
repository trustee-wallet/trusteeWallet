/**
 * @version 0.9
 */
import { SIDE_FIAT, SIDE_CRYPTO, ACTION_SELL, ACTION_BUY } from './ExchangeConstants'

export const applyFee = (amount, precision, feePercentage, type, side) => {
    const mul = feePercentage / 100
    const fee = roundNumber((amount * mul), precision)

    switch (side) {
        case ACTION_BUY:
            if (type === SIDE_CRYPTO)
                return roundNumber((amount + fee), precision)
            if (type === SIDE_FIAT)
                return roundNumber((amount - fee), precision)

        case ACTION_SELL:
            if (type === SIDE_CRYPTO)
                return roundNumber((amount - fee), precision)
            if (type === SIDE_FIAT)
                return roundNumber((amount + fee), precision)

        default:
            throw new Error('ExchangeFee.applyFee – Invalid side')
    }
}


export const convertCurrency = (amount, exchangeRate, precision, type) => {
    switch (type) {
        case SIDE_CRYPTO:
            return roundNumber((amount * exchangeRate), precision)

        case SIDE_FIAT:
            return roundNumber((amount / exchangeRate), precision)

        default:
            throw new Error('ExchangeFee.convertCurrency – Invalid type')
    }
}

export const applyWithdrawFee = (amount, withdrawFee, precision, type, side) => {
    switch (side) {
        case ACTION_BUY:
            if (type === SIDE_CRYPTO)
                return roundNumber((amount + withdrawFee), precision)
            if (type === SIDE_FIAT)
                return roundNumber((amount - withdrawFee), precision)

        case ACTION_SELL:
            const mul = withdrawFee.percentage / 100
            const fee = roundNumber((amount * mul), precision)

            if (type === SIDE_CRYPTO) {
                amount = roundNumber((amount - fee), precision)
                return roundNumber((amount - withdrawFee.fixed), precision)
            }
            if (type === SIDE_FIAT) {
                amount = roundNumber((amount + fee), precision)
                return roundNumber((amount + withdrawFee.fixed), precision)
            }

        default:
            throw new Error('ExchangeFee.applyWithdrawFee – Invalid side : ' + side)
    }
}

export const applyPayinFeeFiat = (amount, fees, type) => {
    let result = {}
    const mul = fees.percentage / 100

    switch (type) {
        case SIDE_CRYPTO:
            let fee = roundNumber((amount * mul), 2)
            if (fees.operation === '+') {
                result.sendToApiFiat = amount
                amount = roundNumber((amount + fee), 2)
                amount = roundNumber((amount + fees.fixed), 2)
                result.amountFiat = amount
                return result
            }

            if (fees.operation === '-') {
                amount = roundNumber((amount + fee), 2)
                amount = roundNumber((amount + fees.fixed), 2)
                result.sendToApiFiat = amount
                result.amountFiat = amount
                return result
            }

        case SIDE_FIAT:
            if (fees.operation === '+') {
                amount = roundNumber((amount - fees.fixed), 2)
                amount = roundNumber((amount / (mul + 1)), 2) // Reason example: x + 0.015x = amount;    1.015x = amount;    x = amount / 1.015;
                result.sendToApiFiat = amount
                result.amountFiat = amount
                return result
            }

            if (fees.operation === '-') {
                result.sendToApiFiat = amount
                amount = roundNumber((amount - fees.fixed), 2)
                result.amountFiat = roundNumber((amount / (mul + 1)), 2) // Reason example (fee = 1.5%):   x + 0.015x = amount;    1.015x = amount;    x = amount / 1.015;
                return result
            }

        default:
            throw new Error('applyPayinFeeFiat – Invalid type')
    }
}

export const getTrusteeFee = (amount, feePercentage) => {
    let mul = feePercentage / 100
    return {
        percentage: feePercentage,
        equivalent: roundNumber((amount * mul), 2) <= 0 ? 0 : roundNumber((amount * mul), 2)
    }
}

const roundNumber = (number, precision) => {
    const round = Math.pow(10, precision)
    return Math.round(number * round) / round
}
