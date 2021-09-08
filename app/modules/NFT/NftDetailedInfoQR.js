/**
 * @version 0.50
 */

import React from 'react'
import {
    View,
    StyleSheet,
    Dimensions,
    TouchableOpacity, Text
} from 'react-native'

import ScreenWrapper from '@app/components/elements/ScreenWrapper'
import NavStore from '@app/components/navigation/NavStore'
import { strings } from '@app/services/i18n'
import { ThemeContext } from '@app/theme/ThemeProvider'
import QrCodeBox from '@app/components/elements/QrCodeBox'
import qrLogo from '@assets/images/logoWithWhiteBG.png'
import Log from '@app/services/Log/Log'
import { setLoaderStatus } from '@app/appstores/Stores/Main/MainStoreActions'
import config from '@app/config/config'
import BlocksoftKeysForRef from '@crypto/actions/BlocksoftKeysForRef/BlocksoftKeysForRef'
import { BlocksoftTransferPrivate } from '@crypto/actions/BlocksoftTransfer/BlocksoftTransferPrivate'
import copyToClipboard from '@app/services/UI/CopyToClipboard/CopyToClipboard'
import Toast from '@app/services/UI/Toast/Toast'
import CustomIcon from '@app/components/elements/CustomIcon'

const { width: WINDOW_WIDTH } = Dimensions.get('window')

class NftDetailedInfoQR extends React.PureComponent {

    state = {
        data: {
            signAddress: '',
            walletHash: '',
            derivationPath: '',
            tokenId: '',
            tokenBlockchainCode: '',
            contractAddress: ''
        },
        signed : false
    }

    async componentDidMount() {
        const data = NavStore.getParamWrapper(this, 'forSignature')
        this.setState({
            data
        })
        this.signMessage(data)
    }

    async signMessage(data) {
        try {
            setLoaderStatus(true)
            const now = new Date().getTime() + 'nft'

            const initData = {
                walletHash: data.walletHash,
                currencyCode: data.tokenBlockchainCode,
                derivationPath: data.derivationPath,
            }
            const res = await BlocksoftTransferPrivate.initTransferPrivate(initData)
            const signed = await BlocksoftKeysForRef.signDataForApi(now, res.privateKey)
            this.setState({signed})
        } catch (e) {
            if (config.debug.appErrors) {
                console.log('NftDetailedInfoQR signMessage error ' + e.message)
            }
            Log.log('NftDetailedInfoQR signMessage error ' + e.message)
        }
        setLoaderStatus(false)
    }


    handleBack = () => {
        NavStore.goBack()
    }

    copyToLink = (token) => {
        copyToClipboard(token)
        Toast.setMessage(strings('toast.copied')).show()
    }

    render() {
        const {
            GRID_SIZE,
            colors
        } = this.context

        //  marginLeft: GRID_SIZE * 6 - @yura todo please
        if (!this.state.signed) {
            // @todo show "generating"
        }
        const message = 'trusteenft:' + JSON.stringify({
            signed: this.state.signed,
            signAddress: this.state.data.signAddress,
            tokenId: this.state.data.tokenId,
            tokenBlockchainCode: this.state.data.tokenBlockchainCode,
            contractAddress: this.state.data.contractAddress
        })
        const subMessage = message.substring(0, 16) + '...'

        return (
            <ScreenWrapper
                title={strings('nftMainScreen.titleQR')}
                leftType='back'
                leftAction={this.handleBack}
            >
                <View style={[styles.tokenContainer, { marginLeft: GRID_SIZE, marginTop: GRID_SIZE * 1.5 }]}>
                    <TouchableOpacity
                        onPress={() => this.copyToLink(message)}
                        style={styles.qr}
                        activeOpacity={0.8}
                    >
                        <QrCodeBox
                            getRef={ref => this.refSvg = ref}
                            value={message}
                            size={WINDOW_WIDTH * 0.3254}
                            color='#404040'
                            backgroundColor='#F5F5F5'
                            logo={qrLogo}
                            logoSize={WINDOW_WIDTH * 0.1175}
                            logoBackgroundColor='transparent'
                            onError={(e) => {
                                Log.err('MnemonicQrCode QRCode error ' + e.message)
                            }}
                        />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tokenWrapper, {
                            backgroundColor: colors.cashback.detailsBg,
                            marginRight: GRID_SIZE
                        }]}
                        onPress={() => this.copyToLink(message)}
                    >
                        <Text style={[styles.tokenText, {
                            color: colors.common.text1,
                            marginHorizontal: GRID_SIZE
                        }]}>{subMessage}</Text>
                        <View style={[styles.copyBtn, { marginTop: GRID_SIZE }]}>
                            <Text style={[styles.qrCodeTokenString, { color: colors.cashback.token }]}>
                                {strings('account.receiveScreen.copy')}
                            </Text>
                            <CustomIcon name='copy' size={19} color={colors.cashback.token} />
                        </View>
                    </TouchableOpacity>
                </View>
            </ScreenWrapper>
        )
    }
}

NftDetailedInfoQR.contextType = ThemeContext

export default NftDetailedInfoQR

const styles = StyleSheet.create({
    emptyText: {
        fontFamily: 'SFUIDisplay-SemiBold',
        fontSize: 14,
        lineHeight: 18,
        letterSpacing: 1
    },
    qr: {
        backgroundColor: '#F5F5F5',
        width: WINDOW_WIDTH * 0.3905,

        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 24,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 3
        },
        shadowOpacity: 0.27,
        shadowRadius: 4.65,
        elevation: 6
    },
    tokenWrapper: {
        width: WINDOW_WIDTH * 0.4905,
        height: WINDOW_WIDTH * 0.3905,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center'
    },
    tokenContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    tokenText: {
        fontFamily: 'SFUIDisplay-SemiBold',
        fontSize: 15,
        lineHeight: 19,
        letterSpacing: 1.5,
        textAlign: 'center'
    },
    qrCodeTokenString: {
        alignSelf: 'center',
        textTransform: 'uppercase',
        fontFamily: 'Montserrat-Bold',
        fontSize: 12,
        lineHeight: 17,
        letterSpacing: 1.5,
        paddingRight: 4
    },
    copyBtn: {
        flexDirection: 'row',
        textAlign: 'center'
    }
})
