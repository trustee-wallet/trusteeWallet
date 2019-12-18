import store from '../../store'

const { dispatch } = store

import Log from '../../services/Log/Log'

export default new class ToolTipsActions {

    setToolTipState = (type) => {
        Log.log('ACT/ToolTipsActions started')

        dispatch({ type })

        Log.log('ACT/ToolTipsActions finished')
    }

    setToolTipRef = (data) => {
        Log.log('ToolTipsActions/setToolTipRef started')

        dispatch({
            type: 'SET_TIP_REF',
            ref: data.ref,
            name: data.name
        })

        Log.log('ToolTipsActions/ToolTipsActions finished')
    }
}

