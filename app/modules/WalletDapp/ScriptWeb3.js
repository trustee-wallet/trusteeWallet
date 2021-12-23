export const INJECTEDJAVASCRIPT = `
const meta = document.createElement('meta'); meta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0'); meta.setAttribute('name', 'viewport'); 
document.getElementsByTagName('head')[0].appendChild(meta)
`

export const INJECTEDBEFORE = `
const trustee = {}
window.web3 = trustee
window.ethereum = trustee
`

// here will be code later
/*
const trustee = {
    eth : {
        accounts : [],

    },

    request : (params) => {
        alert('params', params)
    }
}
*/
