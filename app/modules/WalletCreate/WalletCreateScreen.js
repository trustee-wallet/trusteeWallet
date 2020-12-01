/**
 * @version 0.9
 */
import React, { Component } from 'react'
import {
    View,
    Image,
    Animated,
    Text,
    Platform,
    TouchableOpacity,
    Dimensions,
    StatusBar,
} from 'react-native'
import { connect } from 'react-redux'
import { Pages } from 'react-native-pages'

import firebase from 'react-native-firebase'
import LottieView from 'lottie-react-native'

import Agreement from './elements/Agreement'
import Button from '../../components/elements/new/buttons/Button'

import NavStore from '../../components/navigation/NavStore'

import {
    setCallback,
    setFlowType,
    setMnemonicLength,
    setWalletName
} from '../../appstores/Stores/CreateWallet/CreateWalletActions'

import Log from '../../services/Log/Log'
import { strings } from '../../services/i18n'

import { ThemeContext } from '../../modules/theme/ThemeProvider'

import SliderImage1 from '../../assets/images/createWallet_slider1.png';


const screenWidth = Dimensions.get('window').width;

const getSliderData = () => [
    {
        image: SliderImage1,
        text: strings('walletCreateScreen.slider1')
    },
    {
        image: null,
        text: strings('walletCreateScreen.slider2')
    },
    {
        image: null,
        text: strings('walletCreateScreen.slider3')
    },
    {
        image: null,
        text: strings('walletCreateScreen.slider4'),
        textStyle: { textDecorationLine: 'line-through' }
    },
];

const SLIDER_SCROLL_TIMEOUT = 4000

class WalletCreateScreen extends Component {
    state = {
        checked: false
    }

    sliderData = getSliderData()
    sliderTimer;
    sliderRef = React.createRef

    componentDidMount() {
        Log.log('WalletCreateScreen is mounted')

        this.runSliderTimer()
    }

    runSliderTimer = () => {
        this.sliderTimer = setInterval(() => {
            const index = this.sliderRef.activeIndex < this.sliderData.length - 1 ? this.sliderRef.activeIndex + 1 : 0
            this.sliderRef.scrollToPage?.(index)
        }, SLIDER_SCROLL_TIMEOUT)
    }

    handleSelect = (data) => {
        setFlowType(data)
        setCallback({
            callback: async () => {
                NavStore.reset('InitScreen')
            }
        })

        setWalletName({ walletName: '' })
        setMnemonicLength({ mnemonicLength: 128 })

        if (data.flowType === 'CREATE_NEW_WALLET') {
            NavStore.goNext('BackupStep0Screen')
        } else {
            NavStore.goNext('EnterMnemonicPhrase')
        }
        setTimeout(() => { this.setState(() => ({ checked: false })) }, 500)
    }

    handleCreate = () => { this.handleSelect({ flowType: 'CREATE_NEW_WALLET' }) }

    handleImport = () => { this.handleSelect({ flowType: 'IMPORT_WALLET' }) }

    changeAgreementCallback = () => {
        this.setState(state => ({ checked: !state.checked }))
    }

    handleTermsPress = () => {
        NavStore.goNext('AgreementScreen', { type: 'terms' })
    }

    handlePrivacyPolicyPress = () => {
        NavStore.goNext('AgreementScreen', { type: 'privacyPolicy' })
    }

    renderSliderPage = ({ image, text, textStyle }) => {
        const { colors, GRID_SIZE } = this.context
        return (
            <View style={styles.sliderItem}>
                <Image
                    source={image}
                    style={[
                        styles.sliderImage,
                        {
                            width: GRID_SIZE === 16 ? styles.sliderImage.width : styles.sliderImage.width - 50,
                            height: GRID_SIZE === 16 ? styles.sliderImage.height : styles.sliderImage.height - 50,
                        }
                    ]}
                    resizeMode="contain"
                />
                <Text
                    style={[
                        styles.sliderText,
                        textStyle,
                        { color: colors.createWalletScreen.sliderText, marginHorizontal: GRID_SIZE * 3 }
                    ]}
                >{text}</Text>
            </View>
        )
    }

    render() {
        const { logoShow } = this.state
        const { colors, GRID_SIZE } = this.context

        firebase.analytics().setCurrentScreen('WalletCreate.WalletCreateScreen')

        return (
            <View style={styles.container}>
                <StatusBar barStyle="light-content" />
                <View style={[styles.topContent, { backgroundColor: colors.createWalletScreen.sliderBg }]}>
                    <Pages ref={ref => { this.sliderRef = ref }}>
                        {this.sliderData.map(this.renderSliderPage)}
                    </Pages>
                </View>
                <View style={[styles.bottomContent, { paddingHorizontal: GRID_SIZE }]}>
                    <View style={[styles.agreementContainer, { marginHorizontal: GRID_SIZE }]}>
                        <Agreement
                            checked={this.state.checked}
                            onPress={this.changeAgreementCallback}
                            handleTerms={this.handleTermsPress}
                            handlePrivacyPolicy={this.handlePrivacyPolicyPress}
                        />
                    </View>
                    <Button
                        title={strings('walletCreateScreen.createWallet')}
                        disabled={!this.state.checked}
                        onPress={this.handleCreate}
                    />
                    <Button
                        type="transparent"
                        title={strings('walletCreateScreen.importWallet')}
                        disabled={!this.state.checked}
                        onPress={this.handleImport}
                        containerStyle={styles.importButton}
                    />
                </View>
            </View>
        )
    }
}

WalletCreateScreen.contextType = ThemeContext

const mapStateToProps = (state) => {
    return {}
}

export default connect(mapStateToProps, {})(WalletCreateScreen)

const styles = {
    container: {
        flex: 1
    },
    topContent: {
        flex: 3,
        paddingVertical: 20
    },
    bottomContent: {
        flex: 2,
        justifyContent: 'center',
        paddingBottom: 16
    },
    sliderItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'flex-end',
        paddingBottom: 35,
    },
    sliderImage: {
        width: screenWidth - 100,
        height: screenWidth - 100,
        maxWidth: 450,
        maxHeight: 450,
    },
    sliderText: {
        fontFamily: 'SFUIDisplay-Regular',
        fontSize: 16,
        lineHeight: 20,
        letterSpacing: 0.5,
        textAlign: 'center',
        marginTop: 15,
    },
    agreementContainer: {
        marginBottom: 20
    },
    importButton: {
        marginTop: 8
    }
};
