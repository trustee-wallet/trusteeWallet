const diffTimeScan = (timeScan) => {
    const lastScan = timeScan  * 1000
    const timeNow = new Date().getTime()

    const diffTime = (timeNow - lastScan) / 60000

    return Math.abs(Math.round(diffTime))
}

export {
    diffTimeScan
}
