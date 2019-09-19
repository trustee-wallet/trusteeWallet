import store from '../../store'


import SettingsDS from '../DataSource/Settings/Settings'

import App from './/App/App'

import { setLoaderStatus } from './/MainStoreActions'

import Log from '../../services/Log/Log'

const { dispatch } = store

const walletActions = {

    setSelectedWallet: async (walletHash) => {

        Log.log('ACT/Wallet setSelectedWallet called')

        setLoaderStatus(true)

        const settingsDS = new SettingsDS()

        try {

            const res = await settingsDS.set()

            console.log('walletActions.setSelectedWallet')
            console.log(res)

            dispatch({
                type: 'UPDATE_SETTINGS',
                settings: res && res.data ? res.data.settings : {}
            })

            await App.refreshWalletsStore()

            Log.log('ACT/Wallet setSelectedWallet finished')
        } catch (e) {
            Log.err('ACT/Wallet setSelectedWallet error' , e)
        }

        setLoaderStatus(false)
    },

}

export default walletActions
