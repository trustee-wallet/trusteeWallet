import React, { Component } from 'react'
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native'
import { connect, ConnectedProps } from 'react-redux'
import { Dispatch } from 'redux'

import { strings } from '../../../../services/i18n'

import {
    WalletName
} from '../../../../appstores/Stores/HomeScreen/Types'
import {
    setInputEditable,
    setWalletName,
    saveNewWalletName
} from '../../../../appstores/Stores/HomeScreen/HomeScreenActions'

const mapState = (state: any) => {
    const walletName: WalletName = state.homeScreenStore.walletInfo.walletName
    return {
        walletName
    }
}

const mapDispatch = (dispatch: Dispatch) => {
    return {
        setWalletName: (walletName: string) => dispatch(setWalletName(walletName)),
        setInputEditable: (isEditable: boolean) => dispatch(setInputEditable(isEditable)),
        // @ts-ignore
        saveNewWalletName: (walletHash: string, newWalletName: string, oldWalletName: string) => dispatch(saveNewWalletName(walletHash, newWalletName, oldWalletName))
    }
}

const connector = connect(mapState, mapDispatch)

type PropsFromRedux = ConnectedProps<typeof connector>
type Props = PropsFromRedux & {
    walletNameText: string,
    walletHash: string
}

export class WalletNameComponent extends Component<Props, {}>{
    private nameInputRef: any

    constructor(props: Props) {
        super(props)
        this.props.setWalletName(props.walletNameText)
        this.nameInputRef = React.createRef()
    }

    onLongPress = () => {
        setTimeout(() => {
            this.nameInputRef.focus()
        }, 200)
        this.props.setInputEditable(true)
    }

    onBlur = (walletHash: string, walletName: string, walletNameText: string) => {
        this.nameInputRef.blur()
        this.props.saveNewWalletName(walletHash, walletName, walletNameText)
    }

    prepareWalletName = (walletName: string, isEditable: boolean) => {
        let tmpWalletName = walletName
        if(!isEditable) {
            tmpWalletName = tmpWalletName.length > 20 ? tmpWalletName.slice(0, 20) + '...' : tmpWalletName
            // tmpWalletName = tmpWalletName.replace(/[\u2006]/g, '').split('').join(String.fromCodePoint(parseInt('2006', 16)))
        }
        return tmpWalletName
    }

    onChangeText = (text: string) => {
        const tmpText = text.replace(/[\u2006]/g, '')
        this.props.setWalletName(tmpText)
    }

    renderInput = (props: Props) => {
        return (
            <TextInput
                ref={ref => this.nameInputRef = ref}
                style={styles.input}
                // placeholder={strings(`components.elements.modal.input.placeholder`).split('').join(String.fromCodePoint(parseInt('2006', 16)))}
                placeholder={strings(`components.elements.modal.input.placeholder`)}
                editable={props.walletName.isEditable}
                selectionColor={'#404040'}
                onBlur={() => this.onBlur(props.walletHash, props.walletName.text, props.walletNameText)}
                onChangeText={(text: string)=>this.onChangeText(text)}
                value={this.prepareWalletName(props.walletName.text, props.walletName.isEditable)}
            />
        )
    }

    render(): React.ReactElement<any, string | React.JSXElementConstructor<any>> | string | number | {} | React.ReactNodeArray | React.ReactPortal | boolean | null | undefined {
        const props = this.props

        return (
            <View style={styles.wrapper}>
                <View style={styles.content}>
                    {this.renderInput(props)}
                </View>
                {
                    !props.walletName.isEditable ?
                        <TouchableOpacity style={styles.touchableOpacity}  onLongPress={this.onLongPress}/>
                        : null
                }
            </View>
        )
    }
}

export default connector(WalletNameComponent)

const styles = StyleSheet.create({
    wrapper: {
        position: 'relative',
        height: 44
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        minWidth: 70,
        maxWidth: 200,
        height: '100%'
    },
    input: {
        fontFamily: 'Montserrat-Bold',
        color: '#404040',
        fontSize: 12,
        textAlign: 'center'
    },
    touchableOpacity: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 2
    }
})