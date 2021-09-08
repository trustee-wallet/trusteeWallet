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
import Log from '@app/services/Log/Log'
import { setLoaderStatus } from '@app/appstores/Stores/Main/MainStoreActions'
import config from '@app/config/config'
import CustomIcon from '@app/components/elements/CustomIcon'
import { Web3Injected } from '@crypto/services/Web3Injected'

const { width: WINDOW_WIDTH } = Dimensions.get('window')

const abi = require('@crypto/blockchains/eth/ext/erc721.js')

class NftDetailedInfoQRCheck extends React.PureComponent {

    state = {
        data: {
            "contractAddress": "0x41442Ee4E2b3cE380911fF08Bb0f50a4037C2835",
            "signAddress": "0xf1Cff704c6E6ce459e3E1544a9533cCcBDAD7B99",
            "signed": {
                "message": "1631102332516nft",
                "messageHash": "0xc86fc6319c38bb6c794e198ea5ebd3435148c06a0205fee34d56258e1f827f7e",
                "signature": "0xfb5bda323c118b87ce569ad7df1e3d8f0fb5af426ddd34ddc471e9cac140f80271b6e161bf0eb3c3a7fa2b27a90824a120500e09bf7116b55feed84a7cdc6f4b1c"
            },
            "tokenBlockchainCode": "MATIC",
            "tokenId": 1
        },
        explorerLink : false,
        checked: false,
        checkedStatus : ''
    }

    async componentDidMount() {
        const tmpData = NavStore.getParamWrapper(this, 'jsonData')
        try {
            const data = JSON.parse(tmpData)
            let explorerLink = data.tokenBlockchainCode === 'MATIC' ? 'https://polygonscan.com/token/' : 'https://etherscan.com/token/'
            explorerLink += data.contractAddress + '?a=' + data.tokenId
            this.setState({
                data, explorerLink
            })
            this.checkMessage(data)
        } catch (e) {
            if (config.debug.appErrors) {
                console.log('NftDetailedInfoQRCheck mount error ' + e.message)
            }
            Log.log('NftDetailedInfoQRCheck mount error ' + e.message)
        }
    }

    async checkMessage(data) {
        try {
            setLoaderStatus(true)

            let checkedStatus = false
            const web3 = Web3Injected(data.tokenBlockchainCode)

            const diff = new Date().getTime() - data.signed.message.replace('nft', '') * 1
            if (diff > 6000000) {
            //    checkedStatus = 'timeouted' // uncomment after tests
            }
            if (!checkedStatus) {
                const signedDataHash = await web3.eth.accounts.hashMessage(data.signed.message)
                if (signedDataHash !== data.signed.messageHash) {
                    checkedStatus = 'hash not matching'
                }
            }


            const token = new web3.eth.Contract(abi.ERC721, data.contractAddress)
            const owner = await token.methods.ownerOf(data.tokenId).call()
            if (owner.toLowerCase() !== data.signAddress.toLowerCase()) {
                checkedStatus = 'owned by other address ' + owner
            }

            if (!checkedStatus) {
                checkedStatus = 'success'
            }

            this.setState({ checked : true, checkedStatus })
        } catch (e) {
            if (config.debug.appErrors) {
                console.log('NftDetailedInfoQRCheck checkMessage error ' + e.message)
            }
            Log.log('NftDetailedInfoQRCheck checkMessage error ' + e.message)
            this.setState({ checked : true, checkedStatus : e.message})
        }
        setLoaderStatus(false)
    }


    handleBack = () => {
        NavStore.goBack()
    }

    render() {
        const {
            GRID_SIZE,
            colors
        } = this.context

        if (!this.state.checked) {
            // @todo show "checking"
        }
        const message = !this.state.checked ? 'checking' : this.state.checkedStatus

        return (
            <ScreenWrapper
                title={strings('nftMainScreen.titleQR')}
                leftType='back'
                leftAction={this.handleBack}
            >
                <View style={[styles.tokenContainer, { marginLeft: GRID_SIZE, marginTop: GRID_SIZE * 1.5 }]}>
                    <TouchableOpacity
                        style={[styles.tokenWrapper, {
                            backgroundColor: colors.cashback.detailsBg,
                            marginRight: GRID_SIZE
                        }]}
                        onPress={() => this.copyToLink(this.state.data.contractAddress)}
                    >
                        <Text style={[styles.tokenText, {
                            color: colors.common.text1,
                            marginHorizontal: GRID_SIZE
                        }]}>
                            Contract: {this.state.data.contractAddress}
                        </Text>

                        <Text style={[styles.tokenText, {
                            color: colors.common.text1,
                            marginHorizontal: GRID_SIZE
                        }]}>
                            Token : {this.state.data.tokenId}
                        </Text>

                        <Text style={[styles.tokenText, {
                            color: colors.common.text1,
                            marginHorizontal: GRID_SIZE
                        }]}>
                            Blockchain : {this.state.data.tokenBlockchainCode}
                        </Text>


                        <Text style={[styles.tokenText, {
                            color: colors.common.text1,
                            marginHorizontal: GRID_SIZE
                        }]}>
                            Address : {this.state.data.signAddress}
                        </Text>



                        <Text style={[styles.tokenText, {
                            color: colors.common.text1,
                            marginHorizontal: GRID_SIZE
                        }]}>
                            Status : {message}
                        </Text>

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

NftDetailedInfoQRCheck.contextType = ThemeContext

export default NftDetailedInfoQRCheck

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
