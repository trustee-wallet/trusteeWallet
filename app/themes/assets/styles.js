/**
 * @version 0.9
 */
import { Dimensions, Platform, TouchableOpacity, View } from 'react-native'

const { width: SCREEN_WIDTH, height: WINDOW_HEIGHT } = Dimensions.get('window')


export default {
    initScreenStyles: {
        wrapper: {
            flex: 1,
            justifyContent: 'center',
            paddingLeft: 30,
            paddingRight: 30
        },
        title: {
            textAlign: 'center',
            marginBottom: 10,
            fontSize: 34,
            fontFamily: 'SFUIDisplay-Semibold',
            color: '#404040'
        },
        image: {
            alignSelf: 'center',
            width: 148,
            height: 180,
            marginBottom: 147
        },
        image__url: {
            path: require('../../assets/images/logo.png')
        },
        button: {
            marginBottom: 20
        },
        appName__text: {
            position: 'relative',
            fontSize: 30,
            fontFamily: 'SFUIDisplay-Bold',
            color: '#F24B93',
            textAlign: 'center',
            zIndex: 2
        }
    },
    homeScreenStyles: {
        mainBg: {
            flex: 1
        },
        containerRow: {
            flexDirection: 'row',
            alignItems: 'center'
        },
        container: {
            flex: 1
        },
        topBlock: {
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            paddingTop: 40,
            marginBottom: 20,
            marginLeft: 60,
            marginRight: 25
        },
        topBlock__header: {
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center'
        },
        topBlock__title: {
            color: '#404040',
            fontFamily: 'SFUIDisplay-Regular',
            fontSize: 24
        },
        topBlock__text: {
            color: '#999999',
            fontSize: 12,
            fontFamily: 'SFUIDisplay-Regular'
        },
        topBlock__btn: {
            alignItems: 'flex-start',
            justifyContent: 'center',
            flexDirection: 'row',

            padding: 15
        },
        topBlock__btn__text: {
            marginBottom: 50,
            color: '#864dd9',
            fontSize: 12,
            fontFamily: 'SFUIDisplay-Bold'
        },
        topBlock__btn_icon: {
            marginLeft: 5,
            marginTop: Platform.OS === 'ios' ? 0 : 1,

            fontSize: 14,
            color: '#864dd9'
        },
        title: {
            fontSize: 19
        },
        activeTitle: {
            color: 'red'
        },
        cryptoList: {
            flex: 1,
            marginTop: 12
        },
        cryptoList__item: {
            flexDirection: 'row',
            alignItems: 'center',
            height: 74,
            marginBottom: 10,
            marginTop: 5,
            marginLeft: 20,
            marginRight: 20,
            paddingLeft: 10,
            borderRadius: 15,
            shadowColor: '#000',
            shadowOffset: {
                width: 0,
                height: 1
            },
            shadowOpacity: 0.22,
            shadowRadius: 2.22,

            elevation: 3
        },
        cryptoList__item__hidden: {
            flexDirection: 'row',
            alignItems: 'center',
            height: 74,
            marginBottom: 10,
            marginTop: 5,
            marginLeft: 20,
            marginRight: 20,
            paddingLeft: 10,
            borderRadius: 15,
        },
        cryptoList__title: {
            color: '#404040',
            fontFamily: 'SFUIDisplay-Semibold',
            fontSize: 14
        },
        cryptoList__text: {
            color: '#999999',
            fontSize: 12,
            fontFamily: 'SFUIDisplay-Regular'
        },
        cryptoList__info: {
            width: 130
        },
        cryptoList__icoWrap: {
            marginRight: 10,
            alignItems: 'center',
            justifyContent: 'center',
            width: 40,
            height: 40,
            borderRadius: 10
        },
        iconArrow: {
            marginBottom: 1,
            marginLeft: 4
        },
        imgBackground: {
            width: SCREEN_WIDTH + 1,
            height: '100%'
        },
        notch: {
            position: 'absolute',
            width: '100%',
            // height: hasNotch ? 40 : 26,
            height: 40,
            zIndex: 100
        }
    },
    accountScreenStyles: {
        wrapper: {
            flex: 1
        },
        wrapper__scrollView: {
            flex: 1,

            marginTop: 60
        },
        wrapper__content: {
            flex: 1,

            paddingTop: 20
        },
        containerBG: {
            array: ['#fff', '#f6f6f6'],
            start: { x: 1, y: 0 },
            end: { x: 1, y: 1 }
        },
        topContent: {
            position: 'relative',

            height: 244,

            marginTop: 25,
            marginLeft: 16,
            marginRight: 16,
            borderRadius: 16
        },
        topContent__top: {
            position: 'relative',
            alignItems: 'center',

            marginTop: 16
        },
        topBlock__top_bg: {
            position: 'absolute',
            top: 0,
            right: 0,
            width: '100%',
            height: 140
        },
        topContent__title: {
            flexDirection: 'row',
            alignItems: 'flex-end',
            justifyContent: 'center',
            marginBottom: 20,
            marginTop: 16
        },
        topContent__subtitle: {
            marginTop: -10,
            fontFamily: 'SFUIDisplay-Bold',
            fontSize: 12,
            color: '#939393',
            textAlign: 'center'
        },
        topContent__title_first: {
            height: 42,
            fontSize: 52,
            fontFamily: 'Montserrat-Light',
            color: '#404040',
            lineHeight: 50
        },
        topContent__title_last: {
            fontSize: 20,
            fontFamily: 'Montserrat-Medium',
            color: '#404040',

            opacity: .8
        },
        topContent__bottom: {
            flexDirection: 'row',
            justifyContent: 'center',
            marginTop: Platform.OS === 'ios' ? -20 : -30,
            overflow: 'visible'
        },
        topContent__middle: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingTop: 20,
            paddingBottom: 50
        },
        topContent__address: {
            marginBottom: 3,
            fontFamily: 'SFUIDisplay-Bold',
            fontSize: 12,
            color: '#939393'
        },
        segwitBtn: {
            flexDirection: 'row',
            alignItems: 'center',
            height: 74,
            paddingLeft: 50,
            paddingRight: 50,
            marginTop: -35
        },
        copyBtn: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 3,
            marginLeft: 10
        },
        copyBtn__text: {
            marginTop: 6,
            marginRight: 7,
            fontFamily: 'Montserrat-Bold',
            fontSize: 10,
            color: '#864dd9'
        },
        copyBtn__icon: {
            marginTop: 7
        },
        shadow: {
            marginTop: 10,
            marginHorizontal: 5,

            height: '100%',
            backgroundColor: '#fff',
            borderRadius: 16,

            shadowColor: '#000',
            shadowOffset: {
                width: 0,
                height: 5
            },
            shadowOpacity: 0.34,
            shadowRadius: 6.27,

            elevation: 10
        },
        transaction_title: {
            marginLeft: 31,
            marginBottom: 10,
            color: '#404040',
            fontSize: 16,
            fontFamily: 'Montserrat-Bold'
        },
        transaction__new: {
            color: '#EA751D'
        },
        transaction__empty_text: {
            marginTop: -5,
            marginLeft: 30,
            color: '#999999',
            fontSize: 12,
            fontFamily: 'SFUIDisplay-Semibold',
            letterSpacing: 1
        },
        transaction__item: {
            position: 'relative',
            paddingTop: 10,
            paddingBottom: 10,
            paddingLeft: 15,
            paddingRight: 15,
            marginLeft: 15,
            marginRight: 15,
            flexDirection: 'row',
            alignItems: 'center'
        },
        transaction__item_active: {
            backgroundColor: '#fff',
            borderRadius: 15,
            shadowColor: '#000',
            shadowOffset: {
                width: 0,
                height: 2
            },
            shadowOpacity: 0.23,
            shadowRadius: 2.62,

            elevation: 4
        },
        transaction__subtext: {
            fontFamily: 'SFUIDisplay-Regular',
            color: '#808080',
            fontSize: 11
        },
        transaction__content: {
            flex: 1,
            justifyContent: 'space-between',
            flexDirection: 'row'
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
        transaction__bg: {
            alignItems: 'flex-end',
            position: 'absolute',
            top: 0,
            left: 15,
            width: SCREEN_WIDTH - 30,
            height: '100%',
            borderRadius: 15,
            zIndex: 1
        },
        transaction__bg_active: {
            backgroundColor: '#e77ca3'
        },
        transaction__action: {
            alignItems: 'center',
            justifyContent: 'center',
            width: 72,
            height: '100%'
        },
        transaction__action__text: {
            fontFamily: 'SFUIDisplay-Regular',
            color: '#ffffff',
            fontSize: 10
        },
        textAlign_right: {
            textAlign: 'right'
        },
        circle: {
            position: 'relative',
            width: 10,
            height: 10,
            marginLeft: 6,
            marginRight: 20,
            borderRadius: 10,
            zIndex: 2
        },
        line: {
            position: 'absolute',
            top: 30,
            left: 105,
            width: 2,
            height: 60,
            zIndex: 2
        },
        topContent__whiteBox: {
            width: 40
        },
        dots: {
            flexDirection: 'row',
            justifyContent: 'center',

            marginBottom: 10
        },
        dots__item: {
            width: 10,
            height: 10,

            marginHorizontal: 4,

            borderRadius: 10,
            backgroundColor: '#f4f4f4'
        },
        dots__item_active: {
            backgroundColor: '#864dd9'
        },
        showMore: {
            flexDirection: 'row',
            justifyContent: 'center',

            padding: 10,
            marginBottom: 40
        },
        showMore__btn: {
            marginRight: 5,

            color: '#864dd9',
            fontSize: 10,
            fontFamily: 'SFUIDisplay-Bold'
        },
        orders: {
            transaction: {
                flex: 1,
                alignItems: 'flex-start',
                paddingHorizontal: 15
            },
            transaction_title: {
                marginLeft: 15,
                marginBottom: 10,
                color: '#404040',
                fontSize: 22,
                fontFamily: 'SFUIDisplay-Regular'
            },
            transaction__empty_text: {
                marginTop: -10,
                marginLeft: 15,
                color: '#404040',
                fontSize: 16,
                fontFamily: 'SFUIDisplay-Regular'
            },
            transaction__item: {
                position: 'relative',
                paddingTop: 10,
                paddingBottom: 10,
                marginLeft: 15,
                marginRight: 15,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center'
            },
            transaction__item__content: {
                flex: 1,
                flexDirection: 'row',
                justifyContent: 'space-between'
            },
            transaction__item_active: {
                backgroundColor: '#fff',
                borderRadius: 15,
                shadowColor: '#000',
                shadowOffset: {
                    width: 0,
                    height: 2
                },
                shadowOpacity: 0.23,
                shadowRadius: 2.62,

                elevation: 4
            },
            transaction__subtext: {
                fontFamily: 'SFUIDisplay-Regular',
                color: '#999999',
                fontSize: 12
            },
            transaction__content: {
                flex: 1,
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                flexDirection: 'row'
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
            transaction__bg: {
                alignItems: 'flex-end',
                position: 'absolute',
                top: 0,
                left: 15,
                width: SCREEN_WIDTH - 30,
                height: '100%',
                borderRadius: 15,
                zIndex: 1
            },
            transaction__bg_active: {
                backgroundColor: '#e77ca3'
            },
            transaction__action: {
                alignItems: 'center',
                justifyContent: 'center',
                width: 72,
                height: '100%'
            },
            transaction__action__text: {
                fontFamily: 'SFUIDisplay-Regular',
                color: '#ffffff',
                fontSize: 10
            },
            circle: {
                position: 'relative',
                width: 10,
                height: 10,
                marginLeft: 6,
                marginRight: 20,
                borderRadius: 10,
                zIndex: 2
            },
            line: {
                position: 'absolute',
                top: 30,
                left: 77,
                width: 2,
                height: 60,
                zIndex: 2
            },
            textAlign_right: {
                textAlign: 'right'
            },
            transaction__subtext_status: {
                textAlign: 'left'
            },
            showMore: {
                flexDirection: 'row',
                justifyContent: 'center',

                padding: 10,
                marginBottom: 20
            },
            showMore__btn: {
                marginRight: 5,

                color: '#864dd9',
                fontSize: 10,
                fontFamily: 'SFUIDisplay-Bold'
            }
        }
    },
    receiveScreenStyles: {
        wrapper: {
            flex: 1
        },
        wrapper__content: {
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1,
            paddingTop: 170
        },
        qr: {
            position: 'relative'
        },
        qr__content: {
            alignItems: 'center',

            position: 'relative',

            borderRadius: 16,

            overflow: 'hidden',

            zIndex: 2
        },
        qr__content__top: {
            flexDirection: 'row',
            justifyContent: 'space-between'

        },
        qr__content__top__item: {
            flex: 1,
            alignItems: 'center',

            padding: 10
        },
        qr__content__top__item__text: {
            fontSize: 14,
            fontFamily: 'Montserrat-Semibold',
            color: '#404040'
        },
        qr__content__top__item__text_active: {
            color: '#864dd9'
        },
        qr__shadow: {
            position: 'absolute',
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,

            zIndex: 1
        },
        qr__shadow__item: {
            flex: 1,
            marginTop: 12,
            marginHorizontal: 5,

            shadowColor: '#000',
            shadowOffset: {
                width: 0,
                height: 3
            },
            shadowOpacity: 0.27,
            shadowRadius: 4.65,

            elevation: 6,

            backgroundColor: '#fff',
            borderRadius: 16
        },
        qr__bg: {
            array: ['#fff', '#f2f2f2'],
            start: { x: 1, y: 0 },
            end: { x: 1, y: 1 }
        },
        title: {
            marginTop: 20,
            color: '#999999',
            fontSize: 22,
            fontFamily: 'SFUIDisplay-Regular'
        },
        text: {
            color: '#404040',
            fontSize: 14,
            fontFamily: 'SFUIDisplay-Semibold'
        },
        line: {
            flexDirection: 'row',

            width: '100%',
            marginTop: 14
        },
        line__item: {
            flex: 1,

            marginHorizontal: -16,
            height: 1,
            backgroundColor: '#EAEAEA'
        },
        buttons: {
            flexDirection: 'row',
            width: '100%',
            minHeight: 50,
            paddingTop: 20,
            paddingBottom: 20,
            paddingHorizontal: 30,

            backgroundColor: '#fff',

            shadowColor: '#000',
            shadowOffset: {
                width: 0,
                height: 7
            },
            shadowOpacity: 0.43,
            shadowRadius: 9.51,

            elevation: 10
        },
        btn: {
            flex: 1,
            marginBottom: 20
        },
        shareBtn: {

            margin: 20,
            padding: 5,
            paddingHorizontal: 20,

            backgroundColor: '#fff',

            shadowColor: '#000',
            shadowOffset: {
                width: 0,
                height: 2
            },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,

            elevation: 5,

            borderRadius: 10
        },
        shareBtn__text: {
            fontFamily: 'SFUIDisplay-Regular',
            fontSize: 16,
            color: '#404040'
        },
        options: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',

            width: 290,
            marginTop: 32,
            marginBottom: 30
        },
        options__item: {
            alignItems: 'center',

            width: 74
        },
        options__wrap: {
            position: 'relative',

            width: 54,
            height: 54
        },
        options__content: {
            position: 'relative',

            alignItems: 'center',
            justifyContent: 'center',

            height: '100%',

            borderRadius: 50,

            zIndex: 2
        },
        options__text: {
            marginTop: 4,

            fontFamily: 'SFUIDisplay-Semibold',
            color: '#999999',
            fontSize: 12
        },
        options__shadow: {
            position: 'absolute',
            top: 0,
            left: 0,

            width: '100%',

            borderRadius: 50,

            zIndex: 1
        },
        options__shadow__item: {

            height: 49,
            marginTop: 4,

            shadowColor: '#000',
            shadowOffset: {
                width: 0,
                height: 2
            },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,

            elevation: 5,

            backgroundColor: '#fff',
            borderRadius: 50
        },
        accountDetail: {
            marginLeft: 31
        },
        accountDetail__content: {
            flexDirection: 'row',

            marginLeft: 16
        },
        accountDetail__title: {
            fontFamily: 'Montserrat-Bold',
            fontSize: 18,
            color: '#404040'
        },
        accountDetail__text: {
            fontSize: 12,
            fontFamily: 'SFUIDisplay-Semibold',
            color: '#939393'
        },
        topContent__tag: {
            position: 'absolute',
            top: 0,
            right: 0,

            paddingLeft: 30,
            paddingBottom: 30,
            zIndex: 1
        },
        topContent__content__tag: {
            alignItems: 'center',

            width: 70,
            paddingVertical: 5,

            backgroundColor: '#8D51E4',
            borderTopRightRadius: 16,
            borderBottomLeftRadius: 16,

            shadowColor: '#000',
            shadowOffset: {
                width: 0,
                height: 2
            },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,

            elevation: 5
        },
        topContent__tag__text: {
            fontFamily: 'Montserrat-Semibold',
            fontSize: 12,
            color: '#f4f4f4'
        }
    },
    sendScreenStyles: {
        wrapper: {
            flex: 1
        },
        wrapper__scrollView: {
            marginTop: 140
        },
        wrapper__content: {
            flex: 1,
            minHeight: WINDOW_HEIGHT - 140,
            justifyContent: 'space-between',
            paddingTop: 15,
            paddingLeft: 30,
            paddingRight: 30,
            paddingBottom: 30
        },
        wrapper__content_active: {
            flex: 1,
            minHeight: 400,
            justifyContent: 'space-between',
            paddingTop: 15,
            paddingLeft: 30,
            paddingRight: 30,
            paddingBottom: 30
        },
        text: {
            fontSize: 16,
            color: '#999999',
            textAlign: 'justify'
        },
        slideBtn: {
            array: ['#43156d', '#7127ac'],
            start: { x: 0, y: 1 },
            end: { x: 1, y: 0 }
        },
        slideBtn__content: {
            width: '100%'
        },
        fee: {
            position: 'relative',
            height: 250,
            marginTop: 15,
            overflow: 'visible',
            zIndex: 10
        },
        fee__content_active: {
            position: 'absolute',
            right: 0,
            top: 20,
            width: 150,
            paddingBottom: 20,
            borderBottomRightRadius: 20,
            borderBottomLeftRadius: 20,
            borderTopLeftRadius: 20,
            shadowColor: '#000',
            shadowOffset: {
                width: 0,
                height: 1
            },
            shadowOpacity: 0.22,
            shadowRadius: 2.22,

            elevation: 3,
            backgroundColor: '#fff',
            zIndex: 20
        },
        fee__content: {
            width: 0,
            height: 0
        },
        fee__subtitle: {
            marginRight: 5,
            textAlign: 'right',
            fontSize: 16,
            fontFamily: 'SFUIDisplay-Regular',
            color: '#404040'
        },
        fee__text: {
            marginRight: 5,
            textAlign: 'right',
            fontSize: 12,
            fontFamily: 'SFUIDisplay-Regular',
            color: '#999999'
        },
        fee__title: {
            fontSize: 16,
            fontFamily: 'SFUIDisplay-Regular',
            color: '#999999'
        },
        fee__btn: {
            width: 60,
            height: 20,
            alignItems: 'center',
            justifyContent: 'center',
            borderTopLeftRadius: 10,
            borderTopRightRadius: 10
        },
        fee__btn_active: {
            width: 60,
            height: 20,
            alignItems: 'center',
            justifyContent: 'center',
            borderTopLeftRadius: 10,
            borderTopRightRadius: 10,
            shadowColor: '#000',
            shadowOffset: {
                width: 0,
                height: 1
            },
            shadowOpacity: 0.22,
            shadowRadius: 2.22,

            elevation: 3
        },
        fee__btn_title: {
            fontSize: 10,
            fontFamily: 'SFUIDisplay-Bold',
            color: '#864dd9'
        },
        fee__item: {
            paddingTop: 10,
            paddingLeft: 10,
            paddingRight: 10
        },
        feeText: {
            marginTop: -4,
            fontSize: 19,
            color: '#404040',
            fontFamily: 'SFUIDisplay-Regular'
        },
        inputWrap: {
            flexDirection: 'row'
        },
        fee__line: {
            marginTop: 10,
            width: '100%',
            height: 1,
            backgroundColor: '#e3e6e9'
        },
        texts: {
            flexDirection: 'row',
            alignItems: 'center',
            marginRight: 30
        },
        texts__item: {
            fontSize: 12,
            fontFamily: 'SFUIDisplay-Regular',
            color: '#e77ca3'
        },
        texts__icon: {
            marginRight: 10,
            transform: [{ rotate: '180deg' }]
        },
        accountDetail: {
            marginLeft: 31
        },
        accountDetail__content: {
            flexDirection: 'row',

            marginLeft: 16
        },
        accountDetail__title: {
            fontFamily: 'Montserrat-Bold',
            fontSize: 18,
            color: '#404040'
        },
        accountDetail__text: {
            fontSize: 12,
            fontFamily: 'SFUIDisplay-Semibold',
            color: '#939393'
        },
        confirmModalStyles: {
            wrapper__content: {
                width: SCREEN_WIDTH,
                minHeight: WINDOW_HEIGHT - 100,
                backgroundColor: '#7127ab'
            },
            content: {
                flex: 1
            },
            top: {
                flexDirection: 'row',
                justifyContent: 'center',
                marginTop: Platform.OS === 'ios' ? 12 : 40
            },
            title: {
                marginBottom: 5,
                width: SCREEN_WIDTH < 410 ? 180 : '100%',
                fontFamily: 'SFUIDisplay-Semibold',
                fontSize: 18,
                textAlign: 'center',
                color: '#f4f4f4'
            },
            bg: {
                flex: 1,
                position: 'relative',
                alignItems: 'center',
                zIndex: 100
            },
            cross: {
                position: 'absolute',
                top: Platform.OS === 'ios' ? -12 : 15,
                right: -10,
                padding: 20
            },
            icon: {
                width: 230,
                height: 220,
                marginTop: 10,
                marginBottom: 10
            },
            text: {
                paddingLeft: 15,
                paddingRight: 15,
                marginBottom: 10,
                fontFamily: 'SFUIDisplay-Regular',
                fontSize: 14,
                color: '#f4f4f4'
            },
            bottom: {
                position: 'absolute',
                bottom: 0,

                flexDirection: 'row',
                justifyContent: 'space-between',

                width: '100%',
                marginTop: 'auto',
                backgroundColor: '#fff'
            },
            btn: {
                width: 157
            },
            btn__touchableOpacity: {
                paddingVertical: 22,
                paddingHorizontal: 15
            },
            box: {
                alignItems: 'center'
            },
            box__line: {
                width: 200,
                height: 1,
                marginBottom: 15,
                backgroundColor: '#f4f4f4'
            },
            content__title: {
                marginTop: 20,
                fontFamily: 'SFUIDisplay-Regular',
                fontSize: 19,
                textAlign: 'center',
                color: '#f4f4f4'
            },
            content__text: {
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center'
            },
            content__text_first: {
                marginBottom: 6,
                fontFamily: 'SFUIDisplay-Regular',
                fontSize: 36,
                color: '#f4f4f4'
            },
            content__text_last: {
                fontFamily: 'SFUIDisplay-Regular',
                fontSize: 24,
                color: '#f4f4f4'
            },
            content__subtext: {
                marginTop: -5,
                marginBottom: 15,
                fontFamily: 'SFUIDisplay-Regular',
                fontSize: 16,
                color: '#f4f4f4'
            },
            description: {
                flexDirection: 'row',
                justifyContent: 'space-between',
                width: '100%',
                paddingLeft: 15,
                paddingRight: 15,

                alignItems: 'center'
            },
            description__text: {
                fontFamily: 'SFUIDisplay-Regular',
                fontSize: 14,
                color: '#e3e3e3'
            },
            description__line: {
                height: 22,
                width: 1,
                backgroundColor: '#864dd9'
            }
        },
        feeStyles: {
            wrapper: {
                width: '100%',
                paddingBottom: 86,
                alignItems: 'flex-start'
            },
            fee__top: {
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'flex-start',
                marginBottom: 5,
                marginTop: 10
            },
            fee__item__top: {
                flexDirection: 'row'
            },
            fee__title: {
                fontSize: 14,
                fontFamily: 'SFUIDisplay-Regular',
                color: '#e3e3e3',
                textAlign: 'left'
            },
            fee__btn_title: {
                fontSize: 10,
                fontFamily: 'SFUIDisplay-Bold',
                color: '#864dd9'
            },
            fee__content__wrap: {
                minHeight: 200,
                maxWidth: '100%',
                justifyContent: 'flex-start',
                flexDirection: 'row',
                overflow: 'hidden'
            },
            fee__content__wrap_hidden: {
                minHeight: 0,
                maxHeight: 0,
                height: 0,
                overflow: 'hidden'
            },
            fee__content: {
                alignContent: 'flex-start',
                paddingLeft: 15,
                paddingRight: 15,
                minWidth: SCREEN_WIDTH,
                marginBottom: 5,
                marginLeft: 0
            },
            fee__wrap: {
                width: '100%',
                marginLeft: -15
            },
            fee__item: {
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 1,
                borderRadius: 9
            },
            fee__item__title: {
                fontSize: 18,
                fontFamily: 'SFUIDisplay-Regular',
                color: '#f4f4f4'
            },
            fee__item__top__text: {
                width: SCREEN_WIDTH - 50,

                bottom: 2,
                fontSize: 12,
                fontFamily: 'SFUIDisplay-Regular',
                color: '#f4f4f4'
            },
            fee__active: {
                color: '#f4f4f4'
            },
            fee__item__number: {
                marginTop: 0,
                fontSize: 11,
                fontFamily: 'SFUIDisplay-Regular',
                color: '#e3e3e3'
            },
            fee__item__text: {
                marginTop: -3,
                fontSize: 11,
                fontFamily: 'SFUIDisplay-Regular',
                color: '#e3e3e3'
            },
            fee__divider: {
                marginTop: 6,
                marginBottom: 6,
                width: 1,
                backgroundColor: '#e3e6e9'
            },
            fee__circle: {
                width: 16,
                height: 16,
                marginLeft: 15,
                marginRight: 15,
                borderRadius: 8
            },
            fd_row: {
                flexDirection: 'row'
            }
        }
    }
}
