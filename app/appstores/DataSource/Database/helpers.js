
/**
 * @param {string} str
 * @return {string}
 */
export function toSnake(str) {
  return str.split(/(?=[A-Z2])/).join('_').toLowerCase();
}

/**
 * @param {Object} updateObj
 * @return {Object}
 */
export function toPreparedObject(updateObj) {
  const preparedObject = {};
  const objectKeys = Object.keys(updateObj);
  if (objectKeys) {
    let objectKey;
    for (objectKey of objectKeys) {
      preparedObject[toSnake(objectKey)] = updateObj[objectKey];
    }
  }
  return preparedObject;
}

/**
 * @param {Object[]} insertArray
 * @return {Object[]}
 */
export function toPreparedObjects(insertArray) {
  const preparedArray = [];
  for (let i = 0, ic = insertArray.length; i < ic; i++) {
    preparedArray[i] = toPreparedObject(insertArray[i]);
  }
  return preparedArray;
}
