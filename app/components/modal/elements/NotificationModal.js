/**
 * @version 0.30
 * @author yura
 */
import React, { Component } from 'react'
import { View } from 'react-native'

import Layout from '../../../components/elements/modal/Layout'
import Title from '../../../components/elements/modal/Title'
import Text from '../../../components/elements/modal/Text'
import Button from '../../../components/elements/modal/Button'

import { hideModal } from '../../../appstores/Stores/Modal/ModalActions'

import { strings } from '../../../services/i18n'

import { ThemeContext } from '../../../modules/theme/ThemeProvider'

class NotificationModal extends Component {

    constructor(props) {
        super(props)
    }

    handleOk = () => {

        const { noCallback } = this.props.data

        hideModal()

        if (noCallback) {
            noCallback()
        }
    }

    render() {

        const { title, description, rates } = this.props.data

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
                        <Button onPress={this.handleOk} style={{ backgroundColor: 'none', color: colors.modal.success, marginBottom: -20 }}>
                            {strings('modal.notificationModal.unsubscribe')}
                        </Button>
                        : null
                    }
                    <Button onPress={() => hideModal()} style={{ backgroundColor: 'none', color: colors.modal.success }}>
                        Ok
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
