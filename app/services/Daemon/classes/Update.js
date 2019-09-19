class Update {

    updateTime = 20000
    updateFirstCall = true
    updateEventHandler = () => {}
    updateFunction = () => {}
    updateTimer = {}
    updateAvailable = false

    start = () => {
        this.localDaemon()
    }

    setTime = (updateTime) => {
        this.updateTime = updateTime
        return this
    }

    forceDaemonUpdate = async () => {
        await this.updateFunction()
        // if(this.updateAvailable) {
        //     clearTimeout(this.updateTimer)
        //     await this.updateFunction()
        //     this.updateAvailable = false
        //     this.updateFirstCall = false
        //     this.setTime(this.updateTime).start()
        // }
    }

    localDaemon = async () => {
        let {
            updateTime,
            updateFunction,
            updateFirstCall
        } = this

        if(updateFirstCall){
            this.updateFirstCall = false
            // this.updateAvailable = false
            await updateFunction()
        }

        this.updateTimer = setTimeout(async () => {
            // this.updateAvailable = false
            await updateFunction()
            // this.updateAvailable = true
            this.localDaemon()
        }, updateTime)
    }

}

export default Update
