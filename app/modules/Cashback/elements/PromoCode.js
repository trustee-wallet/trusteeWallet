
import React from 'react'
import { View } from 'react-native'

import { strings } from '../../../services/i18n'

import { ThemeContext } from '../../../modules/theme/ThemeProvider'
import Button from '../../../components/elements/new/buttons/Button'
import TextInput from '../../../components/elements/new/TextInput'


export default class PromoCodeContent extends React.Component {
    state = {
        promoCode: ''
    }

    onChangeCode = (value) => {
        this.setState(() => ({ promoCode: value }))
    }

    handleApply = () => {
        // TODO: add handler to apply promo code
    }

    render() {
        const {
            colors,
            GRID_SIZE,
        } = this.context
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
