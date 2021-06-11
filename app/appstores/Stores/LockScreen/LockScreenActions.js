/**
 * @version 0.42
 */
import store from '@app/store'

const { dispatch } = store

const lockScreen = {
    setFlowType: async (data) => {
        dispatch({
            type: 'SET_LOCK_SCREEN_FLOW_TYPE',
            flowType: data.flowType
        })
    },
    setBackData: async (data) => {
        dispatch({
            type: 'SET_LOCK_SCREEN_BACK_DATA',
            backData: data.backData
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
