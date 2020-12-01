/**
 * @version 0.9
 */
const INITIAL_STATE = {
    cards: []
}

const cardStoreReducer = (state = INITIAL_STATE, action) => {
    switch (action.type) {
        case 'SET_CARDS':
            return new Object({
                ...state,
                cards: action.cards
            })
        default:
            return state
    }
}

export default cardStoreReducer
