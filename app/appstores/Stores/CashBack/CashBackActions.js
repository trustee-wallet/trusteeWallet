/**
 * @version 0.11
 */
import store from '../../../store'

import CashBackSettings from './CashBackSettings'
import CashBackUtils from './CashBackUtils'
import cryptoWalletsDS from '../../DataSource/CryptoWallets/CryptoWallets'

const { dispatch } = store

export default new class CashBackActions {

    setParentToken = async (parentToken) => {
        dispatch({
            type: 'SET_PARENT_TOKEN',
            parentToken: parentToken
        })
    }

    reset = async () => {
        dispatch({
            type: 'SET_CASHBACK_LINK',
            cashbackLink: ''
        })
        dispatch({
            type: 'SET_CASHBACK_DATA_FROM_API',
            dataFromApi : {}
        })
        dispatch({
            type: 'SET_CASHBACK_ERROR',
            error : {}
        })
    }

    setPublicLink = async () => {
        const authHash = await cryptoWalletsDS.getSelectedWallet()

        if (!authHash) {
            return false
        }

        const tmpPublicAndPrivateResult = await CashBackUtils.getByHash(authHash, 'ACT/CashBack setPublicLink')

        if (tmpPublicAndPrivateResult) {
            dispatch({
                type: 'SET_CASHBACK_LINK',
                cashbackLink: CashBackSettings.getLink(tmpPublicAndPrivateResult.cashbackToken)
            })
        } else {
            dispatch({
                type: 'SET_CASHBACK_LINK',
                cashbackLink: ''
            })
        }
    }

    setCashBackDataFromApi = async (data) => {
        dispatch({
            type: 'SET_CASHBACK_DATA_FROM_API',
            dataFromApi : data
        })
        dispatch({
            type: 'SET_CASHBACK_ERROR',
            error : {}
        })
    }

    setCashBackError = async (data) => {
        dispatch({
            type: 'SET_CASHBACK_ERROR',
            error : data
        })
    }
}
