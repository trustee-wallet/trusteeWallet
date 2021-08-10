import BlocksoftExternalSettings from '@crypto/common/BlocksoftExternalSettings'
import MarketingEvent from '@app/services/Marketing/MarketingEvent'
import { Text, TouchableOpacity, View } from 'react-native'
import { hideModal } from '@app/appstores/Stores/Modal/ModalActions'
import NavStore from '@app/components/navigation/NavStore'
import { strings } from '@app/services/i18n'
import React from 'react'

export const TelegramComponent = () => {
    const link = BlocksoftExternalSettings.getStatic('SUPPORT_BOT')
    const bot = BlocksoftExternalSettings.getStatic('SUPPORT_BOT_NAME')
    MarketingEvent.logEvent('taki_cashback_withdraw', { link, screen: 'CASHBACK_WITHDRAW' })

    return (
        <View style={{ alignItems: 'center', width: '100%' }}>
            <TouchableOpacity onPress={() => {
                hideModal()
                NavStore.goNext('WebViewScreen', { url: link, title: strings('settings.about.contactSupportTitle') })
            }}>
                <Text style={{
                    paddingTop: 10,
                    paddingHorizontal: 10,
                    fontFamily: 'SFUIDisplay-SemiBold',
                    color: '#4AA0EB'
                }}>{bot}</Text>
            </TouchableOpacity>
        </View>
    )
}
