/**
 * @version 0.50
 * @author yura
 */

import React from 'react'
import {
    View,
    StyleSheet,
    Text,
    ScrollView,
    ActivityIndicator
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

import TransactionItem from '../Account/AccountTransaction/elements/TransactionItem'
import BlocksoftPrettyStrings from '@crypto/common/BlocksoftPrettyStrings'
import copyToClipboard from '@app/services/UI/CopyToClipboard/CopyToClipboard'
import Toast from '@app/services/UI/Toast/Toast'


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
        explorerLink: false,
        checked: false,
        checkedInfoShow : false,
        checkedStatus: ''
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
            let checkedInfoShow = false
            const web3 = Web3Injected(data.tokenBlockchainCode)

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

            const diff = new Date().getTime() - data.signed.message.replace('nft', '') * 1
            if (diff > 360000) {
                checkedStatus = 'owned by this address, but timeouted'
                checkedInfoShow = true
            }

            if (!checkedStatus) {
                checkedStatus = 'success'
                checkedInfoShow = true
            }

            this.setState({ checked: true, checkedStatus, checkedInfoShow })
        } catch (e) {
            if (config.debug.appErrors) {
                console.log('NftDetailedInfoQRCheck checkMessage error ' + e.message)
            }
            Log.log('NftDetailedInfoQRCheck checkMessage error ' + e.message)
            this.setState({ checked: true, checkedStatus: e.message, checkedInfoShow : true })
        }
        setLoaderStatus(false)
    }

    getStatusIcon = (msg) => {

        const { colors } = this.context

        switch (msg.toLowerCase()) {
            case 'success':
                return <CustomIcon name='check' size={48} color={colors.common.button.bg} />
            case 'checking':
                return <ActivityIndicator color={colors.common.button.bg} />
            default:
                return <CustomIcon name='close' size={36} color={colors.common.button.bg} />
        }
    }

    getStatusText = (msg) => {

        switch (msg.toLowerCase()) {
            case 'success':
                return strings('nftMainScreen.ownershipProved')
            case 'checking':
                return strings('nftMainScreen.checking')
            default:
                return strings('nftMainScreen.ownershipNotProved')
        }
    }

    handleSubContentPress = (item) => {
        if (typeof item.plain !== 'undefined') {
            copyToClipboard(item.plain)
        } else if (item.isLink) {
            copyToClipboard(item.isLink)
        } else {
            copyToClipboard(item.title + ': ' + item.description)
        }
        Toast.setMessage(strings('toast.copied')).show()
    }


    handleBack = () => {
        NavStore.goBack()
    }

    render() {
        const {
            GRID_SIZE,
            colors
        } = this.context

        const message = !this.state.checked ? 'checking' : this.state.checkedStatus

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
                    <View style={styles.containerStatus}>
                        <View style={[styles.statusIcon, { backgroundColor: colors.common.roundButtonContent }]}>
                            {this.getStatusIcon(message)}
                        </View>
                        <Text style={[styles.textStatus, { color: colors.common.text1 }]}>{this.getStatusText(message)}</Text>
                    </View>
                    {this.state.checkedInfoShow &&
                        <>
                            <TransactionItem
                                title={strings('nftMainScreen.contract')}
                                subtitle={BlocksoftPrettyStrings.makeCut(this.state.data.contractAddress, 8, 8)}
                                iconType='contract'
                                isLink
                                copyAction={() => this.handleSubContentPress({ plain: this.state.explorerLink })}
                            />
                            <TransactionItem
                                title={strings('nftMainScreen.tokenId')}
                                subtitle={this.state.data.tokenId}
                                iconType='tokenId'
                            />
                            <TransactionItem
                                title={strings('nftMainScreen.blockchain')}
                                subtitle={this.state.data.tokenBlockchainCode}
                                iconType='block'
                            />
                            <TransactionItem
                                title={strings('nftMainScreen.address')}
                                subtitle={BlocksoftPrettyStrings.makeCut(this.state.data.signAddress, 8, 8)}
                                iconType='self'
                                copyAction={() => this.handleSubContentPress({ plain: this.state.data.signAddress })}
                            />
                        </>
                    }

                </ScrollView>
            </ScreenWrapper>
        )
    }
}

NftDetailedInfoQRCheck.contextType = ThemeContext

export default NftDetailedInfoQRCheck

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
    }
})
