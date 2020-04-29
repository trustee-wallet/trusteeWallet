import Delay from '../../Delay/Delay'

/**
 * @version 0.9
 */
class Update {

    updateTime = 20000
    updateFirstCall = true
    updateEventHandler = () => {}
    updateFunction = () => {}
    updateTimer = {}
    delayFunction = async () => {}

    start = async () => {
        await this.delayFunction()
        this.localDaemon()
    }

    setTime = (updateTime) => {
        this.updateTime = updateTime
        return this
    }

    forceDaemonUpdate = async (params) => {
        if (typeof params === 'undefined') {
            params = {force : true}
        }
        await this.updateFunction(params)
    }

    localDaemon = async () => {
        const {
            updateTime,
            updateFunction,
            updateFirstCall
        } = this

        if(updateFirstCall){
            this.updateFirstCall = false
            await updateFunction({force : false})
        }

        this.updateTimer = setTimeout(async () => {
            await updateFunction({force : false})
            this.localDaemon()
        }, updateTime)
    }

    setUpdateEventHandler = callback => {
        this.updateEventHandler = callback
        return this
    }

    setDelay = (delay) => {
        const delayTmp = new Delay(delay)
        this.delayFunction = delayTmp.start
        return this
    }

}

export default Update
