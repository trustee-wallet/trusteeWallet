import React, { Component } from 'react';
import { View, StyleSheet } from 'react-native';

import Layout from '../../../components/elements/modal/Layout';
import Title from '../../../components/elements/modal/Title';
import Text from '../../../components/elements/modal/Text';
import Button from '../../../components/elements/modal/Button';
import Line from '../../../components/elements/modal/Line';
import ButtonWrap from '../../../components/elements/modal/ButtonWrap';
import Input from '../../../components/elements/modal/Input';

export default class ConfirmPassword extends Component {

    constructor(props){
        super(props);
        this.state = {
            value: '',
            visible: false
        }
    }

    handleShow = () => {
        this.setState({ visible: true })
    };

    handleHide = () => {
        this.setState({ visible: false })

        console.log(this.state)
    };

    handleInput = (value) => {
        this.setState({
            value
        });
    };

    render() {
        return (
            <Layout visible={this.state.visible}>
                <View>
                    <Title style={styles.title}>
                        Enter your password again to
                        confirm
                    </Title>
                    <Input value={this.state.value} handleInput={this.handleInput} />
                    <ButtonWrap>
                        <Button onPress={() => this.handleHide()}>
                            Cancel
                        </Button>
                        <Line />
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
        marginTop: 35
    },
    text: {
        marginTop: 5
    }
});
