/**
 * @version 0.44
 * @author yura
 */

import React, { PureComponent } from 'react'
import { Dimensions, PixelRatio, StyleSheet, TouchableOpacity, View } from 'react-native'
import { connect } from 'react-redux'

import { ThemeContext } from '@app/modules/theme/ThemeProvider'

import { getSelectedWalletData } from '@app/appstores/Stores/Main/selectors'
import Input from '@app/components/elements/new/TextInput'
import homeAction from '@app/appstores/Stores/HomeScreen/HomeScreenActions'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const PIXEL_RATIO = PixelRatio.get()

let SIZE = 25
if (PIXEL_RATIO * 1 <= 2 && SCREEN_WIDTH < 400) {
    SIZE = 20 // iphone 5s
}

class WalletName extends PureComponent {

    constructor(props) {
        super(props)
        this.state = {
            walletNameText: null,
            isEditing: false
        }
    }

    componentDidMount() {
        this.setState(() => ({ walletNameText: this.props.selectedWallet.walletName }))
    }

    onLongPress = () => {
        setTimeout(() => {
            this.nameInputRef.focus()
        }, 200)
        this.setState(() => ({ isEditing: true }))
    }

    prepareWalletName = (walletName, isEditable) => {
        let tmpWalletName = walletName
        if (!isEditable) {
            try {
                tmpWalletName = tmpWalletName.length > SIZE ? tmpWalletName.slice(0, SIZE) + '...' : tmpWalletName
                // tmpWalletName = tmpWalletName.replace(/[\u2006]/g, '').split('').join(String.fromCodePoint(parseInt('2006', 16)))
            } catch (e) {
                tmpWalletName = 'TRUSTEE WALLET'
            }
        }
        return tmpWalletName
    }

    onChangeName = (text) => {
        const tmpText = text.replace(/[\u2006]/g, '')
        homeAction.setWalletName(tmpText)
    }

    onBlurInput = (walletHash, walletName, walletNameText) => {
        this.nameInputRef.blur()
        this.nameInputRef.blur()
        this.setState(() => ({ isEditing: false }))
        homeAction.saveNewWalletName(walletHash, walletName, walletNameText)

    }

    render() {

        const { walletHash } = this.props.selectedWallet
        const { walletNameText, isEditing } = this.state
        const { walletName } = this.props.walletInfo

        const { colors } = this.context

        return (
            <View style={styles.wrapper}>
                <View style={styles.content}>
                    <Input
                        inputStyle={[styles.input, { color: colors.common.text1 }]}
                        containerStyle={styles.container}
                        compRef={ref => this.nameInputRef = ref}
                        // placeholder={strings(`components.elements.modal.input.placeholder`).split('').join(String.fromCodePoint(parseInt('2006', 16)))}
                        // placeholder={strings(`components.elements.modal.input.placeholder`)}
                        placeholder=''
                        editable={isEditing}
                        selectionColor={colors.common.text2}
                        onBlur={() => this.onBlurInput(walletHash, walletName.text, walletNameText)}
                        onChangeText={(text) => this.onChangeName(text)}
                        value={this.prepareWalletName(walletName.text || walletNameText, isEditing)}
                    />
                </View>
                {
                    !isEditing ?
                        <TouchableOpacity style={styles.touchableOpacity} onLongPress={this.onLongPress} />
                        : null
                }
            </View>
        )
    }

}

WalletName.contextType = ThemeContext

const mapStateToProps = (state) => {
    return {
        selectedWallet: getSelectedWalletData(state),
        walletInfo: state.homeScreenStore.walletInfo
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        dispatch
    }
}


export default connect(mapStateToProps, mapDispatchToProps)(WalletName)

const styles = StyleSheet.create({
    wrapper: {
        position: 'relative',
        height: 44
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        minWidth: 150,
        maxWidth: 220,
        height: '100%',
    },
    input: {
        fontFamily: 'Montserrat-Bold',
        fontSize: 14,
        lineHeight: 18,
        textAlign: 'center',
        backgroundColor: 'transparent',
        paddingHorizontal: 0
    },
    touchableOpacity: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 2
    },
    container: {
        elevation: 0,
        shadowColor: 'transparent',
        shadowRadius: 0,
        shadowOpacity: 0,
        shadowOffset: {
            width: 0,
            height: 0
        }
    }
})


