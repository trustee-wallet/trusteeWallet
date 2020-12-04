import React, { Component } from 'react'
import {
    Platform,
    View,
    Text,
    TouchableOpacity,
    Linking,
    TextInput, Dimensions, PixelRatio,
    SafeAreaView, ScrollView
} from 'react-native'
import { connect } from 'react-redux'
import { strings } from '../../../services/i18n'
import Header from '../../../components/elements/new/Header'
import NavStore from '../../../components/navigation/NavStore'
import { ThemeContext } from '../../../modules/theme/ThemeProvider'
import Feather from 'react-native-vector-icons/Feather'
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5'
import AntIcon from 'react-native-vector-icons/AntDesign'
import EntypoIcon from 'react-native-vector-icons/Entypo'
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons'
import MaterialIcon from 'react-native-vector-icons/MaterialIcons'
import FontAwesomeIcon from 'react-native-vector-icons/FontAwesome'

import Theme from '../../../themes/Themes'
import UIDict from '../../../services/UIDict/UIDict'

import LetterSpacing from '../../../components/elements/LetterSpacing'
import Loader from '../../../components/elements/LoaderItem'

import { useTheme } from '../../../modules/theme/ThemeProvider'

const getIcon = (iconType, color) => {
    switch (iconType) {
        case 'wallet':
            return <MaterialCommunityIcon name="wallet" color={color} size={22} style={{ marginTop: 2, marginLeft: 1 }} />
        case 'accounts':
            return <FontAwesomeIcon name="address-book" color={color} size={19} style={{ marginLeft: 2 }} />
        case 'pinCode':
            return <MaterialIcon name="lock" color={color} size={20} style={{ marginLeft: 2 }} />
        default: return null
    }
}

const TrxItem = (props) => {


    const { colors, GRID_SIZE } = useTheme()

    const {
        title,
        subtitle,
        iconType
    } = props

    return (
        <View style={{ marginTop: 16 }}>
            <View style={{ ...styles.wrapper, padding: GRID_SIZE, flexDirection: 'row' }} >
                <View style={styles.icon}>
                    {getIcon(iconType, colors.common.text1)}
                </View>
                <View style={styles.mainContent}>
                    <View style={[styles.textContent, { paddingVertical: 3 }]}>
                        <Text style={[styles.title, { color: colors.common.text2 }]}>{title}</Text>
                        {!!subtitle && <Text numberOfLines={2} style={[styles.subtitle, { color: colors.common.text1 }]}>{subtitle}</Text>}
                    </View>
                </View>
            </View>
            <View style={styles.shadow}>
                <View style={styles.shadowItem} />
            </View>
        </View>
    )

}

export default TrxItem

const styles = {
    wrapper: {
        borderRadius: 16,
        width: '100%',
        backgroundColor: '#F2F2F2',
        position: 'relative',

        zIndex: 2,
    },
    shadow: {
        position: 'absolute',
        top: 0,
        left: 0,

        width: '100%',
        height: '100%',
        zIndex: 1
    },
    shadowItem: {
        flex: 1,
        marginBottom: Platform.OS === 'android' ? 6 : 0,

        backgroundColor: '#fff',

        borderRadius: 16,

        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.22,
        shadowRadius: 2.22,

        elevation: 3,
    },
    icon: {
        width: 40,
        justifyContent: 'center',
    },
    title: {
        fontFamily: 'Montserrat-Medium',
        fontSize: 14,
        lineHeight: 14
    },
    subtitle: {
        marginTop: 5,
        fontFamily: 'SFUIDisplay-Semibold',
        fontSize: 15,
        lineHeight: 19,
        letterSpacing: 1.5,
    },
    mainContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingLeft: 4,
        flex: 1,
    },
    textContent: {
        flex: 1,
        justifyContent: 'center',
    },
}

