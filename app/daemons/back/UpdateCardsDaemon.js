/**
 * @version 0.11
 */
import Log from '../../services/Log/Log'

import api from '../../services/Api/Api'

import cardDS from '../../appstores/DataSource/Card/Card'

import { setCards } from '../../appstores/Stores/Card/CardActions'

const CACHE_UNIQUE = {}

class UpdateCardsDaemon {

    /**
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

        const cards = await cardDS.getCards({isPenging : true})
        if (!cards || typeof cards === 'undefined' || cards.length === 0) {
            return false
        }

        let updated = false
        for (const card of cards) {
            // eslint-disable-next-line no-undef
            const data = new FormData()
            data.append('cardNumber', card.number)

            const cardJson = JSON.parse(card.cardVerificationJson)

            if (cardJson !== null && cardJson.verificationStatus === 'pending') {
                let res = await api.validateCard(data)
                res = await res.json()

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
        }
        CACHE_UNIQUE[params.unique] = new Date().getTime()

        if (!updated) return false
        await setCards()
    }

}

export default new UpdateCardsDaemon
