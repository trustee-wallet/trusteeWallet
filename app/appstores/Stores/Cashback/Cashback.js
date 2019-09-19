const INITIAL_STATE = {
    data: {
        cashbackBalance: '...',
        level2: null,
        weeklyVolume: '...',
        overalVolume: '...',
        invitedUsers: '...',
        cashbackLink: '...'
    }
}

const cashbackStore = (state = INITIAL_STATE, action) => {
    switch(action.type){
        case 'SET_CASHBACK_DATA':
            return new Object({
                ...state,
                data: action.data,
            })
        case 'SET_DEFAULT_CASHBACK_DATA':
            return new Object({
                ...state,
                data: INITIAL_STATE.data,
            })
        default:
            return state
    }
}

export default cashbackStore