/**
 * @version 0.9
 */
import React, { Component } from 'react'
import { View, Text, TouchableOpacity, Image, Dimensions } from 'react-native'

import Button from '../../../components/elements/Button'
import ButtonLine from '../../../components/elements/ButtonLine'

import { hideModal } from '../../../appstores/Stores/Modal/ModalActions'
import Modal from 'react-native-modal'
import GradientView from '../../../components/elements/GradientView'
import { setFlowType } from '../../../appstores/Stores/CreateWallet/CreateWalletActions'
import NavStore from '../../../components/navigation/NavStore'

import Cross from 'react-native-vector-icons/Entypo'

import { strings } from '../../../../app/services/i18n'

const width = Dimensions.get('window').width

export class CongratsModal extends Component {

    constructor(props) {
        super(props)
    }

    handleHide = () => {
        hideModal()
    }

    handleBackup = () => {
        hideModal()
        setFlowType({ flowType: 'BACKUP_WALLET' })
        NavStore.goNext('BackupStep0Screen')
    }

    render() {
        const { show } = this.props

        return (
            <Modal style={styles.modal} hasBackdrop={false} isVisible={show}>
                <View style={styles.content}>
                    <GradientView style={styles.bg} array={styles_.array} start={styles_.start} end={styles_.end}>
                        <Image
                            style={styles.icon}
                            resizeMode='contain'
                            source={require('../../../assets/images/congratsIcon.png')}/>
                        <Text style={styles.title}>
                            {strings('walletCreate.congratsModal.title')}
                        </Text>
                        <Text style={styles.text}>
                            {strings('walletCreate.congratsModal.description')}
                        </Text>
                        <TouchableOpacity onPress={() => this.handleHide()} style={styles.cross}>
                            <Cross name={'cross'} size={30} color={'#fff'}/>
                        </TouchableOpacity>
                    </GradientView>
                    <View style={styles.bottom}>
                        <Button press={() => this.handleBackup()} styles={styles.btn}>
                            {strings('walletCreate.congratsModal.backup')}
                        </Button>
                        <ButtonLine press={() => this.handleHide()} styles={styles.btn}>
                            {strings('walletCreate.congratsModal.skip')}
                        </ButtonLine>
                    </View>
                </View>
            </Modal>
        )
    }
}

const styles_ = {
    array: ['#43156d', '#7127ab'],
    start: { x: 0.0, y: 0.5 },
    end: { x: 1, y: 0.5 }
}

export default CongratsModal

const styles = {
    modal: {
        padding: 15,
        justifyContent: 'center'
    },
    content: {
        //height: 450,
        borderRadius: 14,
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.23,
        shadowRadius: 2.62,

        elevation: 4

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
        marginBottom: 5,
        fontFamily: 'SFUIDisplay-Semibold',
        fontSize: 18,
        color: '#f4f4f4'
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
        paddingBottom: 24
    },
    btn: {
        width: width > 320 ? 122 : 100
    }
}
