/**
 * @version 0.9
 */
import { createStore, applyMiddleware } from 'redux'
import thunk from 'redux-thunk'

import indexReducer from '../appstores/StoresIndex'

const store = createStore(
    indexReducer,
    applyMiddleware(thunk)
)

export default store
