import store from '../../store'

const { dispatch } = store

import cryptoWalletsDS from '../DataSource/CryptoWallets/CryptoWallets'
import authDS from '../DataSource/Auth/Auth'

import Log from '../../services/Log/Log'
import Cashback from '../../services/Cashback/Cashback'


export default new class AuthActions {

    init = async () => {


        Log.log('ACT/Auth init called')

        const authHash = await authDS.getAuthMnemonicHash()

        if(!authHash){
            dispatch({
                type: 'SET_AUTH_STATUS',
                logged: false
            })
            return
        }

        dispatch({
            type: 'SET_AUTH_MNEMONIC_HASH',
            authMnemonicHash: authHash
        })

        dispatch({
            type: 'SET_AUTH_STATUS',
            logged: true
        })

        Log.log('ACT/Auth init finished')

    }

    registrate = async (walletHash) => {

        Log.log('ACT/Auth registrate called')

        try {

            const authHash = await authDS.getAuthMnemonicHash()

            if(authHash)
                throw new Error('Application already logged!')


            const mnemonic = await cryptoWalletsDS.getWallet(walletHash)

            const storedMnemonicKey = await authDS.saveAuthMnemonic(mnemonic)

            await authDS.setAuthMnemonicHash(storedMnemonicKey)

            await Cashback.getCashbackData(storedMnemonicKey)

            dispatch({
                type: 'SET_AUTH_MNEMONIC_HASH',
                authMnemonicHash: storedMnemonicKey
            })

            dispatch({
                type: 'SET_AUTH_STATUS',
                logged: true
            })

        } catch (e) {
            Log.err('ACT/Auth registrate error ', e.message)
        }

        Log.log('ACT/Auth registrate finished')
    }

    singOut = async () => {
        Log.log('ACT/Auth singOut called')

        try {

            await authDS.setAuthMnemonicHash('')

            dispatch({
                type: 'SET_DEFAULT_CASHBACK_DATA'
            })

            dispatch({
                type: 'SET_AUTH_STATUS',
                logged: false
            })

        } catch (e) {
            Log.err('ACT/Auth singOut error ', e.message)
        }

        Log.log('ACT/Auth signOut finished')
    }

}

