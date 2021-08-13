/**
 * @version 0.41
 */
import React from 'react'
import { StyleSheet, View } from 'react-native'

import Layout from '@app/components/elements/modal/Layout'
import Title from '@app/components/elements/modal/Title'
import Text from '@app/components/elements/modal/Text'
import Button from '@app/components/elements/modal/Button'
import Icon from '@app/components/elements/modal/Icon'

import { hideModal } from '@app/appstores/Stores/Modal/ModalActions'

import { strings } from '@app/services/i18n'

import { ThemeContext } from '@app/theme/ThemeProvider'

class Skip extends React.PureComponent {

    handleSkip = async () => {
        const { callback } = this.props
        if (callback) {
            callback()
        }
        hideModal()
    }

    handleHide = () => {
        hideModal()
    }

    render() {

        const { colors } = this.context

        return (
            <Layout visible="true">
                <View>
                    <Icon icon='warning'/>
                    <Title style={{...styles.title, color: colors.common.text1 }}>
                        {strings('walletBackup.skipElement.title')}
                    </Title>
                    <View style={{ marginTop: 8, marginBottom: -5 }}>
                        <Text style={{...styles.text, color: colors.sendScreen.amount }}>
                            {strings('walletBackup.skipElement.description')}
                        </Text>
                    </View>
                    <View>
                        <Button onPress={this.handleHide} color={colors.modal.warning} shadow={true} style={{ marginTop: 17 }}>
                            {strings('walletBackup.skipElement.cancel')}
                        </Button>
                        <Button onPress={this.handleSkip} style={{backgroundColor: 'transparent', color: colors.modal.warning}}>
                            {strings('walletBackup.skipElement.yes')}
                        </Button>
                    </View>
                </View>
            </Layout>
        )
    }
}

Skip.contextType = ThemeContext

export default Skip

const styles = StyleSheet.create({
    title: {
        fontFamily: 'Montserrat-Bold',
        fontStyle: 'normal',
        fontWeight: 'bold',
        fontSize: 18,
        lineHeight: 26,
        textAlign: 'center',
        marginTop: -10,
        marginBottom: -2
    },
    text: {
        fontFamily: 'SFUIDisplay-Regular',
        fontStyle: 'normal',
        fontWeight: 'normal',
        fontSize: 14,
        lineHeight: 20,
        textAlign: 'center',
        letterSpacing: 0.5,
        marginBottom: -6
    }
})
