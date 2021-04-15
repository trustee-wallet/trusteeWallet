/**
 * @version 0.43
 * https://reactnavigation.org/docs/navigating-without-navigation-prop
 */
import * as React from 'react'

export const navigationRef = React.createRef()

export function navigate(name, params) {
    navigationRef.current?.navigate(name, params)
}
export function reset(name, params) {
    navigationRef.current?.reset(name, params)
}

export function goBack() {
    navigationRef.current?.goBack()
}
