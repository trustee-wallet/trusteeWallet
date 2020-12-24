/**
 * @version 0.30
 * @author ksu
 */
import Log from '../Log/Log'
import axios from 'axios'

export namespace Cards {
    export const getCountryCode = async (cardNumber : string) => {
        try {
            cardNumber = cardNumber.split(' ').join('')
            if (cardNumber.indexOf('220') === 0) {
                return '643'
            }

            const link = 'https://lookup.binlist.net/' + cardNumber
            Log.log('Cards.getCountryCode axios ' + link)
            const res = await axios.get(link)
            console.log('res', cardNumber, res)

            return res.data.country.numeric
        } catch (e) {
            Log.log('Cards.getCountryCode error ' + e.message)
        }

        return false
    }
}