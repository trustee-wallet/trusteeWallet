import { Dimensions } from 'react-native'

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window")


export default {
    initScreenStyles: {
        image__url: {
            path: require('../../assets/images/logo.png')
        },
        appName__text: {
            color: '#F24B93',
        }
    },
    homeScreenStyles: {
        topBlock__btn__text: {
            color: '#864dd9',
        },
    },
    accountScreenStyles: {
        copyBtn__text: {
            color: '#864dd9'
        },
        transaction__expand: {
            fontFamily: 'SFUIDisplay-Semibold',
            color: '#e77ca3',
            fontSize: 16
        },
        transaction__income: {
            fontFamily: 'SFUIDisplay-Semibold',
            color: '#864dd9',
            fontSize: 16
        },
        transaction__bg_active: {
            backgroundColor: '#e77ca3'
        },
        dots__item_active: {
            backgroundColor: '#864dd9'
        },
        showMore__btn: {
            color: '#864dd9',
        },
        orders: {
            transaction__expand: {
                color: '#e77ca3',
            },
            transaction__income: {
                color: '#864dd9',
            },
            transaction__bg_active: {
                backgroundColor: '#e77ca3'
            },
            showMore__btn: {
                color: '#864dd9',
            }
        }
    },
    receiveScreenStyles: {

    },
    sendScreen: {
        slideBtn: {
            array: ['#43156d', '#7127ac'],
            start: { x: 0, y: 1 },
            end: { x: 1, y: 0 }
        },
        fee__btn_title: {
            color: '#864dd9'
        },
        texts__item: {
            color: '#e77ca3'
        },
        confirmModalStyles: {
            box__line: {
                backgroundColor: '#6B3CA7'
            },
            description__line: {
                backgroundColor: '#864dd9'
            }
        },
        feeStyles: {
            fee__btn_title: {
                color: '#864dd9'
            },
        }
    }
}