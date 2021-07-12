/**
 * @version 0.9
 * @misha to think about optimization
 */
import React, { PureComponent } from 'react'

import { View, Text, Image, Platform } from 'react-native'

import CustomIcon from './CustomIcon'

import BlocksoftDict from '@crypto/common/BlocksoftDict'

import { ThemeContext } from '@app/modules/theme/ThemeProvider'

import colorDict from '@app/services/UIDict/UIDictData'


export default class ButtonLine extends PureComponent {

    renderIcon = () => {

        const { currencyCode, containerStyle, markStyle, iconStyle } = this.props

        const fontSize = typeof iconStyle !== 'undefined' ? iconStyle.fontSize : 24

        const tmpContainerStyle = typeof containerStyle !== 'undefined' ? containerStyle : null

        const tmpMarkStyle = typeof markStyle !== 'undefined' ? markStyle : null

        let extend
        try {
            extend = BlocksoftDict.getCurrencyAllSettings(currencyCode)
        } catch (e) {
            extend = 'NOCOIN'
        }

        const { colors, isLight } = this.context

        switch (currencyCode) {

            //  img
            case 'ETH_UAX':
                return (
                    <View style={{ ...styles.icon, borderColor: colorDict[currencyCode].colors[isLight ? 'mainColor' : 'darkColor'], ...tmpContainerStyle }}>
                        <View style={styles.icon__item}>
                            <Image style={{ width: fontSize, height: fontSize }} resize={'stretch'} source={require('@app/assets/images/currency/ethUAX.png')} />
                            <View style={{ ...styles.icon__mark, backgroundColor: colors.common.iconMarkBg, ...tmpMarkStyle }}>
                                <CustomIcon name="ETH" style={{ color: colorDict['ETH'].colors[isLight ? 'mainColor' : 'darkColor'] }} size={14} />
                            </View>
                        </View>
                    </View>
                )

            case 'ETH_OKB':
                return (
                    <View style={{ ...styles.icon, borderColor: colorDict[currencyCode].colors[isLight ? 'mainColor' : 'darkColor'], ...tmpContainerStyle }}>
                        <View style={styles.icon__item}>
                            <Image style={{ width: fontSize, height: fontSize }} resize={'stretch'} source={require('@app/assets/images/currency/ETH_OKB.png')} />
                        </View>
                        <View style={{ ...styles.icon__mark, backgroundColor: colors.common.iconMarkBg, ...tmpMarkStyle }}>
                            <CustomIcon name="ETH" style={{ color: colorDict['ETH'].colors[isLight ? 'mainColor' : 'darkColor'] }} size={14} />
                        </View>
                    </View>
                )

            case 'XMR':
                return (
                    <View style={{ ...styles.icon, borderColor: colorDict[currencyCode].colors[isLight ? 'mainColor' : 'darkColor'], ...tmpContainerStyle }}>
                        <View style={styles.icon__item}>
                            <Image style={{ width: fontSize, height: fontSize }} resize={'stretch'} source={require('@app/assets/images/currency/XMR.png')} />
                        </View>
                    </View>
                )

            case 'ETH_ONE':
                return (
                    <View style={{ ...styles.icon, borderColor: colorDict[currencyCode].colors[isLight ? 'mainColor' : 'darkColor'], ...tmpContainerStyle }}>
                        <View style={styles.icon__item}>
                            <CustomIcon name="ETH_ONE" style={{ color: colorDict[currencyCode].colors[isLight ? 'mainColor' : 'darkColor'], fontSize: fontSize }} />
                            <View style={{ ...styles.icon__mark, backgroundColor: colors.common.iconMarkBg, ...tmpMarkStyle }}>
                                <CustomIcon name="ETH" style={{ color: colorDict['ETH'].colors[isLight ? 'mainColor' : 'darkColor'] }} size={14} />
                            </View>
                        </View>
                    </View>
                )

            case 'TRX_SUN':
                return (
                    <View style={{ ...styles.icon, borderColor: colorDict[currencyCode].colors[isLight ? 'mainColor' : 'darkColor'], ...tmpContainerStyle }}>
                        <View style={styles.icon__item}>
                            <Image style={{ width: fontSize, height: fontSize }} resize={'stretch'} source={require('@app/assets/images/currency/TRX_SUN.png')} />
                            <View style={{ ...styles.icon__mark, backgroundColor: colors.common.iconMarkBg, ...tmpMarkStyle }}>
                                <View style={{ marginTop: 1 }}>
                                    <CustomIcon name="TRX" style={{ color: colorDict['TRX'].colors[isLight ? 'mainColor' : 'darkColor'] }} size={14} />
                                </View>
                            </View>
                        </View>
                    </View>
                )
            
            case 'TRX_SUN_NEW':
                return (
                    <View style={{ ...styles.icon, borderColor: colorDict[currencyCode].colors[isLight ? 'mainColor' : 'darkColor'], ...tmpContainerStyle }}>
                        <View style={styles.icon__item}>
                            <Image style={{ width: fontSize, height: fontSize }} resize={'stretch'} source={require('@app/assets/images/currency/TRX_SUN_NEW.png')} />
                            <View style={{ ...styles.icon__mark, backgroundColor: colors.common.iconMarkBg, ...tmpMarkStyle }}>
                                <View style={{ marginTop: 1 }}>
                                    <CustomIcon name="TRX" style={{ color: colorDict['TRX'].colors[isLight ? 'mainColor' : 'darkColor'] }} size={14} />
                                </View>
                            </View>
                        </View>
                    </View>
                )

            case 'ETH_SOUL':
                return (
                    <View style={{ ...styles.icon, borderColor: colorDict[currencyCode].colors[isLight ? 'mainColor' : 'darkColor'], ...tmpContainerStyle }}>
                        <View style={styles.icon__item}>
                            <Image style={{ width: 22, height: 22 }} resize={'stretch'} source={require('@app/assets/images/currency/ethSOUL.png')} />
                            <View
                                style={{ ...styles.icon__mark, backgroundColor: colors.common.iconMarkBg, ...tmpMarkStyle }}>
                                <CustomIcon name="ETH" style={{ color: colorDict['ETH'].colors[isLight ? 'mainColor' : 'darkColor'] }} size={14} />
                            </View>
                        </View>
                    </View>
                )

            case 'ETH_HUOBI':
                return (
                    <View style={{ ...styles.icon, borderColor: colorDict[currencyCode].colors[isLight ? 'mainColor' : 'darkColor'], ...tmpContainerStyle }}>
                        <View style={styles.icon__item}>
                            <Image style={{ width: fontSize, height: fontSize }} resize={'stretch'} source={require('@app/assets/images/currency/ETH_HUOBI.png')} />
                            <View
                                style={{ ...styles.icon__mark, backgroundColor: colors.common.iconMarkBg, ...tmpMarkStyle }}>
                                <CustomIcon name="ETH" style={{ color: colorDict['ETH'].colors[isLight ? 'mainColor' : 'darkColor'] }} size={14} />
                            </View>
                        </View>
                    </View>
                )

            case 'ETH_BTC':
                return (
                    <View style={{ ...styles.icon, borderColor: colorDict[currencyCode].colors[isLight ? 'mainColor' : 'darkColor'], ...tmpContainerStyle }}>
                        <View style={styles.icon__item}>
                            <Image style={{ width: fontSize, height: fontSize }} resize={'stretch'} source={require('@app/assets/images/currency/ETH_BTC.png')} />
                            <View
                                style={{ ...styles.icon__mark, backgroundColor: colors.common.iconMarkBg, ...tmpMarkStyle }}>
                                <CustomIcon name="ETH" style={{ color: colorDict['ETH'].colors[isLight ? 'mainColor' : 'darkColor'] }} size={14} />
                            </View>
                        </View>
                    </View>
                )

            case 'ETH_1INCH':
                return (
                    <View style={{ ...styles.icon, borderColor: colorDict[currencyCode].colors[isLight ? 'mainColor' : 'darkColor'], ...tmpContainerStyle }}>
                        <View style={styles.icon__item}>
                            <Image style={{ width: fontSize, height: fontSize }} resize={'stretch'} source={require('@app/assets/images/currency/ETH_1INCH.png')} />
                            <View
                                style={{ ...styles.icon__mark, backgroundColor: colors.common.iconMarkBg, ...tmpMarkStyle }}>
                                <CustomIcon name="ETH" style={{ color: colorDict['ETH'].colors[isLight ? 'mainColor' : 'darkColor'] }} size={14} />
                            </View>
                        </View>
                    </View>
                )

            case 'ETH_SUSHI':
                return (
                    <View style={{ ...styles.icon, borderColor: colorDict[currencyCode].colors[isLight ? 'mainColor' : 'darkColor'], ...tmpContainerStyle }}>
                        <View style={styles.icon__item}>
                            <Image style={{ width: fontSize, height: fontSize }} resize={'stretch'} source={require('@app/assets/images/currency/ETH_SUSHI.png')} />
                            <View
                                style={{ ...styles.icon__mark, backgroundColor: colors.common.iconMarkBg, ...tmpMarkStyle }}>
                                <CustomIcon name="ETH" style={{ color: colorDict['ETH'].colors[isLight ? 'mainColor' : 'darkColor'] }} size={14} />
                            </View>
                        </View>
                    </View>
                )

            case 'ETH_BADGER':
                return (
                    <View style={{ ...styles.icon, borderColor: colorDict[currencyCode].colors[isLight ? 'mainColor' : 'darkColor'], ...tmpContainerStyle }}>
                        <View style={styles.icon__item}>
                            <Image style={{ width: fontSize, height: fontSize }} resize={'stretch'} source={require('@app/assets/images/currency/ETH_BADGER.png')} />
                            <View style={{ ...styles.icon__mark, backgroundColor: colors.common.iconMarkBg, ...tmpMarkStyle }}>
                                <CustomIcon name={'ETH'} style={{ color: colorDict['ETH'].colors[isLight ? 'mainColor' : 'darkColor'] }} size={14} />
                            </View>
                        </View>
                    </View>
                )

            case 'ETH_CRV':
                return (
                    <View style={{ ...styles.icon, borderColor: colorDict[currencyCode].colors[isLight ? 'mainColor' : 'darkColor'], ...tmpContainerStyle }}>
                        <View style={styles.icon__item}>
                            <Image style={{ width: fontSize, height: fontSize }} resize={'stretch'} source={require('@app/assets/images/currency/ETH_CRV.png')} />
                            <View style={{ ...styles.icon__mark, backgroundColor: colors.common.iconMarkBg, ...tmpMarkStyle }}>
                                <CustomIcon name="ETH" style={{ color: colorDict['ETH'].colors[isLight ? 'mainColor' : 'darkColor'] }} size={14} />
                            </View>
                        </View>
                    </View>
                )

            case 'ETH_BAT':
            case 'BNB_SMART_BAT':
                return (
                    <View style={{ ...styles.icon, borderColor: colorDict[currencyCode].colors[isLight ? 'mainColor' : 'darkColor'], ...tmpContainerStyle }}>
                        <View style={styles.icon__item}>
                            <Image style={{ width: fontSize, height: fontSize }} resize={'stretch'} source={require('@app/assets/images/currency/BAT.png')} />
                            <View style={{ ...styles.icon__mark, backgroundColor: colors.common.iconMarkBg, ...tmpMarkStyle }}>
                                <CustomIcon name={currencyCode.indexOf('BNB_SMART') !== -1 ? "BNB_SMART" : 'ETH'} size={14}
                                    color={colorDict[currencyCode.indexOf('BNB_SMART') !== -1 ? "BNB_SMART" : 'ETH'].colors[isLight ? 'mainColor' : 'darkColor']} />
                            </View>
                        </View>
                    </View>
                )

            case 'BNB_SMART_CAKE':
                return (
                    <View style={{ ...styles.icon, borderColor: colorDict[currencyCode].colors[isLight ? 'mainColor' : 'darkColor'], ...tmpContainerStyle }}>
                        <View style={styles.icon__item}>
                            <Image style={{ width: fontSize, height: fontSize }} resize={'stretch'} source={require('@app/assets/images/currency/BNB_SMART_CAKE.png')} />
                            <View style={{ ...styles.icon__mark, backgroundColor: colors.common.iconMarkBg, ...tmpMarkStyle }}>
                                <CustomIcon name={currencyCode.indexOf('BNB_SMART') !== -1 ? "BNB_SMART" : 'ETH'} size={14}
                                    color={colorDict[currencyCode.indexOf('BNB_SMART') !== -1 ? "BNB_SMART" : 'ETH'].colors[isLight ? 'mainColor' : 'darkColor']} />
                            </View>
                        </View>
                    </View>
                )

            case 'FIO':
                return (
                    <View style={{ ...styles.icon, borderColor: colorDict[currencyCode].colors[isLight ? 'mainColor' : 'darkColor'], ...tmpContainerStyle }}>
                        <View style={styles.icon__item}>
                            <Image style={{ width: 25, height: 25 }} resize={'stretch'} source={require('@app/assets/images/currency/fio.png')} />
                        </View>
                    </View>
                )

            case 'ETH_NEXO':
            case 'BNB_SMART_NEXO':
                return (
                    <View style={{ ...styles.icon, borderColor: colorDict[currencyCode].colors[isLight ? 'mainColor' : 'darkColor'], ...tmpContainerStyle }}>
                        <View style={styles.icon__item}>
                            <Image style={{ width: fontSize, height: fontSize }} resize={'stretch'} source={require('@app/assets/images/currency/ETH_NEXO.png')} />
                            <View style={{ ...styles.icon__mark, backgroundColor: colors.common.iconMarkBg, ...tmpMarkStyle }}>
                                <CustomIcon name={currencyCode.indexOf('BNB_SMART') !== -1 ? "BNB_SMART" : 'ETH'} size={14}
                                    color={colorDict[currencyCode.indexOf('BNB_SMART') !== -1 ? "BNB_SMART" : 'ETH'].colors[isLight ? 'mainColor' : 'darkColor']} />
                            </View>
                        </View>
                    </View>
                )
            case 'ETH_SHIB':
                return (
                    <View style={{ ...styles.icon, borderColor: colorDict[currencyCode].colors[isLight ? 'mainColor' : 'darkColor'], ...tmpContainerStyle }}>
                        <View style={styles.icon__item}>
                            <Image style={{ width: fontSize, height: fontSize }} resize={'stretch'} source={require('@app/assets/images/currency/ETH_SHIB.png')} />
                            <View style={{ ...styles.icon__mark, backgroundColor: colors.common.iconMarkBg, ...tmpMarkStyle }}>
                                <CustomIcon name={currencyCode.indexOf('BNB_SMART') !== -1 ? "BNB_SMART" : 'ETH'} size={14}
                                    color={colorDict[currencyCode.indexOf('BNB_SMART') !== -1 ? "BNB_SMART" : 'ETH'].colors[isLight ? 'mainColor' : 'darkColor']} />
                            </View>
                        </View>
                    </View>
                )
            case 'VTHO':
                return (
                    <View style={{ ...styles.icon, borderColor: colorDict[currencyCode].colors[isLight ? 'mainColor' : 'darkColor'], ...tmpContainerStyle }}>
                        <View style={styles.icon__item}>
                            <Image style={{ width: fontSize, height: fontSize }} resize={'stretch'} source={require('@app/assets/images/currency/VTHO.png')} />
                        </View>
                    </View>
                )

            // fonts
            case 'TRX_JST':
            case 'TRX_USDJ':
            case 'TRX_APE':
                return (
                    <View style={{ ...styles.icon, borderColor: colorDict[currencyCode].colors[isLight ? 'mainColor' : 'darkColor'], ...tmpContainerStyle }}>
                        <View style={styles.icon__item}>
                            <CustomIcon name={currencyCode} style={{ color: colorDict[currencyCode].colors[isLight ? 'mainColor' : 'darkColor'], fontSize: fontSize }} />
                            <View style={{ ...styles.icon__mark, backgroundColor: colors.common.iconMarkBg, ...tmpMarkStyle }}>
                                <View style={{ marginTop: 1 }}>
                                    <CustomIcon name="TRX" style={{ color: colorDict['TRX'].colors[isLight ? 'mainColor' : 'darkColor'] }} size={14} />
                                </View>
                            </View>
                        </View>
                    </View>
                )

            case 'TRX_WINK':
            case 'BNB_SMART_WINK':
                return (
                    <View style={{ ...styles.icon, borderColor: colorDict[currencyCode].colors[isLight ? 'mainColor' : 'darkColor'], ...tmpContainerStyle }}>
                        <View style={styles.icon__item}>
                            <CustomIcon name={'TRX_WINK'} style={{ color: colorDict[currencyCode].colors[isLight ? 'mainColor' : 'darkColor'], fontSize: fontSize }} />
                            {currencyCode !== 'TRX' &&
                                <View style={{ ...styles.icon__mark, backgroundColor: colors.common.iconMarkBg, ...tmpMarkStyle }}>
                                    <View style={{ marginTop: 1 }}>
                                        <CustomIcon name={currencyCode.indexOf('BNB_SMART') !== -1 ? "BNB_SMART" : 'TRX'}
                                            style={{ color: colorDict[currencyCode.indexOf('BNB_SMART') !== -1 ? "BNB_SMART" : 'TRX'].colors[isLight ? 'mainColor' : 'darkColor'] }} size={14} />
                                    </View>
                                </View>}
                        </View>
                    </View>
                )

            case 'TRX_BTT':
            case 'TRX_WBTT':
            case 'BNB_SMART_BTT':
            case 'ETH_BTT':
                return (
                    <View style={{ ...styles.icon, borderColor: colorDict[currencyCode].colors[isLight ? 'mainColor' : 'darkColor'], ...tmpContainerStyle }}>
                        <View style={styles.icon__item}>
                            <CustomIcon name={'TRX_BTT'} style={{ color: colorDict[currencyCode].colors[isLight ? 'mainColor' : 'darkColor'], fontSize: fontSize }} />
                            {currencyCode !== 'TRX' &&
                                <View style={{ ...styles.icon__mark, backgroundColor: colors.common.iconMarkBg, ...tmpMarkStyle }}>
                                    <View style={{ marginTop: 1 }}>
                                        <CustomIcon name={currencyCode.indexOf('BNB_SMART') !== -1 ? "BNB_SMART" : currencyCode.indexOf('ETH') !== -1 ? 'ETH' : 'TRX'}
                                            style={{ color: colorDict[currencyCode.indexOf('BNB_SMART') !== -1 ? "BNB_SMART" : currencyCode.indexOf('ETH') !== -1 ? 'ETH' : 'TRX'].colors[isLight ? 'mainColor' : 'darkColor'] }} size={14} />
                                    </View>
                                </View>}
                        </View>
                    </View>
                )

            case 'TRX':
            case 'BNB_SMART_TRX':
            case 'ETH_TRX':
                return (
                    <View style={{ ...styles.icon, borderColor: colorDict[currencyCode].colors[isLight ? 'mainColor' : 'darkColor'], ...tmpContainerStyle }}>
                        <View style={styles.icon__item}>
                            <CustomIcon name={'TRX'} style={{ color: colorDict[currencyCode].colors[isLight ? 'mainColor' : 'darkColor'], fontSize: fontSize }} />
                            {currencyCode !== 'TRX' &&
                                <View style={{ ...styles.icon__mark, backgroundColor: colors.common.iconMarkBg, ...tmpMarkStyle }}>
                                    <View style={{ marginTop: 1 }}>
                                        <CustomIcon name={currencyCode.indexOf('BNB_SMART') !== -1 ? "BNB_SMART" : currencyCode.indexOf('ETH') !== -1 ? 'ETH' : 'TRX'}
                                            style={{ color: colorDict[currencyCode.indexOf('BNB_SMART') !== -1 ? "BNB_SMART" : currencyCode.indexOf('ETH') !== -1 ? 'ETH' : 'TRX'].colors[isLight ? 'mainColor' : 'darkColor'] }} size={14} />
                                    </View>
                                </View>}
                        </View>
                    </View>
                )

            case 'XVG':
            case 'ETH_ROPSTEN':
            case 'BCH':
            case 'BSV':
            case 'XRP':
            case 'XLM':
            case 'BNB_SMART':
            case 'ETC':
            case 'VET':
            case 'AMB':
            case 'SOL':
                return (
                    <View style={{ ...styles.icon, borderColor: colorDict[currencyCode].colors[isLight ? 'mainColor' : 'darkColor'], ...tmpContainerStyle }}>
                        <View style={styles.icon__item}>
                            <CustomIcon name={currencyCode} style={{ color: colorDict[currencyCode].colors[isLight ? 'mainColor' : 'darkColor'], fontSize: fontSize }} />
                        </View>
                    </View>
                )

            case 'BNB':
                return (
                    <View style={{ ...styles.icon, borderColor: colorDict['ETH_BNB'].colors[isLight ? 'mainColor' : 'darkColor'], ...tmpContainerStyle }}>
                        <View style={styles.icon__item}>
                            <CustomIcon name={'ETH_BNB'} style={{ color: colorDict['ETH_BNB'].colors[isLight ? 'mainColor' : 'darkColor'], fontSize: fontSize }} />
                        </View>
                    </View>
                )

            case 'DOGE':
            case 'BNB_SMART_DOGE':
            case 'TRX_DOGE':
                return (
                    <View style={{ ...styles.icon, borderColor: colorDict[currencyCode].colors[isLight ? 'mainColor' : 'darkColor'], ...tmpContainerStyle }}>
                        <View style={styles.icon__item}>
                            <CustomIcon name="DOGE" style={{ color: colorDict[currencyCode].colors[isLight ? 'mainColor' : 'darkColor'], fontSize: fontSize }} />
                            {currencyCode !== 'DOGE' &&
                                <View style={{ ...styles.icon__mark, backgroundColor: colors.common.iconMarkBg, ...tmpMarkStyle }}>
                                    <View style={{ marginTop: 1 }}>
                                        <CustomIcon name={currencyCode.indexOf('BNB_SMART') !== -1 ? "BNB_SMART" : 'TRX'}
                                            style={{ color: colorDict[currencyCode.indexOf('BNB_SMART') !== -1 ? "BNB_SMART" : 'TRX'].colors[isLight ? 'mainColor' : 'darkColor'] }} size={14} />
                                    </View>
                                </View>}
                        </View>
                    </View>
                )

            case 'LTC':
            case 'BNB_SMART_LTC':
                return (
                    <View style={{ ...styles.icon, borderColor: colorDict[currencyCode].colors[isLight ? 'mainColor' : 'darkColor'], ...tmpContainerStyle }}>
                        <View style={styles.icon__item}>
                            <CustomIcon name="LTC" style={{ color: colorDict[currencyCode].colors[isLight ? 'mainColor' : 'darkColor'], fontSize: fontSize }} />
                            {currencyCode !== 'LTC' &&
                                <View style={{ ...styles.icon__mark, backgroundColor: colors.common.iconMarkBg, ...tmpMarkStyle }}>
                                    <View style={{ marginTop: 1 }}>
                                        <CustomIcon name={currencyCode.indexOf('BNB_SMART') !== -1 ? "BNB_SMART" : 'TRX'}
                                            style={{ color: colorDict[currencyCode.indexOf('BNB_SMART') !== -1 ? "BNB_SMART" : 'TRX'].colors[isLight ? 'mainColor' : 'darkColor'] }} size={14} />
                                    </View>
                                </View>}
                        </View>
                    </View>
                )

            case 'ETH':
            case 'TRX_ETH':
            case 'BNB_SMART_ETH':
                return (
                    <View style={{ ...styles.icon, borderColor: colorDict[currencyCode].colors[isLight ? 'mainColor' : 'darkColor'], ...tmpContainerStyle }}>
                        <View style={styles.icon__item}>
                            <CustomIcon name="ETH" style={{ color: colorDict['ETH'].colors[isLight ? 'mainColor' : 'darkColor'] }} size={fontSize} />
                            {currencyCode !== 'ETH' &&
                                <View style={{ ...styles.icon__mark, backgroundColor: colors.common.iconMarkBg, ...tmpMarkStyle }}>
                                    <View style={{ marginTop: 1 }}>
                                        <CustomIcon name={currencyCode.indexOf('BNB_SMART') !== -1 ? "BNB_SMART" : 'TRX'}
                                            style={{ color: colorDict[currencyCode.indexOf('BNB_SMART') !== -1 ? "BNB_SMART" : 'TRX'].colors[isLight ? 'mainColor' : 'darkColor'] }} size={14} />
                                    </View>
                                </View>}
                        </View>
                    </View>
                )

            case 'BTC':
            case 'BTC_TEST':
            case 'TRX_BTC':
            case 'BNB_SMART_BTC':
                return (
                    <View style={{ ...styles.icon, borderColor: colorDict[currencyCode].colors[isLight ? 'mainColor' : 'darkColor'], ...tmpContainerStyle }}>
                        <View style={styles.icon__item}>
                            <CustomIcon name="BTC" style={{ color: colorDict[currencyCode].colors[isLight ? 'mainColor' : 'darkColor'], fontSize: fontSize }} />
                            {currencyCode !== 'BTC' && currencyCode !== 'BTC_TEST' &&
                                <View style={{ ...styles.icon__mark, backgroundColor: colors.common.iconMarkBg, ...tmpMarkStyle }}>
                                    <View style={{ marginTop: 1 }}>
                                        <CustomIcon name={currencyCode.indexOf('BNB_SMART') !== -1 ? "BNB_SMART" : 'TRX'}
                                            style={{ color: colorDict[currencyCode.indexOf('BNB_SMART') !== -1 ? "BNB_SMART" : 'TRX'].colors[isLight ? 'mainColor' : 'darkColor'] }} size={14} />
                                    </View>
                                </View>}
                        </View>
                    </View>
                )

            case 'BTG':
                return (
                    <View style={{ ...styles.icon, borderColor: colorDict[currencyCode].colors[isLight ? 'mainColor' : 'darkColor'], borderWidth: 1, ...tmpContainerStyle }}>
                        <View style={styles.icon__item}>
                            <View style={{ padding: 3, borderWidth: 5, borderColor: '#E1A600', borderRadius: 30 }}>
                                <View style={{ marginTop: Platform.OS === 'ios' ? -1 : 0 }}>
                                    <CustomIcon name="BTG" style={{ color: colorDict[currencyCode].colors[isLight ? 'mainColor' : 'darkColor'], fontSize: fontSize }} />
                                </View>
                            </View>
                        </View>
                    </View>
                )

            case 'USDT':
            case 'TRX_USDT':
            case 'ETH_USDT':
            case 'BNB_SMART_USDT':
                return (
                    <View style={{ ...styles.icon, borderColor: colorDict[currencyCode].colors[isLight ? 'mainColor' : 'darkColor'], ...tmpContainerStyle }}>
                        <View style={styles.icon__item}>
                            <CustomIcon name="USDT" style={{ color: colorDict[currencyCode].colors[isLight ? 'mainColor' : 'darkColor'], fontSize: fontSize }} />
                            <View style={{ ...styles.icon__mark, backgroundColor: colors.common.iconMarkBg, ...tmpMarkStyle }}>
                                <CustomIcon name={currencyCode === 'ETH_USDT' ? "ETH" : currencyCode === 'TRX_USDT' ? 'TRX' : currencyCode === 'BNB_SMART_USDT' ? 'BNB_SMART' : 'BTC'}
                                    style={{
                                        color: colorDict[currencyCode === 'ETH_USDT' ? "ETH" : currencyCode === 'TRX_USDT' ?
                                            'TRX' : currencyCode === 'BNB_SMART_USDT' ? 'BNB_SMART' : 'BTC'].colors[isLight ? 'mainColor' : 'darkColor']
                                    }} size={14} />
                            </View>
                        </View>
                    </View>
                )

            case 'ETH_TRUE_USD':
            case 'TRX_TUSD':
                return (
                    <View style={{ ...styles.icon, borderColor: colorDict['ETH_TRUE_USD'].colors[isLight ? 'mainColor' : 'darkColor'], ...tmpContainerStyle }}>
                        <View style={styles.icon__item}>
                            <CustomIcon name={'ETH_TRUE_USD'} style={{ color: colorDict['ETH_TRUE_USD'].colors[isLight ? 'mainColor' : 'darkColor'], fontSize: fontSize }} />
                            <View style={{ ...styles.icon__mark, backgroundColor: colors.common.iconMarkBg, ...tmpMarkStyle }}>
                                <CustomIcon name={currencyCode === 'ETH_TRUE_USD' ? "ETH" : 'TRX'} style={{ color: colorDict[currencyCode === 'ETH_TRUE_USD' ? "ETH" : 'TRX'].colors[isLight ? 'mainColor' : 'darkColor'] }} size={14} />
                            </View>
                        </View>
                    </View>
                )

            case 'ETH_BNB':
            case 'ETH_USDC':
            case 'ETH_PAX':
            case 'ETH_DAI':
            case 'ETH_DAIM':
            case 'ETH_COMP':
            case 'ETH_BAL':
            case 'ETH_LEND':
            case 'ETH_BNT':
            case 'ETH_MKR':
            case 'ETH_CRO':
            case 'ETH_RSR':
            case 'ETH_YFI':
            case 'ETH_CHZ':
            case 'ETH_OMG':
            case 'ETH_MATIC':
            case 'ETH_ZRX':
            case 'ETH_SNX':
            case 'ETH_ENJ':
            case 'ETH_AAVE':
            case 'ETH_GRT':
            case 'ETH_NOW':
                return (
                    <View style={{ ...styles.icon, borderColor: colorDict[currencyCode].colors[isLight ? 'mainColor' : 'darkColor'], ...tmpContainerStyle }}>
                        <View style={styles.icon__item}>
                            <CustomIcon name={currencyCode} style={{ color: colorDict[currencyCode].colors[isLight ? 'mainColor' : 'darkColor'], fontSize: fontSize }} />
                            <View style={{ ...styles.icon__mark, backgroundColor: colors.common.iconMarkBg, ...tmpMarkStyle }}>
                                <CustomIcon name="ETH" style={{ color: colorDict['ETH'].colors[isLight ? 'mainColor' : 'darkColor'] }} size={14} />
                            </View>
                        </View>
                    </View>
                )
            
            case 'ETH_KNC':
            case 'ETH_KNC_NEW':
                return (
                    <View style={{ ...styles.icon, borderColor: colorDict[currencyCode].colors[isLight ? 'mainColor' : 'darkColor'], ...tmpContainerStyle }}>
                        <View style={styles.icon__item}>
                            <CustomIcon name={'ETH_KNC'} style={{ color: colorDict[currencyCode].colors[isLight ? 'mainColor' : 'darkColor'], fontSize: fontSize }} />
                            <View style={{ ...styles.icon__mark, backgroundColor: colors.common.iconMarkBg, ...tmpMarkStyle }}>
                                <CustomIcon name="ETH" style={{ color: colorDict['ETH'].colors[isLight ? 'mainColor' : 'darkColor'] }} size={14} />
                            </View>
                        </View>
                    </View>
                )

            case 'BNB_SMART_UNI':
            case 'ETH_UNI':
                return (
                    <View style={{ ...styles.icon, borderColor: colorDict[currencyCode].colors[isLight ? 'mainColor' : 'darkColor'], ...tmpContainerStyle }}>
                        <View style={styles.icon__item}>
                            <CustomIcon name={'UNI'} style={{ color: colorDict[currencyCode].colors[isLight ? 'mainColor' : 'darkColor'], fontSize: fontSize }} />
                            <View style={{ ...styles.icon__mark, backgroundColor: colors.common.iconMarkBg, ...tmpMarkStyle }}>
                                <CustomIcon name={currencyCode.indexOf('BNB_SMART') !== -1 ? "BNB_SMART" : 'ETH'} size={14}
                                    color={colorDict[currencyCode.indexOf('BNB_SMART') !== -1 ? "BNB_SMART" : 'ETH'].colors[isLight ? 'mainColor' : 'darkColor']} />
                            </View>
                        </View>
                    </View>
                )

            case 'ETH_LINK':
            case 'BNB_SMART_LINK':
                return (
                    <View style={{ ...styles.icon, borderColor: colorDict[currencyCode].colors[isLight ? 'mainColor' : 'darkColor'], ...tmpContainerStyle }}>
                        <View style={styles.icon__item}>
                            <CustomIcon name={'ChainLink'} style={{ color: colorDict[currencyCode].colors[isLight ? 'mainColor' : 'darkColor'], fontSize: fontSize }} />
                            <View style={{ ...styles.icon__mark, backgroundColor: colors.common.iconMarkBg, ...tmpMarkStyle }}>
                                <CustomIcon name={currencyCode.indexOf('BNB_SMART') !== -1 ? "BNB_SMART" : 'ETH'} size={14}
                                    color={colorDict[currencyCode.indexOf('BNB_SMART') !== -1 ? "BNB_SMART" : 'ETH'].colors[isLight ? 'mainColor' : 'darkColor']} />
                            </View>
                        </View>
                    </View>
                )

            case 'ETH_SXP':
            case 'BNB_SMART_SXP':
                return (
                    <View style={{ ...styles.icon, borderColor: colorDict[currencyCode].colors[isLight ? 'mainColor' : 'darkColor'], ...tmpContainerStyle }}>
                        <View style={styles.icon__item}>
                            <CustomIcon name={'SXP'} style={{ color: colorDict[currencyCode].colors[isLight ? 'mainColor' : 'darkColor'], fontSize: fontSize }} />
                            <View style={{ ...styles.icon__mark, backgroundColor: colors.common.iconMarkBg, ...tmpMarkStyle }}>
                                <CustomIcon name={currencyCode.indexOf('BNB_SMART') !== -1 ? "BNB_SMART" : 'ETH'} size={14}
                                    color={colorDict[currencyCode.indexOf('BNB_SMART') !== -1 ? "BNB_SMART" : 'ETH'].colors[isLight ? 'mainColor' : 'darkColor']} />
                            </View>
                        </View>
                    </View>
                )

            case 'ETH_ALPHA':
            case 'BNB_SMART_ALPHA':
                return (
                    <View style={{ ...styles.icon, borderColor: colorDict[currencyCode].colors[isLight ? 'mainColor' : 'darkColor'], ...tmpContainerStyle }}>
                        <View style={styles.icon__item}>
                            <CustomIcon name={'ALPHA'} style={{ color: colorDict[currencyCode].colors[isLight ? 'mainColor' : 'darkColor'], fontSize: fontSize }} />
                            <View style={{ ...styles.icon__mark, backgroundColor: colors.common.iconMarkBg, ...tmpMarkStyle }}>
                                <CustomIcon name={currencyCode.indexOf('BNB_SMART') !== -1 ? "BNB_SMART" : 'ETH'} size={14}
                                    color={colorDict[currencyCode.indexOf('BNB_SMART') !== -1 ? "BNB_SMART" : 'ETH'].colors[isLight ? 'mainColor' : 'darkColor']} />
                            </View>
                        </View>
                    </View>
                )

            case 'BNB_SMART_USDC':
                return (
                    <View style={{ ...styles.icon, borderColor: colorDict[currencyCode].colors[isLight ? 'mainColor' : 'darkColor'], ...tmpContainerStyle }}>
                        <View style={styles.icon__item}>
                            <CustomIcon name={'ETH_USDC'} style={{ color: colorDict[currencyCode].colors[isLight ? 'mainColor' : 'darkColor'], fontSize: fontSize }} />
                            <View style={{ ...styles.icon__mark, backgroundColor: colors.common.iconMarkBg, ...tmpMarkStyle }}>
                                <CustomIcon name="BNB_SMART" size={14} color={colorDict['BNB_SMART'].colors[isLight ? 'mainColor' : 'darkColor']} />
                            </View>
                        </View>
                    </View>
                )

            case 'ETH_BUSD':
            case 'BNB_SMART_USD':
                return (
                    <View style={{ ...styles.icon, borderColor: colorDict[currencyCode].colors[isLight ? 'mainColor' : 'darkColor'], ...tmpContainerStyle }}>
                        <View style={styles.icon__item}>
                            <CustomIcon name={'BNB_SMART_USDT'} style={{ color: colorDict[currencyCode].colors[isLight ? 'mainColor' : 'darkColor'], fontSize: fontSize }} />
                            <View style={{ ...styles.icon__mark, backgroundColor: colors.common.iconMarkBg, ...tmpMarkStyle }}>
                                <CustomIcon name={currencyCode.indexOf('BNB_SMART') !== -1 ? "BNB_SMART" : 'ETH'} size={14}
                                    color={colorDict[currencyCode.indexOf('BNB_SMART') !== -1 ? "BNB_SMART" : 'ETH'].colors[isLight ? 'mainColor' : 'darkColor']} />
                            </View>
                        </View>
                    </View>
                )

            case 'ETH_FTT':
            case 'BNB_SMART_FTT':
                return (
                    <View style={{ ...styles.icon, borderColor: colorDict[currencyCode].colors[isLight ? 'mainColor' : 'darkColor'], ...tmpContainerStyle }}>
                        <View style={styles.icon__item}>
                            <CustomIcon name={'ETH_FTT'} style={{ color: colorDict[currencyCode].colors[isLight ? 'mainColor' : 'darkColor'], fontSize: fontSize }} />
                            <View style={{ ...styles.icon__mark, backgroundColor: colors.common.iconMarkBg, ...tmpMarkStyle }}>
                                <CustomIcon name={currencyCode.indexOf('BNB_SMART') !== -1 ? "BNB_SMART" : 'ETH'} size={14}
                                    color={colorDict[currencyCode.indexOf('BNB_SMART') !== -1 ? "BNB_SMART" : 'ETH'].colors[isLight ? 'mainColor' : 'darkColor']} />
                            </View>
                        </View>
                    </View>
                )

            case 'BNB_SMART_ADA':
                return (
                    <View style={{ ...styles.icon, borderColor: colorDict[currencyCode].colors[isLight ? 'mainColor' : 'darkColor'], ...tmpContainerStyle }}>
                        <View style={styles.icon__item}>
                            <CustomIcon name={currencyCode} style={{ color: colorDict[currencyCode].colors[isLight ? 'mainColor' : 'darkColor'], fontSize: fontSize }} />
                            <View style={{ ...styles.icon__mark, backgroundColor: colors.common.iconMarkBg, ...tmpMarkStyle }}>
                                <CustomIcon name="BNB_SMART" size={14} color={colorDict['BNB_SMART'].colors[isLight ? 'mainColor' : 'darkColor']} />
                            </View>
                        </View>
                    </View>
                )

            case 'CUSTOM_MVT':
                return (
                    <View style={{ ...styles.icon, borderColor: colorDict[currencyCode].colors[isLight ? 'mainColor' : 'darkColor'], ...tmpContainerStyle }}>
                        <View style={styles.icon__item}>
                            <CustomIcon name="ETH_MVT" style={{ color: colorDict[currencyCode].colors[isLight ? 'mainColor' : 'darkColor'], fontSize: fontSize }} />
                        </View>
                        <View style={{ ...styles.icon__mark, backgroundColor: colors.common.iconMarkBg, ...tmpMarkStyle }}>
                            <CustomIcon name="ETH" style={{ color: colorDict['ETH'].colors[isLight ? 'mainColor' : 'darkColor'] }} size={14} />
                        </View>
                    </View>
                )


            case 'CUSTOM_TTCrypto':
                return (
                    <View style={{ ...styles.icon, borderColor: colorDict[currencyCode].colors[isLight ? 'mainColor' : 'darkColor'], ...tmpContainerStyle }}>
                        <View style={styles.icon__item}>
                            <CustomIcon name="ETH_TT" style={{ color: colorDict[currencyCode].colors[isLight ? 'mainColor' : 'darkColor'], fontSize: fontSize, marginRight: 1 }} />
                        </View>
                        <View style={{ ...styles.icon__mark, backgroundColor: colors.common.iconMarkBg, ...tmpMarkStyle }}>
                            <CustomIcon name="TRX" style={{ color: colorDict['TRX'].colors[isLight ? 'mainColor' : 'darkColor'] }} size={14} />
                        </View>
                    </View>
                )
            case 'CUSTOM_STORJ':
                return (
                    <View style={{ ...styles.icon, borderColor: colorDict[currencyCode].colors[isLight ? 'mainColor' : 'darkColor'], ...tmpContainerStyle }}>
                        <View style={styles.icon__item}>
                            <CustomIcon name="ETH_STORJ" style={{ color: colorDict[currencyCode].colors[isLight ? 'mainColor' : 'darkColor'], fontSize: fontSize, marginRight: 1 }} />
                        </View>
                        <View style={{ ...styles.icon__mark, backgroundColor: colors.common.iconMarkBg, ...tmpMarkStyle }}>
                            <CustomIcon name="ETH" style={{ color: colorDict['ETH'].colors[isLight ? 'mainColor' : 'darkColor'] }} size={14} />
                        </View>
                    </View>
                )

            case 'CUSTOM_XXP':
                return (
                    <View style={{ ...styles.icon, borderColor: colorDict[currencyCode].colors[isLight ? 'mainColor' : 'darkColor'], ...tmpContainerStyle }}>
                        <View style={styles.icon__item}>
                            <CustomIcon name="XXP" style={{ color: colorDict[currencyCode].colors[isLight ? 'mainColor' : 'darkColor'], fontSize: fontSize, marginRight: 1 }} />
                        </View>
                        <View style={{ ...styles.icon__mark, backgroundColor: colors.common.iconMarkBg, ...tmpMarkStyle }}>
                            <CustomIcon name="TRX" style={{ color: colorDict['TRX'].colors[isLight ? 'mainColor' : 'darkColor'] }} size={14} />
                        </View>
                    </View>
                )
        }

        if (typeof extend.addressCurrencyCode !== 'undefined') {
            switch (extend.addressCurrencyCode) {

                case 'ETH':
                    if (extend.tokenBlockchain === 'BNB') {
                        return (
                            <View style={{ ...styles.icon, borderColor: colorDict['XRP'].colors[isLight ? 'mainColor' : 'darkColor'], ...tmpContainerStyle }}>
                                <View style={styles.icon__item}>
                                    <Text style={{ ...styles.icon__item__text, color: colorDict['XRP'].colors[isLight ? 'mainColor' : 'darkColor'] }}>No</Text>
                                    <Text style={{ ...styles.icon__item__text, color: colorDict['XRP'].colors[isLight ? 'mainColor' : 'darkColor'] }}>Icon</Text>
                                </View>
                                <View style={{ ...styles.icon__mark, backgroundColor: colors.common.iconMarkBg, ...tmpMarkStyle }}>
                                    <CustomIcon name="BNB_SMART" style={{ color: colorDict['BNB_SMART'].colors[isLight ? 'mainColor' : 'darkColor'] }} size={14} />
                                </View>
                            </View>
                        )
                    }
                    return (
                        <View style={{ ...styles.icon, borderColor: colorDict['XRP'].colors[isLight ? 'mainColor' : 'darkColor'], ...tmpContainerStyle }}>
                            <View style={styles.icon__item}>
                                <Text style={{ ...styles.icon__item__text, color: colorDict['XRP'].colors[isLight ? 'mainColor' : 'darkColor'] }}>No</Text>
                                <Text style={{ ...styles.icon__item__text, color: colorDict['XRP'].colors[isLight ? 'mainColor' : 'darkColor'] }}>Icon</Text>
                            </View>
                            <View style={{ ...styles.icon__mark, backgroundColor: colors.common.iconMarkBg, ...tmpMarkStyle }}>
                                <CustomIcon name="ETH" style={{ color: colorDict['ETH'].colors[isLight ? 'mainColor' : 'darkColor'] }} size={14} />
                            </View>
                        </View>
                    )
                case 'TRX':
                    return (
                        <View style={{ ...styles.icon, borderColor: colorDict['XRP'].colors[isLight ? 'mainColor' : 'darkColor'], ...tmpContainerStyle }}>
                            <View style={styles.icon__item}>
                                <Text style={{ ...styles.icon__item__text, color: colorDict['XRP'].colors[isLight ? 'mainColor' : 'darkColor'] }}>No</Text>
                                <Text style={{ ...styles.icon__item__text, color: colorDict['XRP'].colors[isLight ? 'mainColor' : 'darkColor'] }}>Icon</Text>
                            </View>
                            <View style={{ ...styles.icon__mark, backgroundColor: colors.common.iconMarkBg, ...tmpMarkStyle }}>
                                <CustomIcon name="TRX" style={{ color: colorDict['TRX'].colors[isLight ? 'mainColor' : 'darkColor'] }} size={14} />
                            </View>
                        </View>
                    )
                default:
                    return (
                        <View style={{ ...styles.icon, borderColor: colorDict['XRP'].colors[isLight ? 'mainColor' : 'darkColor'], ...tmpContainerStyle }}>
                            <View style={styles.icon__item}>
                                <Text style={{ ...styles.icon__item__text, color: colorDict['XRP'].colors[isLight ? 'mainColor' : 'darkColor'] }}>No</Text>
                                <Text style={{ ...styles.icon__item__text, color: colorDict['XRP'].colors[isLight ? 'mainColor' : 'darkColor'] }}>Icon</Text>
                            </View>
                        </View>
                    )
            }
        }

        return (
            <View style={{ ...styles.icon, borderColor: colorDict['XRP'].colors[isLight ? 'mainColor' : 'darkColor'], ...tmpContainerStyle }}>
                <View style={styles.icon__item}>
                    <Text style={{ ...styles.icon__item__text, color: colorDict['XRP'].colors[isLight ? 'mainColor' : 'darkColor'] }}>No</Text>
                    <Text style={{ ...styles.icon__item__text, color: colorDict['XRP'].colors[isLight ? 'mainColor' : 'darkColor'] }}>Icon</Text>
                </View>
            </View>
        )

    }

    render() {
        return this.renderIcon()
    }
}

ButtonLine.contextType = ThemeContext

const styles = {
    icon: {
        width: 50,
        height: 50,
        borderRadius: 50,

        borderWidth: 2,
        borderColor: '#000',

        overflow: 'visible'
    },
    icon__item: {
        alignItems: 'center',
        justifyContent: 'center',

        position: 'relative',

        width: '100%',
        height: '100%',

        borderRadius: 50,

        overflow: 'visible'
    },
    icon__item__text: {
        fontSize: 12,
        marginVertical: 0,
        lineHeight: 12,
    },

    icon__text: {
        justifyContent: 'center',
        alignItems: 'center',

        position: 'absolute',
        bottom: -6,
        left: 0,

        width: '100%'
    },
    icon__text__item: {
        paddingLeft: 3,
        paddingRight: 2,

        fontSize: 10,
        fontFamily: 'Montserrat-Bold',
        color: '#F79E1B',
    },
    icon__mark: {
        justifyContent: 'center',
        alignItems: 'center',

        position: 'absolute',
        top: 25,
        right: -4,
        width: 18,
        height: 18,

        // backgroundColor: '#f9f9f9',

        borderRadius: 15,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1
        },
        shadowOpacity: 0.20,
        shadowRadius: 1.41,

        elevation: 2
    },
    icon__mark__text: {
        paddingRight: 17,
        fontSize: 8,
        fontFamily: 'SFUIDisplay-Semibold',
        color: '#fff'
    },
    icons: {
        color: '#f4f4f4',
        position: {
            start: { x: 0.0, y: 0.5 },
            end: { x: 1, y: 0.5 }
        }
    }
}
