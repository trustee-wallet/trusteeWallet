/**
 * @version 0.12
 * @author yura
 */
import Log from '../../services/Log/Log'

import Api from '../../services/Api/Api'
import ApiV3 from '../../services/Api/ApiV3'

import cardDS from '../../appstores/DataSource/Card/Card'

import { setCards } from '../../appstores/Stores/Card/CardActions'

import CashBackUtils from '../../appstores/Stores/CashBack/CashBackUtils'
import BlocksoftAxios from '../../../crypto/common/BlocksoftAxios'

const CACHE_UNIQUE = {}

const V3_API = 'https://api.v3.trustee.deals'

class UpdateCardsDaemon {

    /**
     * @string params.numberCard
     * @return {Promise<void>}
     */
    updateCardsDaemon = async (params) => {
        Log.daemon('UpdateCardsDaemon called')
        if (params) {
            if (typeof params.unique !== 'undefined') {
                const now = new Date().getTime()
                if (typeof CACHE_UNIQUE[params.unique] !== 'undefined' && now - CACHE_UNIQUE[params.unique] < 30000) {
                    return false
                }
                CACHE_UNIQUE[params.unique] = now
            }
        }

        const allCards = await cardDS.getCards()

        const toVerifyParams = {isPenging : true}
        if (typeof params.numberCard !== 'undefined') {
            toVerifyParams.number = params.numberCard
        }

        const cards = await cardDS.getCards(toVerifyParams)

        if (!cards || typeof cards === 'undefined' || cards.length === 0) {
            return false
        }

        let updated = false
        let res = false
        for (const card of cards) {
            try {
                // eslint-disable-next-line no-undef
                const data = new FormData()
                data.append('cardNumber', card.number)

                if (card.verificationServer === 'V3') {
                    let msg = ''
                    try {
                        Log.daemon('UpdateCardsDaemon will ask time from server')
                        const now = await BlocksoftAxios.get(V3_API + '/data/server-time')
                        if (now && typeof now.data !== 'undefined' && typeof now.data.serverTime !== 'undefined') {
                            msg = now.data.serverTime
                            Log.daemon('UpdateCardsDaemon msg from server ' + msg)
                        }
                    } catch (e) {
                        // do nothing
                    }

                    const sign = await CashBackUtils.createWalletSignature(true, msg)

                    if (typeof sign !== 'undefined' && sign !== null) {
                        data.append('signMessage', sign.message)
                        data.append('signMessageHash', sign.messageHash)
                        data.append('signature', sign.signature)
                    }

                    const cashbackToken = CashBackUtils.getWalletToken()

                    typeof cashbackToken !== 'undefined' && cashbackToken !== null ?
                        data.append('cashbackToken', cashbackToken) : null
                }

                const cardJson = JSON.parse(card.cardVerificationJson)

                res = false
                if (cardJson !== null && cardJson.verificationStatus.toLowerCase() === 'pending') {
                    if (card.verificationServer === 'V3') {
                        res = await ApiV3.validateCard(data)
                        res = res.data
                    } else {
                        res = await Api.validateCard(data)
                        res = await res.json()
                    }

                    const tmp = {
                        key: {
                            id: card.id
                        },
                        updateObj: {
                            cardVerificationJson: JSON.stringify(res)
                        }
                    }
                    Log.daemon('UpdateCards verification from Server ', tmp)

                    await cardDS.updateCard(tmp)
                    updated = true
                }
            } catch (e) {
                if (e.message.indexOf('PaymentDetailsModule | ValidateCard | No file was uploaded')) {
                    // если нет карты - то это не ошибка вообще то
                    console.log('UpdateCards verification no photo still', card)
                } else {
                    Log.err('UpdateCards verification error ' + e.message, card)
                }
            }
        }
        CACHE_UNIQUE[params.unique] = new Date().getTime()

        if (!updated) return false
        await setCards()

        if (typeof params.numberCard !== 'undefined') {
            return res
        }
        return true
    }

}

export default new UpdateCardsDaemon
