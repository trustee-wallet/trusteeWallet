/**
 * @version 0.9
 * @misha - is it actually used? seems not translated
 */
import React, { Component } from 'react'
import { View, StyleSheet } from 'react-native'

import Layout from '../../../components/elements/modal/Layout'
import Title from '../../../components/elements/modal/Title'
import Text from '../../../components/elements/modal/Text'
import Button from '../../../components/elements/modal/Button'
import Line from '../../../components/elements/modal/Line'
import ButtonWrap from '../../../components/elements/modal/ButtonWrap'

export default class ProtectPassword extends Component {

    constructor(props) {
        super(props)
        this.state = {
            value: '',
            visible: false
        }
    }

    handleShow = () => {
        this.setState({ visible: true })
    }

    handleHide = () => {
        this.setState({ visible: false })

        console.log(this.state)
    }

    handleInput = (value) => {
        this.setState({
            value
        })
    }

    render() {
        return (
            <Layout visible={this.state.visible}>
                <View>
                    <Title style={styles.title}>
                        Would you like to protect
                        your wallet with a password?
                    </Title>
                    <Text style={styles.text}>
                        Encryption can protect your funds if this device
                        is stolen or compromised by malicious software.
                    </Text>
                    <ButtonWrap>
                        <Button onPress={() => this.handleHide()}>
                            NO
                        </Button>
                        <Line/>
                        <Button onPress={() => this.handleHide()}>
                            YES
                        </Button>
                    </ButtonWrap>
                </View>
            </Layout>
        )
    }
}

const styles = StyleSheet.create({
    title: {
        marginTop: 35
    },
    text: {
        marginTop: 5
    }
})
