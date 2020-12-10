/**
 * @version 0.9
 * @param {number, precision}
 * @returns {number}
 */

class UtilsService {
    roundNumber = (number, precision) => {
        const round = Math.pow(10, precision);
        return Math.round(number * round) / round;
    }

    cutNumber = (number, precision) => {
        const round = Math.pow(10, precision);
        return Math.floor(number * round) / round;
    }

    roundUpNumber = (number, precision) => {
        const round = Math.pow(10, precision);
        return Math.ceil(number * round) / round;
    }

    getPercent = (number, percent) => {
        const mul = percent / 100;
        return number * mul;
    }
};

export default new UtilsService();
