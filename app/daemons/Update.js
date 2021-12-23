/**
 * @version 0.11
 */
class Update {

    updateTime = 20000
    updateFunction = () => {}

    _updateFirstCall = true
    _updateTimer = {}

    start = async () => {
        this._localDaemon()
    }

    setTime = (updateTime) => {
        this.updateTime = updateTime
        return this
    }

    forceDaemonUpdate = async (params) => {
        if (typeof params === 'undefined') {
            params = { force: true }
        } else {
            params.force = true
        }
        await this.updateFunction(params)
    }

    _localDaemon = async () => {
        const {
            updateTime,
            updateFunction
        } = this

        if (this._updateFirstCall) {
            this._updateFirstCall = false
            await updateFunction({ force: false })
        }

        this._updateTimer = setTimeout(async () => {
            await updateFunction({ force: false })
            this._localDaemon()
        }, updateTime)
    }
}

export default Update
