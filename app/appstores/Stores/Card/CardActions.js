/**
 * @version 0.9
 */
import store from '../../../store'

import Log from '../../../services/Log/Log'
import cardDS from '../../DataSource/Card/Card'
import { setLoaderStatus } from '../Main/MainStoreActions'

const { dispatch } = store

export async function setCards() {
    try {
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
    } catch (e) {
        throw new Error(e.message + ' on setCards')
    }
}

export async function deleteCard(cardID) {
    setLoaderStatus(true)

    try {
        await cardDS.deleteCard(cardID)
        await setCards()
    } catch (e) {
        Log.err('ACT/Cards deleteCard error ' + e.message)
    }

    setLoaderStatus(false)
}
