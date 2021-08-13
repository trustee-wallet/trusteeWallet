/**
 * @version 0.2
 * @author yura
 */
import React, { Component } from 'react'
import { View } from 'react-native'

import Layout from '../../../components/elements/modal/Layout'
import Title from '../../../components/elements/modal/Title'
import Text from '../../../components/elements/modal/Text'
import Button from '../../../components/elements/modal/Button'
// import Icon from '../../../components/elements/modal/Icon'

import { hideModal } from '../../../appstores/Stores/Modal/ModalActions'

import { strings } from '../../../services/i18n'

import { ThemeContext } from '@app/theme/ThemeProvider'

class UpdateModal extends Component {

    constructor(props) {
        super(props)
    }

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

        const { title, icon, description } = this.props.data

        const { colors } = this.context

        return (
            <Layout visible={this.props.show}>
                <View>
                    <Title style={{...styles.title, color: colors.common.text1 }} textStyles={{ width: 'auto', paddingHorizontal: 10 }}>
                        {title}
                    </Title>
                    <View style={{ marginTop: 8, marginBottom: -5 }}>
                        <Text style={{...styles.text, color: colors.sendScreen.amount }}>
                            {description}
                        </Text>
                    </View>
                    <View>
                        <Button onPress={this.handleYes} color={colors.modal.success} shadow={true} style={{ marginTop: 17 }}>
                            {strings('modal.infoUpdateModal.download')}
                        </Button>
                        <Button onPress={this.handleNo} style={{ backgroundColor: 'transparent', color: colors.modal.success }}>
                            {strings('modal.infoUpdateModal.notNow')}
                        </Button>
                    </View>
                </View>
            </Layout>
        )
    }
}

UpdateModal.contextType = ThemeContext

export default UpdateModal

const styles = {
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
}
