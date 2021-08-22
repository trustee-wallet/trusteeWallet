/**
 * @version 0.50
 * @author Vadym
 */

import React from 'react'
import {
    Text,
    View,
    StyleSheet,
    FlatList,
    Dimensions,
    TouchableOpacity,
    Platform
} from 'react-native'

import { connect } from 'react-redux'

import ScreenWrapper from '@app/components/elements/ScreenWrapper'
import NavStore from '@app/components/navigation/NavStore'
import { strings } from '@app/services/i18n'
import { ThemeContext } from '@app/theme/ThemeProvider'
import ReceiveFlatListItem from '@app/modules/NFT/elements/ReceiveFlatListItem'
import QrCodeBox from '@app/components/elements/QrCodeBox'
import qrLogo from '@assets/images/logoWithWhiteBG.png'
import Log from '@app/services/Log/Log'
import CustomIcon from '@app/components/elements/CustomIcon'
import copyToClipboard from '@app/services/UI/CopyToClipboard/CopyToClipboard'
import Toast from '@app/services/UI/Toast/Toast'

import accountScanningDS from '@app/appstores/DataSource/Account/AccountScanning'
import { getSelectedWalletData } from '@app/appstores/Stores/Main/selectors'
import { setLoaderStatus } from '@app/appstores/Stores/Main/MainStoreActions'

import prettyShare from '@app/services/UI/PrettyShare/PrettyShare'
import { FileSystem } from '@app/services/FileSystem/FileSystem'

const { width: WINDOW_WIDTH } = Dimensions.get('window')

class NftReceive extends React.PureComponent {

    state = {
        selectedAddress: {}
    }

    async componentDidMount() {
        const res = await accountScanningDS.getAddresses({ currencyCode: `ETH`, walletHash: this.props.wallet.walletHash })

        this.setState({
            selectedAddress: {
                currencyCode: 'ETH',
                address: Object.keys(res)[0]
            }
        })

    }

    handleBack = () => {
        NavStore.goBack()
    }

    handleShare = () => {

        const { selectedAddress } = this.state

        try {
            setLoaderStatus(true)
            this.refSvg.toDataURL(async (data) => {
                const message = `${selectedAddress.currencyCode} \n${selectedAddress.address}`

                if (Platform.OS === 'android') {
                    // noinspection ES6MissingAwait
                    prettyShare({ message, url: `data:image/png;base64,${data}`, title: 'QR', type: 'image/png' })
                } else {
                    const fs = new FileSystem({ fileEncoding: 'base64', fileName: 'QR', fileExtension: 'jpg' })
                    await fs.writeFile(data)
                    // noinspection ES6MissingAwait
                    prettyShare({ message, url: await fs.getPathOrBase64() })
                }
                setLoaderStatus(false)
            })
        } catch (e) {
            setLoaderStatus(false)
            Log.err('NftReceive handleShare error', e)
        }
    }

    renderFlatListItem = ({ item, index }) => {
        return (
            <ReceiveFlatListItem
                data={item}
                margin={index === 0}
            />
        )
    }

    handleSelectBlockchain = async (code) => {

        const { wallet } = this.props

        const res = await accountScanningDS.getAddresses({ currencyCode: code, walletHash: wallet.walletHash })

        this.setState({
            selectedAddress: {
                currencyCode: code,
                address: Object.keys(res)[0]
            }
        })
    }

    renderFlatList = () => {

        const {
            selectedAddress
        } = this.state

        const flatListData = [
            {
                text: 'ethereum',
                inverse: selectedAddress.currencyCode === 'ETH',
                action: () => this.handleSelectBlockchain('ETH')
            },
            {
                text: 'bnb',
                inverse: selectedAddress.currencyCode === 'BNB',
                action: () => this.handleSelectBlockchain('BNB')
            },
            {
                text: 'polygon',
                inverse: selectedAddress.currencyCode === 'MATIC',
                action: () => this.handleSelectBlockchain('MATIC')
            },
        ]

        return (
            <FlatList
                data={flatListData}
                horizontal={true}
                renderItem={this.renderFlatListItem}
                showsHorizontalScrollIndicator={false}
            />
        )
    }

    copyToLink = (token) => {
        copyToClipboard(token)
        Toast.setMessage(strings('toast.copied')).show()
    }

    render() {

        const {
            selectedAddress
        } = this.state

        const {
            GRID_SIZE,
            colors
        } = this.context

        return (
            <ScreenWrapper
                title={strings('nftMainScreen.title')}
                leftType='back'
                leftAction={this.handleBack}
                rightType='share'
                rightAction={this.handleShare}
            >
                <View style={{ paddingTop: GRID_SIZE, paddingHorizontal: GRID_SIZE * 2 }}>
                    <Text
                        style={[styles.emptyText, {
                            color: colors.common.text3,
                            marginBottom: GRID_SIZE
                        }]}>{strings('nftMainScreen.emptyNftText')}</Text>
                </View>
                <View style={{ flex: 0.085, marginTop: GRID_SIZE }}>
                    {this.renderFlatList()}
                </View>
                <View style={[styles.tokenContainer, { marginLeft: GRID_SIZE, marginTop: GRID_SIZE * 1.5 }]}>
                    <TouchableOpacity onPress={() => this.copyToLink(selectedAddress.address)} style={styles.qr}>
                        <QrCodeBox
                            getRef={ref => this.refSvg = ref}
                            value={selectedAddress.address}
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
                        style={[styles.tokenWrapper, { backgroundColor: colors.cashback.detailsBg, marginRight: GRID_SIZE }]}
                        onPress={() => this.copyToLink(selectedAddress.address)}
                    >
                        <Text style={[styles.tokenText, { color: colors.common.text1, marginHorizontal: GRID_SIZE }]}>{selectedAddress.address}</Text>
                        <View style={[styles.copyBtn, { marginTop: GRID_SIZE }]}>
                            <Text style={[styles.qrCodeTokenString, { color: colors.cashback.token }]}>
                                {strings('account.receiveScreen.copy')}
                            </Text>
                            <CustomIcon name='copy' size={19} color={colors.cashback.token} />
                        </View>
                    </TouchableOpacity>
                </View>
                <View style={{ paddingVertical: GRID_SIZE, paddingHorizontal: GRID_SIZE * 2 }}>
                    <Text style={{ ...styles.emptyText, color: colors.common.text3 }}>{strings('nftMainScreen.receiveText', { coin: selectedAddress.currencyCode })}</Text>
                </View>
            </ScreenWrapper>
        )
    }
}

NftReceive.contextType = ThemeContext

const mapStateToProps = (state) => {
    return {
        wallet: getSelectedWalletData(state),
    }
}

export default connect(mapStateToProps)(NftReceive)

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
