/**
 * @version 0.43
 * @author yura
 */

import React, { useState } from 'react'
import { useTheme } from '@app/theme/ThemeProvider'
import { View, SafeAreaView } from 'react-native'
import { KeyboardAwareView } from 'react-native-keyboard-aware-view'

import Header from '@app/components/elements/new/Header'

const ScreenWrapper = (props) => {

    const [height, setHeight] = useState(0)

    const setHeaderHeight = (height) => {
        const headerHeight = Math.round(height || 0);
        setHeight(headerHeight)
    }

    const { colors } = useTheme()
    const {
        title,
        titleAction,
        titleIconType,
        rightAction,
        rightType,
        leftType,
        leftAction,
        leftParams,
        rightParams,
        ExtraView,
        ExtraViewParams,
        withoutSafeArea,
        searchQuery,
        onSearch,
        search,
        withMarginTop
    } = props

    return (
        <View style={{ flex: 1, backgroundColor: colors.common.background }}>
            <Header
                title={title}
                titleAction={titleAction}
                titleIconType={titleIconType}
                leftType={leftType}
                leftAction={leftAction}
                leftParams={leftParams}
                rightType={rightType}
                rightAction={rightAction}
                rightParams={rightParams}
                ExtraView={ExtraView}
                ExtraViewParams={ExtraViewParams}
                setHeaderHeight={setHeaderHeight}
                searchQuery={searchQuery}
                onSearch={onSearch}
                search={search}
            />
            <KeyboardAwareView>
                {withoutSafeArea ?
                    props.children
                    :
                    withMarginTop ?
                        <>
                            <View style={{ marginTop: height }} />
                            {props.children}
                        </>
                        :
                        <SafeAreaView style={{
                            flex: 1,
                            backgroundColor: colors.common.background,
                            marginTop: height
                            ,
                        }}>
                            {props.children}
                        </SafeAreaView>
                }
            </KeyboardAwareView>
        </View>
    )
}

export default ScreenWrapper
