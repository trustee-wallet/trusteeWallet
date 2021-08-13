/**
 * @version 0.45
 */

 const INITIAL_STATE = {
    userId : false,
    userToken : false,
    userName : false,
    loginTime : false,
    serverUrl : false,
    roomId : false,
    messages : [
        {
            _id: 1,
            text: 'Messages are loading...',
            createdAt: new Date(),
            user: {
                _id: '0',
                name: 'System'
            }
        }
    ],
    loaded : false
}

const streamSupportStoreReducer = (state = INITIAL_STATE, action) => {
    switch (action.type) {
        case 'SET_STREAM_SUPPORT_DATA':
            return {
                ...state,
                userId: action.userId || false,
                userToken: action.userToken || false,
                userName: action.userName || false,
                loginTime : action.loginTime || false,
                serverUrl : action.serverUrl || false,
                roomId : action.roomId || state.roomId,
                loaded : action.loaded || state.loaded
            }
        case 'SET_STREAM_SUPPORT_LOADED':
            return {
                ...state,
                roomId : action.roomId || false,
                messages : action.messages || state.messages,
                loaded : action.loaded || false
            }
        default:
            return state
    }
}

export default streamSupportStoreReducer
