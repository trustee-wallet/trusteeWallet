/**
 * @version 0.53
 * @author yura
 */

import React, { useMemo } from 'react'
import { View } from 'react-native'
import { useTheme } from '@app/theme/ThemeProvider'


const CustomBackground = (props) => {

	const { colors } = useTheme()

	const containerStyle = useMemo(
		() => [
			props.style,
			{
				backgroundColor: colors.backDropModal.bg,
				borderTopLeftRadius: 20,
				borderTopRightRadius: 20
			},
		],
		[colors, props.style]
	)

	return <View {...props} style={containerStyle} />
}

export default CustomBackground
