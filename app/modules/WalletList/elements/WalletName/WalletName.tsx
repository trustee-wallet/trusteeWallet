/**
 * @version 0.11
 */
import React, { Component } from 'react'
import { Dimensions, PixelRatio, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native'
import { connect, ConnectedProps } from 'react-redux'
import { Dispatch } from 'redux'

import { ThemeContext } from '../../../../modules/theme/ThemeProvider'


import {
    WalletName
} from '../../../../appstores/Stores/HomeScreen/Types'

import {
    setInputEditable,
    setWalletName,
    saveNewWalletName
} from '../../../../appstores/Stores/HomeScreen/HomeScreenActions'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const PIXEL_RATIO = PixelRatio.get()

let SIZE = 25
if (PIXEL_RATIO*1 <= 2 && SCREEN_WIDTH < 400) {
    SIZE = 20 // iphone 5s
}

const mapState = (state: any) => {
    const walletName: WalletName = typeof state.homeScreenStore.walletInfo.walletName.text !== 'undefined' ? state.homeScreenStore.walletInfo.walletName.text : state.homeScreenStore.walletInfo.walletName
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
            try {
                tmpWalletName = tmpWalletName.length > SIZE ? tmpWalletName.slice(0, SIZE) + '...' : tmpWalletName
                // tmpWalletName = tmpWalletName.replace(/[\u2006]/g, '').split('').join(String.fromCodePoint(parseInt('2006', 16)))
            } catch (e) {
                tmpWalletName = 'TRUSTEE WALLET'
            }
        }
        return tmpWalletName
    }

    onChangeText = (text: string) => {
        const tmpText = text.replace(/[\u2006]/g, '')
        this.props.setWalletName(tmpText)
    }

    renderInput = (props: Props) => {
        const { colors } = this.context
        return (
            <TextInput
                ref={ref => this.nameInputRef = ref}
                style={[styles.input, { color: colors.common.text1 }]}
                // placeholder={strings(`components.elements.modal.input.placeholder`).split('').join(String.fromCodePoint(parseInt('2006', 16)))}
                // placeholder={strings(`components.elements.modal.input.placeholder`)}
                placeholder=''
                editable={props.walletName.isEditable}
                selectionColor={colors.common.text2}
                onBlur={() => this.onBlur(props.walletHash, props.walletName.text, props.walletNameText)}
                onChangeText={(text: string)=>this.onChangeText(text)}
                value={this.prepareWalletName(props.walletName.text || props.walletNameText, props.walletName.isEditable)}
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

WalletNameComponent.contextType = ThemeContext

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
        minWidth: 120,
        maxWidth: 200,
        height: '100%'
    },
    input: {
        fontFamily: 'Montserrat-Bold',
        fontSize: 14,
        lineHeight: 18,
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
