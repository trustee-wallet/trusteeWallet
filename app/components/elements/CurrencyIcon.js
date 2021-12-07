/**
 * @version 0.9
 * @misha to think about optimization
 */
import React, { PureComponent } from 'react'

import { View, Text, Image, Platform } from 'react-native'

import CustomIcon from './CustomIcon'

import BlocksoftDict from '@crypto/common/BlocksoftDict'

import { ThemeContext } from '@app/theme/ThemeProvider'

import colorDict from '@app/services/UIDict/UIDictData'

export default class CurrencyIcon extends PureComponent {

    getBlockchain = (currencyCode) => {
        if (currencyCode.indexOf('BNB_SMART_') !== -1) {
            return 'BNB_SMART'
        } else if (currencyCode.indexOf('ETH_') !== -1) {
            return 'ETH'
        } else if (currencyCode.indexOf('TRX_') !== -1) {
            return 'TRX'
        } else if (currencyCode.indexOf('SOL_') !== -1) {
            return 'SOL'
        } else if (currencyCode.indexOf('MATIC_') !== -1) {
            return 'ETH_MATIC'
        }
    }

    getTokenBlockchain = (tokenBlockchain) => {
        switch (tokenBlockchain) {
            case 'ETHEREUM':
                return 'ETH'
            case 'TRON':
                return 'TRX'
            case 'BITCOIN':
                return 'BTC'
            case 'BNB':
                return 'BNB_SMART'
            case 'SOLANA':
                return 'SOL'
            case 'MATIC':
                return 'ETH_MATIC'
            default:
                return null
        }
    }

    getImgPath = (currencyCode) => {
        switch (currencyCode) {
            case 'ETH_UAX':
                return require('@assets/images/currency/ethUAX.png')
            case 'ETH_OKB':
                return require('@assets/images/currency/ETH_OKB.png')
            case 'XMR':
                return require('@assets/images/currency/XMR.png')
            case 'TRX_SUN':
                return require('@assets/images/currency/TRX_SUN.png')
            case 'TRX_SUN_NEW':
                return require('@assets/images/currency/TRX_SUN_NEW.png')
            case 'ETH_SOUL':
                return require('@assets/images/currency/ethSOUL.png')
            case 'ETH_HUOBI':
                return require('@assets/images/currency/ETH_HUOBI.png')
            case 'ETH_BTC':
                return require('@assets/images/currency/ETH_BTC.png')
            case 'ETH_1INCH':
                return require('@assets/images/currency/ETH_1INCH.png')
            case 'ETH_SUSHI':
                return require('@assets/images/currency/ETH_SUSHI.png')
            case 'ETH_BADGER':
                return require('@assets/images/currency/ETH_BADGER.png')
            case 'ETH_CRV':
                return require('@assets/images/currency/ETH_CRV.png')
            case 'ETH_BAT':
            case 'BNB_SMART_BAT':
                return require('@assets/images/currency/BAT.png')
            case 'BNB_SMART_CAKE':
                return require('@assets/images/currency/BNB_SMART_CAKE.png')
            case 'FIO':
                return require('@assets/images/currency/fio.png')
            case 'ETH_NEXO':
            case 'BNB_SMART_NEXO':
                return require('@assets/images/currency/ETH_NEXO.png')
            case 'ETH_SHIB':
            case 'BNB_SMART_SHIB':
                return require('@assets/images/currency/ETH_SHIB.png')
            case 'VTHO':
                return require('@assets/images/currency/VTHO.png')
            case 'SOL_TULIP':
                return require('@assets/images/currency/SOL_TULIP.png')
            case 'SOL_MEDIA':
                return require('@assets/images/currency/SOL_MEDIA_color.png')
            case 'SOL_MNGO':
                return require('@assets/images/currency/SOL_MNGO_color.png')
            case 'SOL_RAY':
                return require('@assets/images/currency/SOL_RAY.png')
            case 'SOL_SLIM':
                return require('@assets/images/currency/SOL_SLIM.png')
            case 'SOL_STEP':
                return require('@assets/images/currency/SOL_STEP.png')
            case 'SOL_NXMC' :
                return require('@asset/images/currency/SOL_NXMC.png')
            case 'NXMC' :
                return require('@asset/images/currency/NXMC.png')
            case 'ASH':
                return require('@assets/images/currency/ASH.png')

            default:
                return null
        }
    }

    renderIcon = () => {

        const { currencyCode, containerStyle, markStyle, iconStyle, setBackground } = this.props

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

        const block = this.getBlockchain(currencyCode) || 'BTC'

        if (setBackground && currencyCode) {
            tmpContainerStyle.backgroundColor = colorDict[currencyCode]?.colors[isLight ? 'mainColor' : 'darkColor'] + '1A'
        }

        switch (currencyCode) {

            //  img
            case 'ETH_UAX':
            case 'ETH_SOUL':
            case 'ETH_1INCH':
            case 'ETH_SUSHI':
            case 'ETH_BADGER':
            case 'ETH_CRV':
            case 'ETH_BAT':
            case 'BNB_SMART_BAT':
            case 'BNB_SMART_CAKE':
            case 'ETH_NEXO':
            case 'BNB_SMART_NEXO':
            case 'SOL_TULIP':
            case 'SOL_MEDIA':
            case 'SOL_MNGO':
            case 'SOL_RAY':
            case 'SOL_SLIM':
            case 'SOL_STEP':
            case 'SOL_NXMC':
            case 'ETH_OKB':
                return (
                    <View style={{ ...styles.icon, borderColor: colorDict[currencyCode].colors[isLight ? 'mainColor' : 'darkColor'], ...tmpContainerStyle }}>
                        <View style={styles.icon__item}>
                            <Image style={{ width: fontSize, height: fontSize }} resize={'stretch'} source={this.getImgPath(currencyCode)} />
                            <View style={{ ...styles.icon__mark, backgroundColor: colors.common.iconMarkBg, ...tmpMarkStyle }}>
                                <CustomIcon name={block} style={{ color: colorDict[block].colors[isLight ? 'mainColor' : 'darkColor'] }} size={14} />
                            </View>
                        </View>
                    </View>
                )

            case 'ETH_SHIB':
            case 'BNB_SMART_SHIB':
                return (
                    <View style={{ ...styles.icon, borderColor: colorDict['ETH_SHIB'].colors[isLight ? 'mainColor' : 'darkColor'], ...tmpContainerStyle }}>
                        <View style={styles.icon__item}>
                            <Image style={{ width: fontSize, height: fontSize }} resize={'stretch'} source={this.getImgPath(currencyCode)} />
                            <View style={{ ...styles.icon__mark, backgroundColor: colors.common.iconMarkBg, ...tmpMarkStyle }}>
                                <CustomIcon name={block} style={{ color: colorDict[block].colors[isLight ? 'mainColor' : 'darkColor'] }} size={14} />
                            </View>
                        </View>
                    </View>
                )

            case 'XMR':
            case 'FIO':
            case 'VTHO':
                return (
                    <View style={{ ...styles.icon, borderColor: colorDict[currencyCode].colors[isLight ? 'mainColor' : 'darkColor'], ...tmpContainerStyle }}>
                        <View style={styles.icon__item}>
                            <Image style={{ width: fontSize, height: fontSize }} resize={'stretch'} source={this.getImgPath(currencyCode)} />
                        </View>
                    </View>
                )
            case 'ASH':
                return (
                    <View style={{ ...styles.icon, borderColor: colorDict[currencyCode].colors[isLight ? 'mainColor' : 'darkColor'], ...tmpContainerStyle }}>
                        <View style={styles.icon__item}>
                            <Image style={{ width: 26, height: 26 }} resize='stretch' source={this.getImgPath(currencyCode)} />
                        </View>
                    </View>
                )

            case 'TRX_SUN':
            case 'TRX_SUN_NEW':
            case 'ETH_HUOBI':
            case 'ETH_BTC':
                return (
                    <View style={{ ...styles.icon, borderColor: colorDict[currencyCode].colors[isLight ? 'mainColor' : 'darkColor'], ...tmpContainerStyle }}>
                        <View style={styles.icon__item}>
                            <Image style={{ width: fontSize, height: fontSize }} resize={'stretch'} source={this.getImgPath(currencyCode)} />
                            <View style={{ ...styles.icon__mark, backgroundColor: colors.common.iconMarkBg, ...tmpMarkStyle }}>
                                <View style={{ marginTop: 1 }}>
                                    <CustomIcon name={block} style={{ color: colorDict[block].colors[isLight ? 'mainColor' : 'darkColor'] }} size={14} />
                                </View>
                            </View>
                        </View>
                    </View>
                )

            // fonts
            case 'TRX_JST':
            case 'TRX_USDJ':
            case 'TRX_APE':
            case 'TRX_EXON':
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
                                        <CustomIcon name={block} style={{ color: colorDict[block].colors[isLight ? 'mainColor' : 'darkColor'] }} size={14} />
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
                                        <CustomIcon name={block} style={{ color: colorDict[block].colors[isLight ? 'mainColor' : 'darkColor'] }} size={14} />
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
                                        <CustomIcon name={block} style={{ color: colorDict[block].colors[isLight ? 'mainColor' : 'darkColor'] }} size={14} />
                                    </View>
                                </View>}
                        </View>
                    </View>
                )

            case 'ETH_ROPSTEN':
                return (
                    <View style={{ ...styles.icon, borderColor: colorDict[currencyCode].colors[isLight ? 'mainColor' : 'darkColor'], ...tmpContainerStyle }}>
                        <View style={styles.icon__item}>
                            <CustomIcon name='ETH_ROPSTEN' style={{ color: colorDict[currencyCode].colors[isLight ? 'mainColor' : 'darkColor'], fontSize: fontSize }} />
                        </View>
                    </View>
                )

            case 'XVG':
            case 'BCH':
            case 'BSV':
            case 'XRP':
            case 'XLM':
            case 'BNB_SMART':
            case 'ETC':
            case 'VET':
            case 'SOL':
            case 'AMB':
            case 'OPTIMISM':
            case 'TON':
            case 'WAVES':
            case 'ETH_RINKEBY':
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
                                        <CustomIcon name={block} style={{ color: colorDict[block].colors[isLight ? 'mainColor' : 'darkColor'] }} size={14} />
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
                                        <CustomIcon name={block} style={{ color: colorDict[block].colors[isLight ? 'mainColor' : 'darkColor'] }} size={14} />
                                    </View>
                                </View>}
                        </View>
                    </View>
                )

            case 'ETH':
            case 'TRX_ETH':
            case 'BNB_SMART_ETH':
            case 'MATIC_ETH':
                return (
                    <View style={{ ...styles.icon, borderColor: colorDict[currencyCode].colors[isLight ? 'mainColor' : 'darkColor'], ...tmpContainerStyle }}>
                        <View style={styles.icon__item}>
                            <CustomIcon name="ETH" style={{ color: colorDict['ETH'].colors[isLight ? 'mainColor' : 'darkColor'] }} size={fontSize} />
                            {currencyCode !== 'ETH' &&
                                <View style={{ ...styles.icon__mark, backgroundColor: colors.common.iconMarkBg, ...tmpMarkStyle }}>
                                    <View style={{ marginTop: 1 }}>
                                        <CustomIcon name={block} style={{ color: colorDict[block].colors[isLight ? 'mainColor' : 'darkColor'] }} size={14} />
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
                                        <CustomIcon name={block} style={{ color: colorDict[block].colors[isLight ? 'mainColor' : 'darkColor'] }} size={14} />
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
            case 'SOL_USDT':
            case 'MATIC_USDT':
                return (
                    <View style={{ ...styles.icon, borderColor: colorDict[currencyCode].colors[isLight ? 'mainColor' : 'darkColor'], ...tmpContainerStyle }}>
                        <View style={styles.icon__item}>
                            <CustomIcon name="USDT" style={{ color: colorDict[currencyCode].colors[isLight ? 'mainColor' : 'darkColor'], fontSize: fontSize }} />
                            <View style={{ ...styles.icon__mark, backgroundColor: colors.common.iconMarkBg, ...tmpMarkStyle }}>
                                <CustomIcon name={block}
                                    style={{ color: colorDict[block].colors[isLight ? 'mainColor' : 'darkColor'] }} size={14} />
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
                                <CustomIcon name={block} style={{ color: colorDict[block].colors[isLight ? 'mainColor' : 'darkColor'] }} size={14} />
                            </View>
                        </View>
                    </View>
                )

            case 'ETH_USDC':
            case 'TRX_USDC':
            case 'SOL_USDC':
            case 'MATIC_USDC':
                return (
                    <View style={{ ...styles.icon, borderColor: colorDict['ETH_USDC'].colors[isLight ? 'mainColor' : 'darkColor'], ...tmpContainerStyle }}>
                        <View style={styles.icon__item}>
                            <CustomIcon name={'ETH_USDC'} style={{ color: colorDict['ETH_USDC'].colors[isLight ? 'mainColor' : 'darkColor'], fontSize: fontSize }} />
                            <View style={{ ...styles.icon__mark, backgroundColor: colors.common.iconMarkBg, ...tmpMarkStyle }}>
                                <CustomIcon name={block} style={{ color: colorDict[block].colors[isLight ? 'mainColor' : 'darkColor'] }} size={14} />
                            </View>
                        </View>
                    </View>
                )

            case 'ETH_BNB':
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
            case 'ETH_ZRX':
            case 'ETH_SNX':
            case 'ETH_ENJ':
            case 'ETH_GRT':
            case 'ETH_NOW':
            case 'ETH_ONE':
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

            case 'ETH_AAVE':
            case 'MATIC_AAVE':
                return (
                    <View style={{ ...styles.icon, borderColor: colorDict[currencyCode].colors[isLight ? 'mainColor' : 'darkColor'], ...tmpContainerStyle }}>
                        <View style={styles.icon__item}>
                            <CustomIcon name={'ETH_AAVE'} style={{ color: colorDict[currencyCode].colors[isLight ? 'mainColor' : 'darkColor'], fontSize: fontSize }} />
                            <View style={{ ...styles.icon__mark, backgroundColor: colors.common.iconMarkBg, ...tmpMarkStyle }}>
                                <CustomIcon name={block} size={14} color={colorDict[block].colors[isLight ? 'mainColor' : 'darkColor']} />
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

            case 'ETH_MATIC':
            case 'MATIC':
            case 'MATIC_WMATIC':
                return (
                    <View style={{ ...styles.icon, borderColor: colorDict[currencyCode].colors[isLight ? 'mainColor' : 'darkColor'], ...tmpContainerStyle }}>
                        <View style={styles.icon__item}>
                            <CustomIcon name={'ETH_MATIC'} style={{ color: colorDict[currencyCode].colors[isLight ? 'mainColor' : 'darkColor'], fontSize: fontSize }} />
                            {currencyCode !== 'MATIC' &&
                                <View style={{ ...styles.icon__mark, backgroundColor: colors.common.iconMarkBg, ...tmpMarkStyle }}>
                                    <View style={{ marginTop: 1 }}>
                                        <CustomIcon name={block} style={{ color: colorDict[block].colors[isLight ? 'mainColor' : 'darkColor'] }} size={14} />
                                    </View>
                                </View>}
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
                                <CustomIcon name={block} size={14} color={colorDict[block].colors[isLight ? 'mainColor' : 'darkColor']} />
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
                                <CustomIcon name={block} size={14} color={colorDict[block].colors[isLight ? 'mainColor' : 'darkColor']} />
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
                                <CustomIcon name={block} size={14} color={colorDict[block].colors[isLight ? 'mainColor' : 'darkColor']} />
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
                                <CustomIcon name={block} size={14} color={colorDict[block].colors[isLight ? 'mainColor' : 'darkColor']} />
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
                                <CustomIcon name={block} size={14} color={colorDict[block].colors[isLight ? 'mainColor' : 'darkColor']} />
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
                                <CustomIcon name={block} size={14} color={colorDict[block].colors[isLight ? 'mainColor' : 'darkColor']} />
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

            case 'SOL_COPE':
            case 'SOL_FIDA':
            case 'SOL_KIN':
            case 'SOL_MAPS':
            case 'SOL_MER':
            case 'SOL_ORCA':
            case 'SOL_OXY':
            case 'SOL_PAI':
            case 'SOL_SBR':
            case 'SOL_SRM':
            case 'SOL_SNY':
                return (
                    <View style={{ ...styles.icon, borderColor: colorDict[currencyCode].colors[isLight ? 'mainColor' : 'darkColor'], ...tmpContainerStyle }}>
                        <View style={styles.icon__item}>
                            <CustomIcon name={currencyCode} style={{ color: colorDict[currencyCode].colors[isLight ? 'mainColor' : 'darkColor'], fontSize: fontSize }} />
                            <View style={{ ...styles.icon__mark, backgroundColor: colors.common.iconMarkBg, ...tmpMarkStyle }}>
                                <CustomIcon name='SOL' size={14} color={colorDict['SOL'].colors[isLight ? 'mainColor' : 'darkColor']} />
                            </View>
                        </View>
                    </View>
                )

            case 'NFT_ETH':
            case 'NFT':
                return (
                    <View style={{ ...styles.icon, borderColor: colorDict[currencyCode].colors[isLight ? 'mainColor' : 'darkColor'], ...tmpContainerStyle }}>
                        <View style={styles.icon__item}>
                            <CustomIcon name='nft' style={{ color: colorDict[currencyCode].colors[isLight ? 'mainColor' : 'darkColor'], fontSize: fontSize }} />
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
            const blockChain = this.getTokenBlockchain(extend.tokenBlockchain)
            const blockChainColors = extend.tokenBlockchain === 'BNB' ? colorDict['BNB_SMART'] : colorDict[blockChain]
            if (typeof blockChainColors === 'undefined') {
                return (
                    <View style={{ ...styles.icon, borderColor: colorDict['XRP'].colors[isLight ? 'mainColor' : 'darkColor'], ...tmpContainerStyle }}>
                        <View style={styles.icon__item}>
                            <Text style={{ ...styles.icon__item__text, color: colorDict['XRP'].colors[isLight ? 'mainColor' : 'darkColor'] }}>No</Text>
                            <Text style={{ ...styles.icon__item__text, color: colorDict['XRP'].colors[isLight ? 'mainColor' : 'darkColor'] }}>Icon</Text>
                        </View>
                    </View>
                )
            }

            try {
                switch (extend.addressCurrencyCode) {

                    case 'ETH':
                    case 'TRX':
                    case 'SOL':
                        return (
                            <View style={{ ...styles.icon, borderColor: colorDict['XRP'].colors[isLight ? 'mainColor' : 'darkColor'], ...tmpContainerStyle }}>
                                <View style={styles.icon__item}>
                                    <Text style={{ ...styles.icon__item__text, color: colorDict['XRP'].colors[isLight ? 'mainColor' : 'darkColor'] }}>No</Text>
                                    <Text style={{ ...styles.icon__item__text, color: colorDict['XRP'].colors[isLight ? 'mainColor' : 'darkColor'] }}>Icon</Text>
                                </View>
                                <View style={{ ...styles.icon__mark, backgroundColor: colors.common.iconMarkBg, ...tmpMarkStyle }}>
                                    <CustomIcon name={blockChain} style={{ color: blockChainColors.colors[isLight ? 'mainColor' : 'darkColor'] }} size={14} />
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
            } catch (e) {
                throw new Error(e.message + ' in extend.addressCurrencyCode ' + extend.addressCurrencyCode)
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
        try {
            return this.renderIcon()
        } catch (e) {
            const { currencyCode } = this.props
            throw new Error('CurrencyIcon render error ' + e.message + ' in ' + currencyCode)
        }
    }
}

CurrencyIcon.contextType = ThemeContext

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
