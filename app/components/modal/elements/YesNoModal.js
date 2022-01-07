/**
 * @version 0.43
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

class YesNoModal extends React.PureComponent {

    handleYes = async () => {
        const { callback } = this.props

        callback()

        hideModal()
    }

    handleNo = () => {

        const { noCallback } = this.props.data

        hideModal()

        if (noCallback) {
            noCallback()
        }
    }

    render() {

        const { title, icon, description, reverse, oneButton, twoButton } = this.props.data

        let {yesTitle, noTitle} = this.props
        if (typeof this.props.data.yesTitle !== 'undefined' && this.props.data.yesTitle) {
            yesTitle = this.props.data.yesTitle
        }

        if (typeof this.props.data.noTitle !== 'undefined' && this.props.data.noTitle) {
            noTitle = this.props.data.noTitle
        }

        const { colors } = this.context

        return (
            <Layout visible={this.props.show}>
                <View>
                    <Icon callback={hideModal} icon={icon.toLowerCase()} />
                    <Title style={{...styles.title, color: colors.common.text1 }} textStyles={{ width: 'auto', paddingHorizontal: 10 }}>
                        {title}
                    </Title>
                    <View style={{ marginTop: 8, marginBottom: -5 }}>
                        <Text style={{...styles.text, color: colors.sendScreen.amount }}>
                            {description}
                        </Text>
                    </View>
                    <View>
                        <Button onPress={reverse ? this.handleYes : this.handleNo} color={colors.modal.warning} shadow={true} style={{ marginTop: 17 }}>
                            {oneButton ? oneButton : reverse ? strings(yesTitle) : strings(noTitle)}
                        </Button>
                        <Button onPress={reverse ? this.handleNo : this.handleYes} style={{ backgroundColor: 'transparent', color: colors.modal.warning }}>
                            {twoButton ? twoButton : reverse ? strings(noTitle) : strings(yesTitle)}
                        </Button>
                    </View>
                </View>
            </Layout>
        )
    }
}

YesNoModal.contextType = ThemeContext

export default YesNoModal

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
        letterSpacing: 0.5
    }
})

/*
<Modal
                type='fail'
                title='Enter a password to encrypt your wallet'
                descr='You have done a mistake in recovery phrase. Please try again.'
                visible={this.state.visible}
                callback={this.callback}
            />
 */
