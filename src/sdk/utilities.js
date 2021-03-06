/**
 * Build human readable list
 *
 * @param {Array} array
 * @returns {String}
 */
function buildList (array) {
  if (!array.length) {
    return ''
  }

  if (array.length === 1) {
    return array[0]
  }

  const lastIndex = array.length - 1
  const firstPart = array.slice(0, lastIndex).join(', ')

  return `${firstPart} and ${array[lastIndex]}`
}

/**
 * Check if object is empty
 *
 * @param {Object} obj
 * @returns {boolean}
 */
function isEmpty (obj) {
  return !Object.keys(obj).length && obj.constructor === Object
}

/**
 * Check if value is object
 *
 * @param {Object} obj
 * @returns {boolean}
 */
function isObject (obj) {
  return typeof obj === 'object' && obj !== null && !(obj instanceof Array)
}

/**
 * Check if string is valid json
 *
 * @param {string} string
 * @returns {boolean}
 * @private
 */
function isValidJson (string) {
  try {
    const json = JSON.parse(string)
    return isObject(json)
  } catch (e) {
    return false
  }
}

/**
 * Find index of an element in the list and return it
 *
 * @param {Array} array
 * @param {string|Array} key
 * @param {*} value
 * @returns {Number}
 */
function findIndex (array, key, value) {

  function isEqual (item) {
    return (key instanceof Array)
      ? key.every(k => item[k] === value[k])
      : (item[key] === value)
  }

  for (let i = 0; i < array.length; i += 1) {
    if (isEqual(array[i])) {
      return i
    }
  }

  return -1
}

/**
 * Convert array with key/value item structure into key/value pairs object
 *
 * @param {Array} array
 * @return {Array} array
 */
function convertToMap (array = []) {
  return array.reduce((acc, o) => ({...acc, [o.key]: o.value}), {})
}

/**
 * Find intersecting values of provided array against given values
 *
 * @param {Array} array
 * @param {Array} values
 * @returns {Array}
 */
function intersection (array = [], values = []) {
  return array.filter(item => values.indexOf(item) !== -1)
}

/**
 * Check if particular url is a certain request
 *
 * @param {string} url
 * @param {string} requestName
 * @returns {boolean}
 */
function isRequest (url, requestName) {
  const regex = new RegExp(`\\/${requestName}(\\/.*|\\?.*){0,1}$`)
  return regex.test(url)
}

/**
 * Extract the host name for the url
 *
 * @param url
 * @returns {string}
 */
function getHostName (url = '') {
  return url.replace(/^(http(s)*:\/\/)*(www\.)*/, '').split('/')[0].split('?')[0]
}

/**
 * Transform array entry into object key:value pair entry
 *
 * @param {Object} acc
 * @param {string} key
 * @param {string} value
 * @returns {Object}
 */
function reducer (acc, [key, value]) {
  return {...acc, [key]: value}
}

/**
 * Extract enumerable properties in requested format from the object
 * or use built-in if available
 *
 * @param {Object} object
 * @param {string} what
 * @returns {Array}
 * @private
 */
function _objectExtract (object = {}, what) {
  const extractMap = {
    entries: key => [key, object[key]],
    values: key => object[key]
  }

  return Object[what]
    ? Object[what](object)
    : Object.keys(object).map(extractMap[what])
}

/**
 * Extracts object entries in the [key, value] format
 *
 * @param {Object} object
 * @returns {Array}
 */
function entries (object) {
  return _objectExtract(object, 'entries')
}

/**
 * Extracts object values
 *
 * @param {Object} object
 * @returns {Array}
 */
function values (object) {
  return _objectExtract(object, 'values')
}

/**
 * Check if value is empty in any way (empty object, false value, zero) and use it as predicate method
 *
 * @param {*} value
 * @returns {boolean}
 */
function isEmptyEntry (value) {
  if (isObject(value)) {
    return !isEmpty(value)
  }

  return !!value || (value === 0)
}

export {
  buildList,
  isEmpty,
  isObject,
  isValidJson,
  findIndex,
  convertToMap,
  intersection,
  isRequest,
  getHostName,
  reducer,
  entries,
  values,
  isEmptyEntry
}
