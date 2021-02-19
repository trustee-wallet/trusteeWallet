/**
 * @version 0.9
 */
import React, { Component } from 'react'
import { connect } from 'react-redux'
import {
    View,
    Text,
    TouchableOpacity,
    Animated,
    StyleSheet,
    Dimensions
} from 'react-native'
import IconMaterial from 'react-native-vector-icons/MaterialIcons'

import GradientView from '../../../components/elements/GradientView'
import CustomIcon from '../../../components/elements/CustomIcon'
import NavStore from '../../../components/navigation/NavStore'

import Settings from './Settings'

import cryptoWalletActions from '../../../appstores/Actions/CryptoWalletActions'
import { showModal } from '../../../appstores/Stores/Modal/ModalActions'
import { setFlowType, setWalletName } from '../../../appstores/Stores/CreateWallet/CreateWalletActions'

import { strings } from '../../../services/i18n'

import DaemonCache from '../../../daemons/DaemonCache'
import BlocksoftPrettyNumbers from '../../../../crypto/common/BlocksoftPrettyNumbers'

import { ThemeContext } from '../../../modules/theme/ThemeProvider'
import { reverse } from 'lodash'


const smallDevice = Dimensions.get('screen').width < 370

class Wallet extends Component {

    constructor(props) {
        super(props)
        this.state = {
            isShowSettings: false
        }
    }

    handleBackUpModal = () => {

        const { walletName } = this.props.wallet

        showModal({
            type: 'YES_NO_MODAL',
            title: strings('settings.walletList.backupModal.title'),
            icon: 'WARNING',
            description: strings('settings.walletList.backupModal.description', { walletName }),
            oneButton: strings('settings.walletList.backupModal.save'),
            twoButton: strings('settings.walletList.backupModal.late'),
            noCallback: () => {
                this.handleBackup()
            }
        }, () => {})
    }

    handleBackup = async () => {
        setFlowType({ flowType: 'BACKUP_WALLET' })
        setWalletName({ walletName: this.props.wallet.walletName })
        if (this.props.wallet.walletHash !== this.props.selectedWallet.walletHash) {
            await cryptoWalletActions.setSelectedWallet(this.props.wallet.walletHash, 'handleBackupNeeded')
        }
        NavStore.goNext('BackupStep0Screen', { flowSubtype: 'backup' })
    }

    handleSelectWallet = async () => {
        await cryptoWalletActions.setSelectedWallet(this.props.wallet.walletHash, 'handleSelectWallet')
    }

    handleOpenAdvanced = () => NavStore.goNext('AdvancedWalletScreen')

    getBalanceData = () => {
        const { wallet } = this.props
        const CACHE_SUM = DaemonCache.getCache(wallet.walletHash)

        let walletBalance = 0
        let currencySymbol = ''
        if (CACHE_SUM) {
            walletBalance = CACHE_SUM.balance
            currencySymbol = CACHE_SUM.basicCurrencySymbol
        }

        let tmp = walletBalance.toString().split('.')
        let beforeDecimal = BlocksoftPrettyNumbers.makeCut(tmp[0]).separated
        let afterDecimal = ''
        if (typeof tmp[1] !== 'undefined') {
            afterDecimal = '.' + tmp[1].substr(0, 2)
        }

        return { currencySymbol, beforeDecimal, afterDecimal };
    }

    render() {
        const {
            selectedWallet,
            wallet,
            openSettings,
            isBalanceVisible
        } = this.props

        const isSelected = wallet.walletHash === selectedWallet.walletHash
        const isBackedUp = wallet.walletIsBackedUp

        const balanceData = this.getBalanceData()

        const { colors, GRID_SIZE } = this.context

        return (
            <TouchableOpacity
                style={[styles.bgContainer, isSelected && styles.activeContainer, { marginVertical: GRID_SIZE / 2, borderColor: colors.walletManagment.walletItemBorderColor }]}
                disabled={isSelected}
                onPress={this.handleSelectWallet}
            >
                <GradientView
                    array={isSelected ? colors.walletManagment.walletItemBgActive : colors.walletManagment.walletItemBg}
                    start={{ x: 1, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.container}
                >
                    <View style={[styles.balanceContainer, !isBackedUp && { flex: 1 }]}>
                        <Text style={[styles.walletName, { color: colors.common.text3 }]} numberOfLines={1}>{wallet.walletName}</Text>
                        {isBalanceVisible ? (
                            <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
                                <Text style={[styles.balanceCurrencySymbol, { color: colors.common.text1 }]}>{balanceData.currencySymbol}</Text>
                                <Text style={[styles.balanceBeforeDecimal, { color: colors.common.text1 }]}>{balanceData.beforeDecimal}</Text>
                                <Text style={[styles.balanceAfterDecimal, { color: colors.common.text1 }]}>{balanceData.afterDecimal}</Text>
                            </View>
                        ) : ( <Text style={[styles.balanceHidden, { color: colors.common.text1 }]}>****</Text> )}
                    </View>
                    {isBackedUp ? (
                        <TouchableOpacity
                            style={styles.advancedButton}
                            hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
                            activeOpacity={0.8}
                            onPress={this.handleOpenAdvanced}
                            disabled={!isSelected}
                        >
                            <CustomIcon name={'coinSettings'} size={20} color={isSelected ? colors.common.text1 : colors.common.text2} />
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            style={[styles.backupContainer, { borderColor: colors.walletManagment.walletItemBorderColor, paddingLeft: GRID_SIZE }, smallDevice && { flex: 1.5 }]}
                            onPress={this.handleBackUpModal}
                            activeOpacity={0.8}
                        >
                            <Text style={[styles.backupText, { color: colors.walletManagment.walletItemBorderColor, marginRight: GRID_SIZE / 2 }]}>{strings('settings.walletList.backupNeeded')}</Text>
                            <IconMaterial name="error-outline" size={22} color={colors.walletManagment.walletItemBorderColor} />
                        </TouchableOpacity>
                    )}
                </GradientView>
            </TouchableOpacity>
        )
    }
}

Wallet.contextType = ThemeContext

export default Wallet

const styles = StyleSheet.create({
    bgContainer: {
        borderRadius: 16,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 10,
        shadowOffset: {
            width: 0,
            height: 5
        },
        elevation: 10
    },
    activeContainer: {
        shadowOpacity: 0,
        elevation: 0,
        borderWidth: 2,
    },
    container: {
        borderRadius: 16,
        flex: 1,
        paddingHorizontal: 16,
        paddingVertical: 19,
        flexDirection: 'row'
    },
    balanceContainer: {
        flex: 1.8,
        paddingRight: 5,
    },
    backupContainer: {
        flex: 1,
        borderLeftWidth: 2,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    advancedButtonDotRow: {
        flexDirection: 'row'
    },
    advancedButtonDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        margin: 2,
    },
    walletName: {
        fontFamily: 'SFUIDisplay-Semibold',
        fontSize: 14,
        lineHeight: 18,
        letterSpacing: 1,
        marginBottom: 5,
    },
    balanceCurrencySymbol: {
        fontFamily: 'Montserrat-SemiBold',
        fontSize: 18,
        lineHeight: 18,
        marginBottom: 2,
        marginRight: 4
    },
    balanceBeforeDecimal: {
        fontFamily: 'Montserrat-SemiBold',
        fontSize: 24,
        lineHeight: 24,
    },
    balanceAfterDecimal: {
        fontFamily: 'Montserrat-Bold',
        fontSize: 16,
        lineHeight: 24,
    },
    balanceHidden: {
        fontFamily: 'Montserrat-SemiBold',
        fontSize: 24,
        lineHeight: 24,
        marginTop: 4,
        marginBottom: -4,
    },
    backupText: {
        fontFamily: 'SFUIDisplay-Bold',
        fontSize: 13,
        lineHeight: 17,
        letterSpacing: 1.75,
        flex: 1,
    }
})
