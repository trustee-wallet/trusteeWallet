/**
 * @version 0.9
 */
const INITIAL_STATE = {
    tipsRef: {}
}

const toolTipsStoreReducer = (state = INITIAL_STATE, action) => {

    switch (action.type) {
        case 'SET_TIP_REF':
            return {
                tipsRef: {
                    ...state.tipsRef,
                    [action.name]: action.ref
                }
            }
    }

    return state
}

export default toolTipsStoreReducer
