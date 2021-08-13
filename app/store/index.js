/**
 * @version 0.50
 */
import { createStore, applyMiddleware, compose } from 'redux'
import thunk from 'redux-thunk'

import indexReducer from '@app/appstores/StoresIndex'

const composeEnhancer = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose

const store = createStore(
    indexReducer,
    composeEnhancer(applyMiddleware(thunk))
)

export default store
