import store from '../../store'

const { dispatch } = store

import Log from '../../services/Log/Log'

export default new class ToolTipsActions {

    setToolTipState = (type) => {
        Log.log('ACT/ToolTipsActions started')

        dispatch({ type })

        Log.log('ACT/ToolTipsActions finished')
    }
}

