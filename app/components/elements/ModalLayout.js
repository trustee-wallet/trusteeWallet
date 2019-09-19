import React, { Component } from 'react';
import Modal from 'react-native-modal';
import { Text, View} from 'react-native';

export default class ModalLayout extends Component {

    constructor(props){
        super(props);
    }

    renderTemplate = () => {
        if(this.props.type == 'fail'){
            return (
                <View>
                    <Text>
                        { this.props.title }
                    </Text>
                    <Text>
                        { this.props.descr }
                    </Text>
                </View>
            )
        }
    };

    render() {
        return (
            <View>
                <Modal hasBackdrop={false} isVisible={this.props.visible}>
                    {
                        this.renderTemplate()
                    }
                </Modal>
            </View>
        )
    }
}