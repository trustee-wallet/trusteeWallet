/**
 * @version 0.9
 */
import store from '../../../store'

import Log from '../../../services/Log/Log'
import cardDS from '../../DataSource/Card/Card'
import { setLoaderStatus } from '../Main/MainStoreActions'

const { dispatch } = store

export async function setCards() {
    Log.log('ACT/Cards setCards called')

    let cards = await cardDS.getCards()
    if (!cards) {
        cards = []
    }
    cards.unshift({
        name: 'Add new card',
        type: 'ADD',
    })


    dispatch({
        type: 'SET_CARDS',
        cards
    })

    Log.log('ACT/Cards setCards finished')
}

export async function deleteCard(cardID) {
    Log.log('ACT/Cards deleteCard called')

    setLoaderStatus(true)

    try {
        await cardDS.deleteCard(cardID)
        await setCards()
        Log.log('ACT/Cards deleteCard finished')
    } catch (e) {
        Log.err('ACT/Cards deleteCard error ' + e.message)
    }

    setLoaderStatus(false)
}
