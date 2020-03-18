import { Platform, Linking } from 'react-native'

import VersionCheck from 'react-native-version-check'

import { showModal } from '../appstores/Actions/ModalActions'
import Settings from '../appstores/DataSource/Settings/Settings'

import { strings } from './i18n'
import Log from './Log/Log'


class VersionControl {

    /**
     * @type {string}
     * @private
     */
    _currentVersion = ''

    /**
     * @type {string}
     * @private
     */
    _linkToStoreANDROID = "market://details?id=com.trusteewallet"

    /**
     * @type {string}
     * @private
     */
    _linkToStoreIOS = "itms-apps://itunes.apple.com/us/app/id1462924276?mt=8"

    /**
     * @type {string}
     * @private
     */
    _OS = ''

    /**
     * @type {string}
     * @private
     */
    _settingsDBKey = "versionControl"

    constructor() {
        try {
            this._currentVersion = VersionCheck.getCurrentVersion().split(".")[2]
            this._OS = Platform.OS
        } catch (e) {
            Log.err('VersionControl.constructor error ' + e.message)
        }
    }

    async init() {

        const settingsDS = new Settings()

        let versionControl = await settingsDS.getSetting(this._settingsDBKey)

        if(typeof versionControl === "undefined") {
            await settingsDS.setSettings(this._settingsDBKey, JSON.stringify( { skippedVersions: [] }))
            versionControl =  { skippedVersions: [] }
        } else {
            versionControl = JSON.parse(versionControl.paramValue)
        }

        try {
            const res = await VersionCheck.getLatestVersion()

            const newVersion = res.split(".")[2]

            const isSkipped = versionControl.skippedVersions.includes(newVersion)

            if(!isSkipped && +newVersion > +this._currentVersion) {
                showModal({
                    type: "YES_NO_MODAL",
                    title: strings("modal.infoUpdateModal.title"),
                    icon: "INFO",
                    description: strings("modal.infoUpdateModal.description"),
                    noCallback: async () => {
                        versionControl.skippedVersions.push(newVersion)
                        await settingsDS.setSettings(this._settingsDBKey, JSON.stringify(versionControl))
                    }
                }, () => {
                    Linking.openURL(this[`_linkToStore${this._OS.toUpperCase()}`])
                })
            }
        } catch (e) {
            Log.err('VersionControl.init error ' + e.message)
        }
    }
}

export default new VersionControl
