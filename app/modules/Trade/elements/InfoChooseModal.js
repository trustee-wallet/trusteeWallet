import React, { Component } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Dimensions
} from 'react-native';

import Button from '../../../components/elements/Button';
import ButtonLine from '../../../components/elements/ButtonLine';

import { hideModal } from "../../../appstores/Actions/ModalActions";
import Modal from "react-native-modal";
import GradientView from "../../../components/elements/GradientView";

import Cross from "react-native-vector-icons/Entypo";

import { strings } from 'root/app/services/i18n';

const width = Dimensions.get('window').width;
const { width: WIDTH } = Dimensions.get("window");

export class CongratsModal extends Component {

    constructor(props){
        super(props);
    }

    handleHide = () => {
        const { data } = this.props;
        const { declineCallback } = data.data

        typeof declineCallback != "undefined" ? declineCallback() : null
        hideModal()
    }

    render() {
        const { show, data } = this.props;
        const { title, description, declineCallback, acceptCallback, hideBottom } = data.data;

        return (
            <Modal style={styles.modal} hasBackdrop={false} isVisible={show}>
                <View style={styles.content}>
                    <GradientView style={[styles.bg, typeof hideBottom != "undefined" && hideBottom ? { borderRadius: 15, shadowColor: "#000",
                        shadowOffset: {
                            width: 0,
                            height: 2,
                        },
                        shadowOpacity: 0.23,
                        shadowRadius: 2.62,

                        elevation: 4, } : null ]} array={styles_.array} start={styles_.start} end={styles_.end}>
                        <Text style={styles.title}>
                            { title }
                        </Text>
                        <Text style={styles.text}>
                            { description }
                        </Text>
                        <TouchableOpacity onPress={() => this.handleHide()} style={styles.cross}>
                            <Cross name={'cross'} size={30} color={'#fff'} />
                        </TouchableOpacity>
                    </GradientView>
                    {
                        typeof hideBottom != "undefined" && hideBottom ? null :
                            <View style={styles.bottom}>
                                <Button press={() => declineCallback()} styles={styles.btn}>
                                    { strings('modal.infoChoose.decline') }
                                </Button>
                                <ButtonLine press={() => acceptCallback()} styles={styles.btn}>
                                    { strings('modal.infoChoose.accept') }
                                </ButtonLine>
                            </View>
                    }
                </View>
            </Modal>
        )
    }
}

const styles_ = {
    array: ['#43156d','#7127ab'],
    start: { x: 0.0, y: 0.5 },
    end: { x: 1, y: 0.5 },
};

export default CongratsModal;

const styles = {
    modal: {
        padding: 15,
        justifyContent: 'center'
    },
    content: {
        //height: 450,
        borderRadius: 14,
        backgroundColor: '#fff',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.23,
        shadowRadius: 2.62,

        elevation: 4,

    },
    bg: {
        /*position: 'relative',
        flex: 1,*/
        alignItems: 'center',
        borderTopLeftRadius: 14,
        borderTopRightRadius: 14
    },
    cross: {
        position: 'absolute',
        top: 10,
        right: 10
    },
    icon: {
        width: 230,
        height: 220,
        marginTop: 10,
        marginBottom: 10
    },
    title: {
        marginTop: 12,
        marginBottom: 5,
        width: WIDTH < 410 ? 180 : '80%',
        fontFamily: 'SFUIDisplay-Semibold',
        fontSize: 18,
        textAlign: 'center',
        color: '#f4f4f4',
    },
    text: {
        paddingLeft: 15,
        paddingRight: 15,
        marginBottom: 10,
        fontFamily: 'SFUIDisplay-Regular',
        fontSize: 14,
        color: '#f4f4f4'
    },
    bottom: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingLeft: 15,
        paddingRight: 15,
        paddingTop: 24,
        paddingBottom: 24,
    },
    btn: {
        width: width > 320 ? 122 : 100
    }
};