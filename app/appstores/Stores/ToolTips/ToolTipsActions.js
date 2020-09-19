/**
 * @version 0.9
 */
import store from '../../../store'

const { dispatch } = store

export default new class ToolTipsActions {

    setToolTipState = (type) => {
        dispatch({ type })
    }

    setToolTipRef = (data) => {
        dispatch({
            type: 'SET_TIP_REF',
            ref: data.ref,
            name: data.name
        })
    }
}

