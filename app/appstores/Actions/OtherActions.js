import store from '../../store'
import { showModal } from './ModalActions'
import settingsActions from './SettingsActions'

export default new class OtherActions {
    licenceTermsCheck = () => {
        const { data: settings } = store.getState().settingsStore

        if(typeof settings.licence_terms_accepted == 'undefined'){
            showModal({
                type: 'LICENSE_TERMS_MODAL'
            })
        }
    }

    acceptTerms = () => {
        settingsActions.setSettings('licence_terms_accepted', 1)
    }
}