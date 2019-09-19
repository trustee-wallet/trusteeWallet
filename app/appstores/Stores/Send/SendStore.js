const INITIAL_STATE = {
    data: {}
};

const sendStoreReducer = (state = INITIAL_STATE, action) => {
    switch(action.type){
        case 'SET_SEND_DATA':
            return new Object({
                ...state,
                data: action.data,
            });
        case 'CLEAR_SEND_DATA':
            return new Object({
                ...INITIAL_STATE
            });
        default:
            return state;
    }
};

export default sendStoreReducer;