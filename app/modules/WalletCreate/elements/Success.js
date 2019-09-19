import React, { Component } from 'react';
import { View, StyleSheet } from 'react-native';

import Layout from '../../../components/elements/modal/Layout';
import Title from '../../../components/elements/modal/Title';
import Text from '../../../components/elements/modal/Text';
import Button from '../../../components/elements/modal/Button';
import Icon from '../../../components/elements/modal/Icon';
import ButtonWrap from '../../../components/elements/modal/ButtonWrap';

export default class Skip extends Component {

    constructor(props){
        super(props);
        this.state = {
            visible: false
        }
    }

    handleShow = () => {
        this.setState({ visible: true })
    };

    handleHide = () => {
        this.setState({ visible: false })
    };

    render() {
        return (
            <Layout visible={this.state.visible}>
                <View>
                    <Icon callback={this.handleHide} icon='success' />
                    <Title style={styles.title}>
                        Congratulation
                    </Title>
                    <Text style={styles.text}>
                        Your wallet was created.
                    </Text>
                    <ButtonWrap>
                        <Button onPress={() => this.handleHide()}>
                            OK
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
});