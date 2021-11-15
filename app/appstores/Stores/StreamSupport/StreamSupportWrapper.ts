import { strings } from '@app/services/i18n';
/**
 * @version 0.45
 */
import store from '@app/store'

import MarketingEvent from '@app/services/Marketing/MarketingEvent'
import Log from '@app/services/Log/Log'

import { StreamSupportActions } from '@app/appstores/Stores/StreamSupport/StreamSupportStoreActions'
import config from '@app/config/config'
import BlocksoftExternalSettings from '@crypto/common/BlocksoftExternalSettings'

const CHAT_PREFIX = 'supportChatV4_'
const ADMINS = ['ksu.dev', 'germes', 'testrocket1']

let WEB_SOCKET = false
let WEB_SOCKET_LINK = false
let CACHE_ROOM_ID = false
let CACHE_TMP_DATA = false

// ids could be any - just to set
const IDENT_CONNECT = '2'
const IDENT_GROUP_CREATE = '89'
const IDENT_MESSAGE_CREATE = '99'
const IDENT_MESSAGE_LIST = '98'

export namespace StreamSupportWrapper {

    // https://developer.rocket.chat/api/rest-api/endpoints/push/push-token
    export const init = async function(data: any) {
        if (BlocksoftExternalSettings.getStatic('ROCKET_CHAT_USE') * 1 === 0) return false
        const serverUrl = data.serverUrl || 'https://testrocket.trustee.deals'
        if (MarketingEvent.DATA.LOG_TOKEN.indexOf('NO_GOOGLE') === -1 && data.userToken) {
            try {
                const response = await fetch(`${serverUrl}/api/v1/push.token`, {
                    method: 'POST',
                    headers: {
                        'X-Auth-Token': data.userToken,
                        'X-User-Id': data.userId,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({
                        'type': 'gcm',
                        'value': MarketingEvent.DATA.LOG_TOKEN,
                        'appName': 'TrusteeWalletSupport'
                    })
                })
                const res = await response.json()
                // console.log('StreamSupport device token subscribe res ', res)
            } catch (e) {
                if (config.debug.appErrors) {
                    console.log('StreamSupport device token subscribe error ' + e.message)
                }
                Log.log('StreamSupport device token subscribe error ' + e.message + ' ' + JSON.stringify(data))
            }
        }

        await getRoom(data)
        await initWS(data)
    }

    // https://developer.rocket.chat/api/rest-api/endpoints/rooms/get
    export const getRoom = async function(data: any = false) {
        if (BlocksoftExternalSettings.getStatic('ROCKET_CHAT_USE') * 1 === 0) return false
        if (data === false) {
            data = store.getState().streamSupportStore
        }
        const serverUrl = data.serverUrl || 'https://testrocket.trustee.deals'
        const link = `${serverUrl}/api/v1/rooms.get`

        // console.log('StreamSupport getRoom ' + link)
        CACHE_ROOM_ID = false
        try {
            const response = await fetch(link, {
                method: 'GET',
                headers: {
                    'X-Auth-Token': data.userToken,
                    'X-User-Id': data.userId,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            })
            const res = await response.json()
            // console.log('StreamSupport getRoom result ', res)
            if (typeof res.update !== 'undefined') {
                for (const room of res.update) {
                    if (room.fname === CHAT_PREFIX + data.userName) {
                        CACHE_ROOM_ID = room._id
                    }
                }
            }
        } catch (e) {
            console.log('StreamSupport getRoom ' + link + ' error ' + e.message)
        }
        StreamSupportActions.setRoom(CACHE_ROOM_ID)
    }

    export const initWS = async function(data: any = false) {
        if (BlocksoftExternalSettings.getStatic('ROCKET_CHAT_USE') * 1 === 0) return false
        if (data === false) {
            data = store.getState().streamSupportStore
        }
        const serverUrl = data.serverUrl || 'https://testrocket.trustee.deals'
        const wsLink = 'wss://' + serverUrl.replace('https://', '') + '/websocket'
        // console.log('StreamSupport initWS ' + wsLink)

        WEB_SOCKET = new WebSocket(wsLink)
        WEB_SOCKET_LINK = wsLink

        WEB_SOCKET.onopen = () => {
            // console.log('StreamSupport.on open ' + wsLink)
            // https://github.com/RocketChat/docs/issues/205
            try {
                // console.log('StreamSupport.on open status connection ' + WEB_SOCKET.readyState)

                WEB_SOCKET.send(JSON.stringify({
                    'msg': 'connect',
                    'version': '1',
                    'support': ['1', 'pre2', 'pre1']
                }))
            } catch (e) {
                if (config.debug.appErrors) {
                    console.log('StreamSupport.on open error ' + e.message)
                }
                Log.log('StreamSupport.on open error ' + e.message)
            }
        }

        WEB_SOCKET.onmessage = (e) => {
            // console.log('StreamSupport.on message ' + e.data)
            try {
                const newData = JSON.parse(e.data)
                if (newData.msg === 'connected') {
                    // https://developer.rocket.chat/api/realtime-api/method-calls/login#using-an-authentication-token
                    WEB_SOCKET.send(JSON.stringify({
                        'msg': 'method',
                        'method': 'login',
                        'id': IDENT_CONNECT,
                        'params': [
                            { 'resume': data.userToken }
                        ]
                    }))
                } else if (newData.msg === 'result' && newData.id === IDENT_CONNECT) {
                    if (CACHE_ROOM_ID) { // subscribe to the room
                        subscribeToMessages()
                    }
                } else if (newData.msg === 'result' && newData.id === IDENT_MESSAGE_LIST && typeof newData.result !== 'undefined' && typeof newData.result.messages !== 'undefined') {
                    StreamSupportActions.allMessages(newData.result.messages.map((item: { msg: string | string[] }) => prettyMsgForFile(item)))
                } else if (newData.msg === 'result' && newData.id === IDENT_GROUP_CREATE) {
                    if (typeof newData.error !== 'undefined' && typeof newData.error.error !== 'undefined') {
                        console.log('newData.error.error ' + newData.error.error)

                    } else if (typeof newData.result.rid !== 'undefined') {
                        CACHE_ROOM_ID = newData.result.rid
                        StreamSupportActions.setRoom(CACHE_ROOM_ID)
                        sendStreamSupportMessage(data, CACHE_TMP_DATA)
                        subscribeToMessages()
                    } else {
                        throw new Error(' something wrong with room create')
                    }
                } else if (newData.msg === 'result' && newData.id === IDENT_MESSAGE_CREATE) {
                    // from the user
                    StreamSupportActions.addMessage(prettyMsgForFile(newData.result))
                } else if (newData.msg === 'changed' && newData.collection === 'stream-room-messages') {
                    // back from the room
                    StreamSupportActions.addMessage(prettyMsgForFile(newData.fields.args[0]))
                } else {
                    // console.log('StreamSupport.on message ', newData)
                }
            } catch (e) {
                if (config.debug.appErrors) {
                    console.log('StreamSupport.on message ' + e.data + ' error ' + e.message)
                }
                Log.log('StreamSupport.on message ' + e.data + ' error ' + e.message)
            }
        }

        WEB_SOCKET.onerror = (e) => {
            if (config.debug.appErrors) {
                console.log('StreamSupport.on error ' + e.message)
            }
            Log.log('StreamSupport.on error ' + e.message)

            if (WEB_SOCKET.readyState === 3) { // 3 - The connection is closed or couldn't be opened.
                initWS(data)
            }
        }

        WEB_SOCKET.onclose = (e) => {
            if (typeof e.code !== 'undefined' && e.code.toString() === '1000') {
                // console.log('StreamSupport.on close to reload ' + e.code + ' ' + e.reason)
            } else {
                console.log('StreamSupport.on close ' + e.code + ' ' + e.reason)
            }
            initWS(data)
        }
    }

    // https://developer.rocket.chat/api/realtime-api/subscriptions/stream-room-messages
    export const subscribeToMessages = async function() {
        if (BlocksoftExternalSettings.getStatic('ROCKET_CHAT_USE') * 1 === 0) return false
        const data = store.getState().streamSupportStore

        // console.log('StreamSupport subscribeToMessages ' + CACHE_ROOM_ID)

        // console.log('StreamSupport subscribeToMessages status connection ' + WEB_SOCKET.readyState)

        try {

            WEB_SOCKET.send(JSON.stringify({
                'msg': 'method',
                'method': 'loadHistory',
                'id': IDENT_MESSAGE_LIST,
                'params': [CACHE_ROOM_ID, null, 50, { '$date': 1480377601 }]
            }))

            WEB_SOCKET.send(JSON.stringify({
                'msg': 'sub',
                'id': data.userId + 'SUB',
                'name': 'stream-room-messages',
                'params': [
                    CACHE_ROOM_ID,
                    false
                ]
            }))
        } catch (e) {
            console.log('StreamSupport subscribeToMessages error ' + e.message)
        }
    }

    // https://developer.rocket.chat/api/realtime-api/method-calls/create-private-groups
    export const sendStreamSupportMessage = async function(data, sendData) {
        if (BlocksoftExternalSettings.getStatic('ROCKET_CHAT_USE') * 1 === 0) return false
        if (data === false) {
            data = store.getState().streamSupportStore
        }
        if (data.roomId) {
            CACHE_ROOM_ID = data.roomId
        }

        // console.log('StreamSupport sendStreamSupportMessage status connection ' + (WEB_SOCKET && typeof WEB_SOCKET.readyState === 'undefined' ? JSON.stringify(WEB_SOCKET) : WEB_SOCKET.readyState))

        try {
            if (!CACHE_ROOM_ID) {
                WEB_SOCKET.send(JSON.stringify({
                    'msg': 'method',
                    'method': 'createPrivateGroup',
                    'id': IDENT_GROUP_CREATE,
                    'params': [
                        CHAT_PREFIX + data.userName,
                        ADMINS
                    ]
                }))
                CACHE_TMP_DATA = sendData
            } else {
                const newMessageCall = {
                    'msg': 'method',
                    'method': 'sendMessage',
                    'id': IDENT_MESSAGE_CREATE,
                    'params': [
                        {
                            'rid': CACHE_ROOM_ID,
                            'msg': sendData.text
                        }
                    ]
                }
                WEB_SOCKET.send(JSON.stringify(newMessageCall))
            }
        } catch (e) {
            console.log('StreamSupport sendStreamSupportMessage error ' + e.message)
        }
    }

    export const getStatusSocketConnection = async function () {
        if (WEB_SOCKET.readyState === 1) {
            return true
        } else {
            return false
        }
    }

    const prettyMsgForFile = (obj: any) => {
        return obj?.msg.indexOf('https://walletchatfiles.s3') === -1 ? obj : { ...obj, msg: strings('streemSupport.sentFile') }
    }
}
