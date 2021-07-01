/**
 * @version 0.45
 */
import { createSelector } from 'reselect'

export const getStreamSupportData = createSelector(
    [state => state.streamSupportStore],
    (data => {
        return {
            userId : data.userId,
            userToken : data.userToken,
            userName : data.userName,
            loginTime : data.loginTime,
            serverUrl : data.serverUrl,
            loaded : data.loaded,
            messages : data.messages
        }
    })
)