const INITIAL_STATE = {
    tipsRef: {},
}

const toolTips = (state = INITIAL_STATE, action) => {

    switch(action.type){
        case 'SET_TIP_REF':
            return new Object({
                tipsRef: {
                    ...state.tipsRef,
                    [action.name]: action.ref
                }
            })
    }

    return state
}

export default toolTips