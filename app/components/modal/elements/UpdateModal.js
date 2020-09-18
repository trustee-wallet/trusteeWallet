import React, { Component } from 'react'
import { View } from 'react-native'

import Layout from '../../../components/elements/modal/Layout'
import Title from '../../../components/elements/modal/Title'
import Text from '../../../components/elements/modal/Text'
import Button from '../../../components/elements/modal/Button'
// import Icon from '../../../components/elements/modal/Icon'

import { hideModal } from '../../../appstores/Stores/Modal/ModalActions'

import { strings } from '../../../services/i18n'

export default class UpdateModal extends Component {

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

        return (
            <Layout visible={this.props.show}>
                <View>
                    <Title style={styles.title} textStyles={{ width: 'auto', paddingHorizontal: 10 }}>
                        {title}
                    </Title>
                    <View style={{ marginTop: 16, marginBottom: 30 }}>
                        <Text style={styles.text}>
                            {description}
                        </Text>
                    </View>
                    <View style={{ marginBottom: 12 }}>
                        <Button onPress={this.handleYes} color={'#864DD9'} shadow={true}>
                            {strings('modal.infoUpdateModal.download')}
                        </Button>
                        <Button onPress={this.handleNo} style={{ backgroundColor: 'none', color: '#864DD9' }}>
                            {strings('modal.infoUpdateModal.notNow')}
                        </Button>
                    </View>
                </View>
            </Layout>
        )
    }
}

const styles = {
    title: {
        fontFamily: 'Montserrat-Bold',
        fontStyle: 'normal',
        fontWeight: 'bold',
        fontSize: 18,
        lineHeight: 26,
        textAlign: 'center',
        color: '#404040'
    },
    text: {
        color: '#5C5C5C',
        fontFamily: 'SFUIDisplay-Regular',
        fontStyle: 'normal',
        fontWeight: 'normal',
        fontSize: 14,
        lineHeight: 20,
        textAlign: 'center',
        letterSpacing: 0.5
    }
}
