/**
 * @version 0.50
 * @author yura
 */
import React, { Component } from 'react'
import { View } from 'react-native'

import Layout from '@app/components/elements/modal/Layout'
import Title from '@app/components/elements/modal/Title'
import Text from '@app/components/elements/modal/Text'
import Button from '@app/components/elements/modal/Button'

import { hideModal } from '@app/appstores/Stores/Modal/ModalActions'

import { strings } from '@app/services/i18n'

import { ThemeContext } from '@app/theme/ThemeProvider'

class NotificationModal extends Component {

    handleOk = () => {

        const { noCallback } = this.props.data

        hideModal()

        if (noCallback) {
            noCallback()
        }
    }

    render() {

        const { title, description, rates, textRatesBtn, textMainBtn } = this.props.data

        const { colors, GRID_SIZE } = this.context

        return (
            <Layout visible={this.props.show} notifications={true} >
                <View style={{ marginTop: GRID_SIZE * 2 }}>
                    <Text style={{ ...styles.text, color: colors.sendScreen.amount }}>
                        {description}
                    </Text>
                </View>
                <View style={{ marginTop: GRID_SIZE }}>
                    {rates ?
                        <Button onPress={this.handleOk} style={{ backgroundColor: 'transparent', color: colors.modal.success, marginBottom: -20 }}>
                            {textRatesBtn || strings('modal.notificationModal.unsubscribe')}
                        </Button>
                        : null
                    }
                    <Button onPress={hideModal} style={{ backgroundColor: 'transparent', color: colors.modal.success }}>
                        {textMainBtn || 'Ok'}
                    </Button>
                </View>
            </Layout>
        )
    }
}

NotificationModal.contextType = ThemeContext

export default NotificationModal

const styles = {
    text: {
        fontFamily: 'Montserrat-SemiBold',
        fontSize: 18,
        lineHeight: 25,
        textAlign: 'center',
        letterSpacing: 0.5,
    }
}
