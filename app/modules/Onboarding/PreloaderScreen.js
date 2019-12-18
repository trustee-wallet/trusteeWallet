import React, { Component } from "react"
import { View, Text, Animated, Image } from 'react-native'

import LottieView from "lottie-react-native"

import NavStore from "../../components/navigation/NavStore"
import Button from "../../components/elements/Button"


class PreloaderScreen extends Component {

    constructor(props) {
        super(props);
        this.state = {
            logoAnim: new Animated.Value(0),
            logoShow: new Animated.Value(0),
        }
    }

    componentDidMount() {
        Animated.timing(this.state.logoAnim, {
            toValue: 1,
            duration: 5000
        }).start()

        setTimeout(() => {
            Animated.timing(this.state.logoShow, {
                toValue: 1,
                duration: 200
            }).start()
        }, 4500)
    }

    render(){

        const { logoShow } = this.state

        return(
            <View style={styles.wrapper}>
                <View style={styles.content}>
                    <View style={styles.content__center}>
                        <View style={styles.content__img}>
                            <LottieView style={{
                                width: 230,
                                height: 230,
                            }} source={require("../../assets/jsons/animations/loader.json")} progress={this.state.logoAnim}/>
                            <Animated.View style={{...styles.logo, opacity: logoShow }}>
                                <Image
                                    style={styles.logo__img}
                                    source={require('../../assets/images/logo.png')}
                                />
                            </Animated.View>
                        </View>
                        <Text style={{ textAlign: "center" }}>
                            Кошелек Trustee - меняй быстро, храни безопасно.
                        </Text>
                        <Text style={{ textAlign: "center" }}>
                            Анонимная покупк, продажа и обмен.
                        </Text>
                    </View>
                </View>
                <View style={styles.btn}>
                    <Button onPress={() => NavStore.goNext('WalletCreateScreen')}>
                        Let`s start!
                    </Button>
                </View>
            </View>
        )
    }
}

const styles = {
    wrapper: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',

        paddingHorizontal: 30,

        backgroundColor: '#fff'
    },
    content: {
        flex: 1,
    },
    content__center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    content__img: {
        position: 'relative',
    },
    logo: {
        position: 'absolute',
        left: 44,
        top: 30,
        width: 140,
        height: 170,
    },
    logo__img: {
        width: '100%',
        height: '100%'
    },
    btn: {
        width: '100%',
        marginBottom: 20
    }
}

export default PreloaderScreen