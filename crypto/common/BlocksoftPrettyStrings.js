class BlocksoftPrettyStrings {

    makeCut(str, size = 5, sizeEnd = false) {
        if (!str) return str

        const ln = str.length
        if (!sizeEnd || sizeEnd == 0) {
            sizeEnd = size
        }
        if (ln < size + sizeEnd + 3) return str
        return str.substring(0, size) + '...' + str.substring(ln - sizeEnd)
    }
}

export default new BlocksoftPrettyStrings()
