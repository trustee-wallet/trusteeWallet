const INITIAL_STATE = {
    tipsStates: {
        homeScreen: {
            sellBuyBtn: true
        },
    },
}

const toolTips = (state = INITIAL_STATE, action) => {
    const tmpState = JSON.parse(JSON.stringify(state))

    switch(action.type){
        case 'HOME_SCREEN_BUY_SELL_BTN_TIP':
            tmpState.tipsStates.homeScreen.sellBuyBtn = false
            return new Object({
                tipsStates: tmpState.tipsStates
            })
    }

    return state
}

export default toolTips