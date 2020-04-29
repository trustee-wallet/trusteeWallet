/**
 * @version 0.9
 */
import Update from './Update'

import Log from '../../Log/Log'

import api from '../../Api/Api'

import cardDS from '../../../appstores/DataSource/Card/Card'
import { setCards } from '../../../appstores/Stores/Card/CardActions'


class UpdateCardsDaemon extends Update {

    _canUpdate = true

    constructor(props) {
        super(props)
        this.updateFunction = this.updateCardsDaemon
        this.tryCounter = 0
    }

    /**
     * @namespace Flow.updateCardsDaemon
     * @return {Promise<void>}
     */
    updateCardsDaemon = async () => {
        Log.daemon('UpdateCardsDaemon called')
        try {
            Log.daemon('UpdateCardsDaemon success')

            const cards = await cardDS.getCards()

            if (!cards || typeof cards === 'undefined' || cards.length === 0) {
                return false
            }

            for(const card of cards) {
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
                    await cardDS.updateCard(tmp)
                }
            }

            await setCards()

            this.tryCounter = 0
        } catch (e) {
            this._canUpdate = true
            if(Log.isNetworkError(e.message) && this.tryCounter < 10) {
                this.tryCounter++
                Log.daemon('UpdateCardsDaemon network try ' + this.tryCounter + ' ' + e.message)
            } else {
                Log.daemon('UpdateCardsDaemon notice ' + e.message)
            }
        }
    }

}

export default new UpdateCardsDaemon
