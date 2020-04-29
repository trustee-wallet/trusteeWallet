class Delay {
    delayTime = 0

    constructor(delayTime) {
        this.delayTime = delayTime
    }

    start = async () => new Promise(resolve => setTimeout(() => resolve(), this.delayTime))
}

export default Delay