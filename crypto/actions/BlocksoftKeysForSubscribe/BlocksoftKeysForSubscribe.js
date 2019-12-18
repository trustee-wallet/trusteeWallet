/**

 import BlocksoftKeysForSubscribe from '../../../../crypto/actions/BlocksoftKeysForSubscribe/BlocksoftKeysForSubscribe'


 it('BlocksoftKeysForSubscribeSubactions discover correctly', async () => {
    let result = await BlocksoftKeysForSubscribe.discoverAndSend({
        mnemonic: 'sorry year series enhance negative waste wish few skull solar also resist wage ring sphere',
        coin : 'btc',
        type : 'android',
        token : ''
    })
    console.log(result)
})

 */

import BlocksoftKeysForSubscribeSubactions from './BlocksoftKeysForSubscribeSubactions'
import BlocksoftCryptoLog from '../../common/BlocksoftCryptoLog'

const API_URL = 'https://bws.bitpay.com/bws/api'

class BlocksoftKeysForSubscribe {
    async discoverAndSend(mainData) {
        let discovered = await BlocksoftKeysForSubscribeSubactions.discoverPublicAndPrivate({
            mnemonic: mainData.mnemonic
        })
        return this._discoverAndSend(discovered, mainData)
    }

    async _discoverAndSend(discovered, mainData) {

        let coin = mainData.coin

        let sharedEncryptingKey = await BlocksoftKeysForSubscribeSubactions.sharedEncryptingKey(discovered.btcPrivKey)

        let walletName = await BlocksoftKeysForSubscribeSubactions.encryptMessage('wallet', sharedEncryptingKey)

        const headers = {
            'x-client-version': 'bwc-8.13.2',
            'x-identity': discovered.copayerId,
            'x-signature': '?'
        }


        let walletId = false
        try {
            let url = '/v2/wallets/'
            let data = {
                name: walletName,
                m: 1,
                n: 1,
                pubKey: discovered.btcPubKey,
                coin,
                network: 'livenet',
                singleAddress: false,
                id: undefined,
                usePurpose48: false
            }
            headers['x-signature'] = BlocksoftKeysForSubscribeSubactions.signRequest('post', url, data, discovered)
            headers['Accept'] = 'application/json'
            headers['Content-Type'] = 'application/json'

            BlocksoftCryptoLog.log('BlocksoftKeysForSubscribe.init ' + API_URL + url)
            BlocksoftCryptoLog.log('BlocksoftKeysForSubscribe.header x-client-version ' + headers['x-client-version'])
            BlocksoftCryptoLog.log('BlocksoftKeysForSubscribe.header x-identity ' + headers['x-identity'])
            BlocksoftCryptoLog.log('BlocksoftKeysForSubscribe.header x-signature ' + headers['x-signature'])
            BlocksoftCryptoLog.log('BlocksoftKeysForSubscribe.post', data)
            let res = await fetch(API_URL + url, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(data)
            })
            res = await res.json()
            BlocksoftCryptoLog.log('BlocksoftKeysForSubscribe.result', res)
            walletId = res.walletId

        } catch (e) {
            if (typeof e.response !== 'undefined') {
                BlocksoftCryptoLog.log('BlocksoftKeysForSubscribe.discoverAndSend error1 ' + e.response.statusText)
                BlocksoftCryptoLog.log('BlocksoftKeysForSubscribe.discoverAndSend error1 ' + e.response.data)
            }
            BlocksoftCryptoLog.err('BlocksoftKeysForSubscribe.discoverAndSend error1 ' + e.message)
            return false
        }

        if (!walletId) {
            return false
        }

        try {
            let url = '/v2/wallets/' + walletId + '/copayers'
            let encCopayerName = await BlocksoftKeysForSubscribeSubactions.encryptMessage('wallet', sharedEncryptingKey)
            let hash = encCopayerName + '|' + discovered.xPub + '|' + discovered.requestPubKey
            let copayerSignature = BlocksoftKeysForSubscribeSubactions.sign(hash, discovered.btcPrivKey)
            let personalEncryptingKey = BlocksoftKeysForSubscribeSubactions.personalEncryptingKey(discovered.requestPrivKey)
            let customData = await BlocksoftKeysForSubscribeSubactions.encryptMessage(JSON.stringify({ walletPrivKey: discovered.btcPrivKey.toString('hex') }), personalEncryptingKey)
            let data = {
                walletId: walletId,
                coin,
                name: walletName,
                xPubKey: discovered.xPub,
                requestPubKey: discovered.requestPubKey,
                customData,
                copayerSignature
            }
            headers['x-signature'] = BlocksoftKeysForSubscribeSubactions.signRequest('post', url, data, discovered)

            BlocksoftCryptoLog.log('BlocksoftKeysForSubscribe.init ' + API_URL + url)
            BlocksoftCryptoLog.log('BlocksoftKeysForSubscribe.header x-client-version ' + headers['x-client-version'])
            BlocksoftCryptoLog.log('BlocksoftKeysForSubscribe.header x-identity ' + headers['x-identity'])
            BlocksoftCryptoLog.log('BlocksoftKeysForSubscribe.header x-signature ' + headers['x-signature'])
            BlocksoftCryptoLog.log('BlocksoftKeysForSubscribe.post', data)
            let res = await fetch(API_URL + url, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(data)
            })
            res = await res.json()
            if (typeof res.code != 'undefined' && res.code === 'BADREQUEST') {
                throw new Error(JSON.stringify(res))
            }
            BlocksoftCryptoLog.log('BlocksoftKeysForSubscribe.result', res)
        } catch (e) {
            if (typeof e.response !== 'undefined') {
                BlocksoftCryptoLog.log('BlocksoftKeysForSubscribe.discoverAndSend error2 ' + e.response.statusText)
                BlocksoftCryptoLog.log('BlocksoftKeysForSubscribe.discoverAndSend error2 ' + e.response.data)
            }
            BlocksoftCryptoLog.err('BlocksoftKeysForSubscribe.discoverAndSend error2 ' + e.message)
            return false
        }



        try {
            let url = '/v4/addresses/'
            headers['x-signature'] = BlocksoftKeysForSubscribeSubactions.signRequest('post', url, {}, discovered)
            BlocksoftCryptoLog.log('BlocksoftKeysForSubscribe.init ' + API_URL + url)
            BlocksoftCryptoLog.log('BlocksoftKeysForSubscribe.header x-client-version ' + headers['x-client-version'])
            BlocksoftCryptoLog.log('BlocksoftKeysForSubscribe.header x-identity ' + headers['x-identity'])
            BlocksoftCryptoLog.log('BlocksoftKeysForSubscribe.header x-signature ' + headers['x-signature'])
            let res = await fetch(API_URL + url, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({})
            })
            res = await res.json()
            if (typeof res.code != 'undefined' && res.code === 'BADREQUEST') {
                throw new Error(JSON.stringify(res))
            }
            BlocksoftCryptoLog.log('BlocksoftKeysForSubscribe.result', res)
        } catch (e) {
            if (typeof e.response !== 'undefined') {
                BlocksoftCryptoLog.log('BlocksoftKeysForSubscribe.discoverAndSend error3 ' + e.response.statusText)
                BlocksoftCryptoLog.log('BlocksoftKeysForSubscribe.discoverAndSend error3 ' + e.response.data)
            }
            BlocksoftCryptoLog.err('BlocksoftKeysForSubscribe.discoverAndSend error3 ' + e.message)
            return false
        }

        /*
        try {
            let url = '/v1/addresses/?r=45245'
            headers['x-signature'] = BlocksoftKeysForSubscribeSubactions.signRequest('get', url, {}, discovered)
            BlocksoftCryptoLog.log('BlocksoftKeysForSubscribe.init ' + API_URL + url)
            BlocksoftCryptoLog.log('BlocksoftKeysForSubscribe.header x-client-version ' + headers['x-client-version'])
            BlocksoftCryptoLog.log('BlocksoftKeysForSubscribe.header x-identity ' + headers['x-identity'])
            BlocksoftCryptoLog.log('BlocksoftKeysForSubscribe.header x-signature ' + headers['x-signature'])
            let res = await fetch(API_URL + url, {
                method: 'GET',
                headers: headers
            })
            res = await res.json()
            if (typeof res.code != 'undefined' && res.code === 'BADREQUEST') {
                throw new Error(JSON.stringify(res))
            }
            console.log('addresses', res)
            BlocksoftCryptoLog.log('BlocksoftKeysForSubscribe.result', res)
        } catch (e) {
            if (typeof e.response !== 'undefined') {
                BlocksoftCryptoLog.log('BlocksoftKeysForSubscribe.discoverAndSend error4 ' + e.response.statusText)
                BlocksoftCryptoLog.log('BlocksoftKeysForSubscribe.discoverAndSend error4 ' + e.response.data)
            }
            BlocksoftCryptoLog.err('BlocksoftKeysForSubscribe.discoverAndSend error4 ' + e.message)
            return false
        }
        */

        let subscribed = false
        try {
            let url = '/v1/pushnotifications/subscriptions/'
            let data = {
                type: mainData.type,
                token: mainData.token
            }
            headers['x-signature'] = BlocksoftKeysForSubscribeSubactions.signRequest('post', url, data, discovered)


            BlocksoftCryptoLog.log('BlocksoftKeysForSubscribe.init ' + API_URL + url)
            BlocksoftCryptoLog.log('BlocksoftKeysForSubscribe.header x-client-version ' + headers['x-client-version'])
            BlocksoftCryptoLog.log('BlocksoftKeysForSubscribe.header x-identity ' + headers['x-identity'])
            BlocksoftCryptoLog.log('BlocksoftKeysForSubscribe.header x-signature ' + headers['x-signature'])
            BlocksoftCryptoLog.log('BlocksoftKeysForSubscribe.post', data)
            let res = await fetch(API_URL + url, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(data)
            })
            res = await res.json()
            if (typeof res.code != 'undefined' && res.code === 'BADREQUEST') {
                throw new Error(JSON.stringify(res))
            }
            BlocksoftCryptoLog.log('BlocksoftKeysForSubscribe.result', res)

            subscribed = res
        } catch (e) {
            if (typeof e.response !== 'undefined') {
                BlocksoftCryptoLog.log('BlocksoftKeysForSubscribe.discoverAndSend error5 ' + e.response.statusText)
                BlocksoftCryptoLog.log('BlocksoftKeysForSubscribe.discoverAndSend error5 ' + e.response.data)
            }
            BlocksoftCryptoLog.err('BlocksoftKeysForSubscribe.discoverAndSend error5 ' + e.message)
            return false
            return false
        }

        return subscribed
    }
}

const singleBlocksoftKeysForSubscribe = new BlocksoftKeysForSubscribe()

export default singleBlocksoftKeysForSubscribe
