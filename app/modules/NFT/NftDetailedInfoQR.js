/**
 * @version 0.50
 */

import React from 'react'
import {
    View,
    StyleSheet,
    Text,
    ActivityIndicator,
    TouchableOpacity,
    ScrollView
} from 'react-native'

import ScreenWrapper from '@app/components/elements/ScreenWrapper'
import NavStore from '@app/components/navigation/NavStore'
import { strings } from '@app/services/i18n'
import { ThemeContext } from '@app/theme/ThemeProvider'
import QrCodeBox from '@app/components/elements/QrCodeBox'
import qrLogo from '@assets/images/logoWithWhiteBG.png'
import Log from '@app/services/Log/Log'

import config from '@app/config/config'
import BlocksoftKeysForRef from '@crypto/actions/BlocksoftKeysForRef/BlocksoftKeysForRef'
import { BlocksoftTransferPrivate } from '@crypto/actions/BlocksoftTransfer/BlocksoftTransferPrivate'
import copyToClipboard from '@app/services/UI/CopyToClipboard/CopyToClipboard'
import Toast from '@app/services/UI/Toast/Toast'
import CustomIcon from '@app/components/elements/CustomIcon'
import Database from '@app/appstores/DataSource/Database'


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
        signed: false,
        signedStatus: 'signing'
    }

    async componentDidMount() {
        const data = NavStore.getParamWrapper(this, 'forSignature')
        this.setState({
            data
        })
        this.setState({ signed: false, signedStatus: 'signing' }, async () => {
            await this.signMessage(data)
        })
    }

    async signMessage(data) {
        try {
            const now = new Date().getTime() + 'nft'

            const initData = {
                walletHash: data.walletHash,
                currencyCode: data.tokenBlockchainCode,
                derivationPath: Database.unEscapeString(data.derivationPath)
            }
            const res = await BlocksoftTransferPrivate.initTransferPrivate(initData)
            const signed = await BlocksoftKeysForRef.signDataForApi(now, res.privateKey)
            this.setState({ signed, signedStatus: 'signed' })
        } catch (e) {
            if (config.debug.appErrors) {
                console.log('NftDetailedInfoQR signMessage error ' + e.message)
            }
            Log.log('NftDetailedInfoQR signMessage error ' + e.message)
            this.setState({ signedStatus: e.message })
        }
    }


    handleBack = () => {
        NavStore.goBack()
    }

    copyToLink = (token) => {
        copyToClipboard(token)
        Toast.setMessage(strings('toast.copied')).show()
    }

    getStatusIcon = (msg) => {

        const { colors } = this.context

        switch (msg.toLowerCase()) {
            case 'signed':
                return <CustomIcon name='check' size={48} color={colors.common.button.bg} />
            case 'signing':
                return <ActivityIndicator color={colors.common.button.bg} />
            default:
                return <CustomIcon name='close' size={36} color={colors.common.button.bg} />
        }
    }

    getStatusText = (msg) => {

        switch (msg.toLowerCase()) {
            case 'signed':
                return strings('nftMainScreen.signed')
            case 'signing':
                return strings('nftMainScreen.signing')
            default:
                return msg
        }
    }

    render() {
        const {
            GRID_SIZE,
            colors
        } = this.context

        const message = 'trusteenft:' + JSON.stringify({
            signed: this.state.signed,
            signAddress: this.state.data.signAddress,
            tokenId: this.state.data.tokenId,
            tokenBlockchainCode: this.state.data.tokenBlockchainCode,
            contractAddress: this.state.data.contractAddress
        })

        return (
            <ScreenWrapper
                title={strings('nftMainScreen.titleQR')}
                leftType='back'
                leftAction={this.handleBack}
            >
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ flexGrow: 1, padding: GRID_SIZE }}
                >
                    <View style={[styles.containerStatus, { marginTop: GRID_SIZE }]}>
                        <View style={[styles.statusIcon, { backgroundColor: colors.common.roundButtonContent }]}>
                            {this.getStatusIcon(this.state.signedStatus)}
                        </View>
                        <Text style={[styles.textStatus, { color: colors.common.text1 }]}>
                            {this.getStatusText(this.state.signedStatus)}
                        </Text>
                    </View>

                    {this.state.signed &&
                        <TouchableOpacity style={[styles.qrContainer, { marginTop: GRID_SIZE * 2 }]}
                            onPress={() => this.copyToLink(message)}
                        >
                            <View style={styles.qr}>
                                <QrCodeBox
                                    getRef={ref => this.refSvg = ref}
                                    value={message}
                                    size={200}
                                    color='#404040'
                                    backgroundColor='#F5F5F5'
                                    logo={qrLogo}
                                    logoSize={70}
                                    logoBackgroundColor='transparent'
                                    onError={(e) => {
                                        Log.err('AccountReceiveScreen QRCode error ' + e.message)
                                    }}
                                />
                            </View>
                        </TouchableOpacity>
                    }
                </ScrollView>
            </ScreenWrapper >
        )
    }
}

NftDetailedInfoQR.contextType = ThemeContext

export default NftDetailedInfoQR

const styles = StyleSheet.create({

    containerStatus: {
        justifyContent: 'center',
        alignItems: 'center'
    },
    statusIcon: {
        justifyContent: 'center',
        alignItems: 'center',
        width: 60,
        height: 60,
        borderRadius: 50,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 3
        },
        shadowOpacity: 0.27,
        shadowRadius: 4.65,
        elevation: 6
    },
    textStatus: {
        paddingTop: 20,

        fontFamily: 'Montserrat-SemiBold',
        fontSize: 17,
        lineHeight: 19
    },
    qrContainer: {
        flexGrow: 1,
        alignItems: 'center'
    },
    qr: {
        backgroundColor: '#F5F5F5',

        justifyContent: 'center',
        alignItems: 'center',
        width: 250,
        height: 250,
        borderRadius: 24,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 3
        },
        shadowOpacity: 0.27,
        shadowRadius: 4.65,
        elevation: 6
    }
})
