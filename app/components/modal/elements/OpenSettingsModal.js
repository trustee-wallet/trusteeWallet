/**
 * @version 0.9
 */
import React, { Component } from 'react'
import { View, StyleSheet } from 'react-native'

import Layout from '../../../components/elements/modal/Layout'
import Title from '../../../components/elements/modal/Title'
import Text from '../../../components/elements/modal/Text'
import Button from '../../../components/elements/modal/Button'
import Icon from '../../../components/elements/modal/Icon'
import ButtonWrap from '../../../components/elements/modal/ButtonWrap'
import { hideModal } from '../../../appstores/Stores/Modal/ModalActions'
import { strings } from '../../../services/i18n'
import Line from '../../elements/modal/Line'

export default class OpenSettingsModal extends Component {

    constructor(props) {
        super(props)
    }

    handleHide = () => {
        const { btnCancelCallback } = this.props.data

        hideModal()

        if (typeof btnCancelCallback != 'undefined')
            btnCancelCallback()
    }

    render() {
        const { show, callback } = this.props
        const { icon, title, description, btnSubmitText, component, error } = this.props.data
        if (typeof (error) !== 'undefined' && typeof (error.log) !== 'undefined') {
            // make visible for advanced users or devs @Misha? alert(error.log)
        }
        return (
            <Layout visible={show}>
                <View>
                    <Icon callback={this.handleHide} icon={`${icon === true ? 'success' : icon === false ? 'fail' : icon === null ? 'warning' : ''}`}/>
                    <Title style={styles.title}>
                        {title}
                    </Title>
                    <View style={{ paddingHorizontal: 15 }}>
                        <Text style={styles.text}>
                            {description}
                        </Text>
                    </View>
                    {typeof component != 'undefined' ? component() : null}
                    <ButtonWrap>
                        <Button onPress={this.handleHide}>
                            {strings('walletBackup.skipElement.cancel')}
                        </Button>
                        <Line/>
                        <Button onPress={callback}>
                            {btnSubmitText}
                        </Button>
                    </ButtonWrap>
                </View>
            </Layout>
        )
    }
}

const styles = StyleSheet.create({
    title: {
        marginTop: 15
    },
    text: {
        marginTop: 5
    }
})
