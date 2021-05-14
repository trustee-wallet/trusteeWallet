/**
 * @version 0.43
 * @author yura
 */
import React from 'react'
import { StyleSheet, TouchableOpacity, View } from 'react-native'

import Layout from '@app/components/elements/modal/Layout'
import Title from '@app/components/elements/modal/Title'
import Text from '@app/components/elements/modal/Text'
import Button from '@app/components/elements/modal/Button'
import Icon from '@app/components/elements/modal/Icon'
import { hideModal } from '@app/appstores/Stores/Modal/ModalActions'

import { ThemeContext } from '@app/modules/theme/ThemeProvider'
import copyToClipboard from '@app/services/UI/CopyToClipboard/CopyToClipboard'
import MarketingEvent from '@app/services/Marketing/MarketingEvent'
import Toast from '@app/services/UI/Toast/Toast'
import { strings } from '@app/services/i18n'

class InfoModal extends React.PureComponent {

    handleHide = async () => {
        hideModal()
        const { callback } = this.props
        try {
            if (typeof callback !== 'undefined') {
                await callback()
            }
        } catch (e) {
            // do nothing
        }

    }

    copyToClip = (info) => {
        MarketingEvent.logEvent('info_copyToClip', { info })
        copyToClipboard(info)
        Toast.setMessage(strings('toast.copied')).show()
    }

    render() {
        const { show } = this.props
        const { icon, title, description, component, error, noBackdropPress } = this.props.data
        if (typeof error !== 'undefined' && typeof error.log !== 'undefined') {
            // make visible for advanced users or devs @Misha? alert(error.log)
        }

        const { colors } = this.context

        return (
            <Layout visible={show} noBackdropPress={noBackdropPress || false} >
                <View>
                    <Icon callback={this.handleHide} icon={`${icon === true ? 'success' : icon === false ? 'fail' : icon === null ? 'warning' : icon.toLowerCase()}`}/>
                    <Title style={{...styles.title, color: colors.common.text1 }}>
                        {title}
                    </Title>
                    <TouchableOpacity
                        onPress={() => this.copyToClip(description)}
                    >
                    <View style={{ marginTop: 8, marginBottom: 15 }}>
                        <Text style={{...styles.text, color: colors.sendScreen.amount }}>
                            {description}
                        </Text>
                    </View>
                    </TouchableOpacity>
                    {typeof component !== 'undefined' ? component() : null}
                    <View style={{marginBottom: 30 }}>
                        <Button onPress={() => { return this.handleHide()}} color={ icon === true ? colors.modal.success : icon === false ? colors.modal.warning : icon === null ? colors.modal.warning  : colors.modal.info  } shadow={true} style={{ marginTop: 17 }}>
                            Ok1
                        </Button>
                    </View>
                </View>
            </Layout>
        )
    }
}

InfoModal.contextType = ThemeContext

export default InfoModal

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
        fontSize: 14,
        lineHeight: 20,
        textAlign: 'center',
        letterSpacing: 0.5,
        marginBottom: -6
    }
})
