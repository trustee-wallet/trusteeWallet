/**
 * @version 0.77
 * @author yura
 */

import React, { PureComponent } from 'react'
import { Dimensions, PixelRatio, StyleSheet, TouchableOpacity, View, Text } from 'react-native'
import { connect } from 'react-redux'

import { ThemeContext } from '@app/theme/ThemeProvider'

import { setSelectedWalletName } from '@app/appstores/Stores/Main/MainStoreActions'
import { getSelectedWalletData } from '@app/appstores/Stores/Main/selectors'

import config from '@app/config/config'

import Input from '@app/components/elements/new/TextInput'
import walletActions from '@app/appstores/Stores/Wallet/WalletActions'
import Toast from '@app/services/UI/Toast/Toast'
import { strings } from '@app/services/i18n'

import CustomIcon from '@app/components/elements/CustomIcon'
import NavStore from '@app/components/navigation/NavStore'
import Validator from '@app/services/UI/Validator/Validator'


const { width: SCREEN_WIDTH } = Dimensions.get('window')
const PIXEL_RATIO = PixelRatio.get()

let SIZE = 25
if (PIXEL_RATIO * 1 <= 2 && SCREEN_WIDTH < 400) {
    SIZE = 20 // iphone 5s
}

class WalletName extends PureComponent {
    state = {
        isEditing: false
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
            } catch (e) {
                tmpWalletName = 'TRUSTEE WALLET'
            }
        }
        return tmpWalletName
    }

    onChangeName = (text) => {
        const tmpText = Validator.safeWords(text.replace(/[\u2006]/g, ''), 10)
        setSelectedWalletName(tmpText)
    }

    onBlurInput = async (walletHash, walletName) => {
        this.nameInputRef.blur()
        this.setState(() => ({ isEditing: false }))
        try {
            await walletActions.setNewWalletName(walletHash, walletName)

            Toast.setMessage(strings('toast.saved')).show()
        } catch (e) {
            if (config.debug.appErrors) {
                console.log('WalletName.saveWalletName error ' + e.message)
            }
        }
    }

    handleSelectWallet = () => {
        NavStore.goNext('WalletListScreen', { source: 'HomeScreen' })
    }

    render() {
        const { walletHash, walletName } = this.props.selectedWallet
        const { isEditing } = this.state
        const { colors, GRID_SIZE } = this.context

        return (
            <TouchableOpacity
                onPress={this.handleSelectWallet}
                onLongPress={this.onLongPress}
                delayLongPress={2000}
                style={[styles.wrapper, { paddingHorizontal: GRID_SIZE }]}
            >
                <View style={styles.content}>
                    {isEditing ?
                        <Input
                            inputStyle={[styles.input, { color: colors.common.text1 }]}
                            containerStyle={styles.container}
                            compRef={ref => this.nameInputRef = ref}
                            // placeholder={strings(`components.elements.modal.input.placeholder`).split('').join(String.fromCodePoint(parseInt('2006', 16)))}
                            // placeholder={strings(`components.elements.modal.input.placeholder`)}
                            placeholder=''
                            editable={isEditing}
                            selectionColor={colors.common.text2}
                            onBlur={() => this.onBlurInput(walletHash, walletName)}
                            onChangeText={(text) => this.onChangeName(text)}
                            value={this.prepareWalletName(walletName, isEditing)}
                        /> :
                        <View style={styles.selectorWrapper}>
                            <Text style={[styles.input, { color: colors.common.text1 }]} numberOfLines={1}>{this.prepareWalletName(walletName, isEditing)}</Text>
                            <CustomIcon name='downArrow' color={colors.common.text1} size={14} style={{ paddingLeft: GRID_SIZE / 2 }} />
                        </View>
                    }
                </View>
            </TouchableOpacity>
        )
    }

}

WalletName.contextType = ThemeContext

const mapStateToProps = (state) => {
    return {
        selectedWallet: getSelectedWalletData(state)
    }
}

export default connect(mapStateToProps)(WalletName)

const styles = StyleSheet.create({
    wrapper: {
        position: 'relative',
        height: 44
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%'
    },
    input: {
        fontFamily: 'Montserrat-Bold',
        fontSize: 14,
        lineHeight: 18,
        textAlign: 'center',
        backgroundColor: 'transparent',
        paddingHorizontal: 0
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
    },
    selectorWrapper: {
        flexDirection: 'row',
        alignItems: 'center'
    }
})
