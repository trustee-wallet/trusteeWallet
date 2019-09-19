import store from '../../store';

const { dispatch } = store;

const lockScreen = {
    setFlowType: async (data) => {
        dispatch({
            type: 'SET_LOCK_SCREEN_FLOW_TYPE',
            flowType: data.flowType
        })
    }
};

export default lockScreen;
