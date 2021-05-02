/**
 * @version 0.42
 */
import React from 'react'
import { View } from 'react-native'

import { strings } from '@app/services/i18n'

import { ThemeContext } from '@app/modules/theme/ThemeProvider'
import Button from '@app/components/elements/new/buttons/Button'
import TextInput from '@app/components/elements/new/TextInput'
import { setLoaderStatus } from '@app/appstores/Stores/Main/MainStoreActions'
import { showModal } from '@app/appstores/Stores/Modal/ModalActions'

import Api from '@app/services/Api/Api'
import config from '@app/config/config'

export default class PromoCodeContent extends React.Component {
    state = {
        promoCode: ''
    }

    onChangeCode = (value) => {
        this.setState(() => ({ promoCode: value }))
    }

    handleApply = async () => {
        try {
            setLoaderStatus(true)
            let desc = await Api.activatePromo(this.state.promoCode)
            if (typeof desc !== 'string') {
                if (typeof desc['en'] !== 'undefined') {
                    desc = desc['en']
                } else {
                    desc = JSON.stringify(desc)
                }
            }
            showModal({
                type: 'INFO_MODAL',
                icon: 'INFO',
                title: strings('modal.walletBackup.success'),
                description: desc
            })
        } catch (e) {
            if (config.debug.appErrors) {
                console.log('CashBackScreen.Promo.handleApply error ' + e.message, e)
            }
            showModal({
                type: 'INFO_MODAL',
                icon: 'INFO',
                title: strings('modal.exchange.sorry'),
                description: strings('cashback.cashbackError.' + e.message)
            })
        }
        setLoaderStatus(false)
    }

    render() {
        const { GRID_SIZE } = this.context
        const { promoCode } = this.state

        return (
            <View>
                <TextInput
                    placeholder={strings('cashback.enterPromoPlaceholder')}
                    value={promoCode}
                    onChangeText={this.onChangeCode}
                />
                <Button
                    title={strings('cashback.applyButton')}
                    onPress={this.handleApply}
                    containerStyle={{ marginTop: GRID_SIZE * 1.5 }}
                    disabled={!promoCode}
                />
            </View>
        )
    }
}

PromoCodeContent.contextType = ThemeContext
