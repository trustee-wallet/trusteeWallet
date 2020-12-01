/**
 * @version 0.9
 */
import store from '../../../store'

const { dispatch } = store

const lockScreen = {
    setFlowType: async (data) => {
        dispatch({
            type: 'SET_LOCK_SCREEN_FLOW_TYPE',
            flowType: data.flowType
        })
    },
    setActionCallback: async (data) => {
        dispatch({
            type: 'SET_ACTION_CALLBACK',
            actionCallback: data.actionCallback
        })
    }
}

export default lockScreen
