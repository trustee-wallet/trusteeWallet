/**
 * @version 0.50
 */

import React from 'react'
import {
    View,
    StyleSheet
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
        signed: false
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
            this.setState({ signed })
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

        return (
            <ScreenWrapper
                title={strings('nftMainScreen.titleQR')}
                leftType='back'
                leftAction={this.handleBack}
            >
                <View style={{ ...styles.tokenContainer, marginTop: GRID_SIZE * 2 }}>
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
                </View>
            </ScreenWrapper>
        )
    }
}

NftDetailedInfoQR.contextType = ThemeContext

export default NftDetailedInfoQR

const styles = StyleSheet.create({
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
    },
    tokenContainer: {
        flexGrow: 1,
        alignItems: 'center'
    }
})
