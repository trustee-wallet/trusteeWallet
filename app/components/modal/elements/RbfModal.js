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
import Icon from '../../../components/elements/modal/Icon'
import AsyncStorage from '@react-native-community/async-storage'

import { hideModal } from '../../../appstores/Stores/Modal/ModalActions'

import { strings } from '../../../services/i18n'

export default class RbfModal extends Component {

    constructor(props) {
        super(props)
        this.state = {
            isRBF: null
        }
    }

    handleIsActive = async () => {
        const { callback } = this.props

        callback()

        hideModal()
    }

    handleCancel = () => {

        const { noCallback } = this.props.data

        hideModal()

        if (noCallback) {
            noCallback()
        }
    }

    statusRBF = async () => {
        const status = await AsyncStorage.getItem('RBF')
        if (status === null || status.toString() === '0'){
            this.setState({
                isRBF: false
            })
        } else {
            this.setState({
                isRBF: true
            })
        }
    }

    render() {

        const { title, icon, description } = this.props.data
        this.statusRBF()
        return (
            <Layout visible={this.props.show}>
                <View>
                    <Title style={styles.title} textStyles={{ width: 'auto', paddingHorizontal: 10 }}>
                        {title}
                    </Title>
                    <View style={{ marginTop: 8, marginBottom: -5 }}>
                        <Text style={styles.text}>
                            {description}
                        </Text>
                        <Text style={{ ...styles.text, fontWeight: 'bold', color: '#404040' }}>{ this.state.isRBF === true ? strings('modal.rbfModal.statusEnable').toUpperCase() : strings('modal.rbfModal.statusDisable').toUpperCase()}</Text>
                        {this.state.isRBF !== true ? <Text style={styles.text}>{strings('modal.rbfModal.descriptionAdd')}</Text> : null}
                    </View>
                    <View>
                        <Button onPress={this.handleIsActive} color={'#864DD9'} shadow={true} style={{ marginTop: 17 }}>
                            {this.state.isRBF === true ? strings('modal.rbfModal.disable') : strings('modal.rbfModal.enable')}
                        </Button>
                        <Button onPress={this.handleCancel} style={{ backgroundColor: 'none', color: '#864DD9' }}>
                            {strings('modal.rbfModal.cancel')}
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
        color: '#404040',
        paddingTop: 15,
    },
    text: {
        color: '#5C5C5C',
        fontFamily: 'SFUIDisplay-Regular',
        fontStyle: 'normal',
        fontWeight: 'normal',
        fontSize: 14,
        lineHeight: 20,
        textAlign: 'center',
        letterSpacing: 0.5,
    }
}