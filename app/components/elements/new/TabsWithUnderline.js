/**
 * @version 0.30
 * @author Vadym
 */
 import React from 'react'
 import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity
 } from 'react-native'
 import { useTheme } from '@app/theme/ThemeProvider'
 import { HIT_SLOP } from '@app/theme/HitSlop'
 
 
 export default function Tabs(props) {
    const {
       tabs,
       changeTab,
       containerStyle,
       tabStyle,
       active
    } = props

    const {
        colors,
        GRID_SIZE
     } = useTheme()


    return (
       <View style={[styles.container, containerStyle]}>
           {tabs.map((tab, index) => {
               const isActiveTab = active === index
               return (
                   <TouchableOpacity
                       style={[styles.tab, tabStyle]}
                       activeOpacity={0.8}
                       disabled={isActiveTab}
                       key={index}
                       onPress={() => changeTab(index)}
                       hitSlop={HIT_SLOP}
                   >
                       <View>
                           <Text style={[styles.title, { color: isActiveTab ? colors.common.text1 : colors.homeScreen.newTabsText }]} numberOfLines={1} >{tab.title}</Text>
                           {tab.hasNewNoties && <View style={[styles.newNotifiesIndicator, { backgroundColor: colors.notifications.newNotiesIndicator }]} />}
                       </View>
                       <View style={[styles.activeTabIndicator, { backgroundColor: isActiveTab ? colors.common.checkbox.bgChecked : colors.common.button.disabledBg, marginTop: GRID_SIZE / 2, height: isActiveTab ? 2 : 1 }]} />
                   </TouchableOpacity>
               )
           })}
       </View>
    )
 }
 
const styles = StyleSheet.create({
    container: {
       flexDirection: 'row',
       paddingTop: 8,
       paddingBottom: 16,
       marginBottom: -7 // negative value because of paddingBottom in ExtraView into Header component
    },
    tab: {
       flex: 1,
       alignItems: 'center',
       justifyContent: 'flex-start',
    },
    title: {
       fontFamily: 'Montserrat-Bold',
       fontSize: 14,
       lineHeight: 18,
       letterSpacing: 1,
       textAlign: 'center',
       textTransform: 'uppercase'
    },
    newNotifiesIndicator: {
       position: 'absolute',
       width: 6,
       height: 6,
       borderRadius: 3,
       top: -3,
       right: -7
    },
    activeTabIndicator: {
       width: '100%'
    }
})
 