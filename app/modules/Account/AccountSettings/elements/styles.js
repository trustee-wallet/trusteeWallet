const styles = {
    settings: {
        position: 'relative',
        justifyContent: 'space-between',
        alignContent: 'flex-end',

        marginBottom: 100,

        borderRadius: 16,

        zIndex: 2
    },
    settings__main__title: {
        marginLeft: 15,
        marginTop: -8,
        color: '#404040',
        fontSize: 12,
        fontFamily: 'Montserrat-Bold'
    },
    settings__title: {
        fontFamily: 'SFUIDisplay-Semibold',
        fontSize: 12,
    },
    settings__row: {

        paddingHorizontal: 16,
        paddingTop: 8
    },
    settings__content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    settings__close: {
        position: 'absolute',
        top: 24,
        right: 0,

        padding: 15
    },
    settings__close__icon: {
        fontSize: 24,
        color: '#864DD9'
    },
    settings__line: {
        height: 1
    },
    settings__line__item: {
        height: '100%',
        backgroundColor: '#000'
    },
    mnemonicLength__item: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',

        paddingVertical: 10,
        marginRight: 20
    },
    radio: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 17,
        height: 17,
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#404040',
        borderRadius: 16
    },
    radio__dot: {
        width: 10,
        height: 10,
        borderRadius: 10,
        backgroundColor: '#6B36A8'
    },
    copyBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 3,
        marginLeft: 10
    },
    publicKey: {
        fontFamily: 'Montserrat-Medium',
        fontSize: 14
    },

    inputWrapper: {
        justifyContent: 'center',
        borderRadius: 10,
        elevation: 10,
        shadowColor: '#000',
        shadowRadius: 16,
        shadowOpacity: 0.1,
        shadowOffset: {
            width: 0,
            height: 0
        },
    },

    buttonHeader: {
        borderRadius: 10,
        borderWidth: 2,
        height: 40,
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
    },
    save: {
        borderRadius: 24,
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center'
    },

    texts: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 30
    },
    texts__item: {
        fontSize: 14,
        fontFamily: 'SFUIDisplay-Semibold',
        letterSpacing: 1
    },
    texts__icon: {
        marginRight: 10,
        transform: [{ rotate: '180deg' }]
    },
    stakeItem: {
        flex: 1,
        position: 'relative',
        alignItems: 'flex-start',
        justifyContent: 'center',
        height: 62,
        marginBottom: 16,
        paddingHorizontal: 16,
        borderRadius: 18
    },
    transaction_title: {
        fontSize: 17,
        fontFamily: 'Montserrat-Bold'
    },
    bg: {
        position: 'absolute',
        top: 0,
        left: 0,

        width: '100%',
        height: 188,
        zIndex: 1,

        borderRadius: 16
    },
    containerBG: {
        start: { x: 0.0, y: 0 },
        end: { x: 0, y: 1 }
    },
    topContent__bg: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: 177,
        borderRadius: 16,

        zIndex: 0
    },
    shadow: {
        marginTop: 10,
        marginHorizontal: 5,

        height: '100%',
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
    topContent: {
        position: 'relative',

        height: 177,

        borderRadius: 16
    },

    topContent__content: {
        position: 'relative',
        zIndex: 2
    },
    rewardText: {
        fontFamily: 'Montserrat-SemiBold',
        fontSize: 17,
        lineHeight: 21
    },
    updateTime: {
        color: '#999999',
        fontFamily: 'Montserrat-Bold',
        fontSize: 10,
        lineHeight: 14,
        letterSpacing: 0.5,
        textTransform: 'uppercase'
    },
    reward: {
        fontFamily: 'Montserrat-Bold',
        fontSize: 16,
        lineHeight: 20
    },
    rewardLocation: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    widhdrawBtn: {
        height: 30,
        width: 96,
        paddingHorizontal: 6
    },
    progressBarLoaction: {
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    bandwidthContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-end'
    },
    progressText: {
        fontFamily: 'SFUIDisplay-Semibold',
        fontSize: 14,
        lineHeight: 18,
        letterSpacing: 1,
        color: '#999999'
    },
    description: {
        fontFamily: 'SFUIDisplay-Semibold',
        fontSize: 16,
        lineHeight: 20,
        letterSpacing: 1,
        flex: 1
    },
    linkText: {
        fontFamily: 'SFUIDisplay-Bold',
        fontSize: 14,
        lineHeight: 18,
        textTransform: 'uppercase',
        letterSpacing: 1,
        textDecorationLine: 'underline'
    },
    availableText: {
        fontFamily: 'Montserrat-SemiBold',
        fontSize: 14,
        lineHeight: 18,
        letterSpacing: 1,
        color: '#999999'
    },
    topContent__title_first: {
        height: 40,
        fontSize: 32,
        fontFamily: 'Montserrat-SemiBold',
        lineHeight: 36
    },
    topContent__title_last: {
        height: 40,
        fontSize: 18,
        fontFamily: 'Montserrat-SemiBold',
        lineHeight: 42,
        opacity: 1,
    },
    topContent__subtitle: {
        marginTop: -10,
        fontFamily: 'SFUIDisplay-Semibold',
        fontSize: 14,
        lineHeight: 18,
        textAlign: 'center',
        letterSpacing: 0.5
    },
    scan__text: {
        letterSpacing: 1,
        fontFamily: 'SFUIDisplay-Semibold',
        fontSize: 14,
        lineHeight: 18
    },
    transaction__empty_text: {
        marginTop: -5,
        marginLeft: 16,
        fontSize: 15,
        lineHeight: 19,
        fontFamily: 'SFUIDisplay-Semibold',
        letterSpacing: 1.5
    },
    scan: {
        flexDirection: 'row'
    }
}

export default styles
