/**
 * @version 0.50
 */
import { createStore, applyMiddleware, compose } from 'redux'
import thunk from 'redux-thunk'

import indexReducer from '@app/appstores/StoresIndex'

const store = createStore(
    indexReducer,
    compose(applyMiddleware(thunk))
)

export default store
