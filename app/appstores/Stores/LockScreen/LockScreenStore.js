const INITIAL_STATE = {
    flowType: ''
}

const lockScreenReducer = (state = INITIAL_STATE, action) => {
    switch(action.type){
        case 'SET_LOCK_SCREEN_FLOW_TYPE':
            return new Object({
                flowType: action.flowType
            })
        default:
            break
    }

    return state
}

export default lockScreenReducer
