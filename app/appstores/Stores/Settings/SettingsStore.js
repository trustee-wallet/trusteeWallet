const INITIAL_STATE = {
    data: {},
};

const settingsReducer = (state = INITIAL_STATE, action) => {
    switch(action.type){
        case 'UPDATE_SETTINGS':
            return new Object({
                data: action.settings
            });
    }

    return state;
};

export default settingsReducer;