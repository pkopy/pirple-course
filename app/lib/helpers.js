/*
 *
 * Helper for the various tasks
 * 
 */

//Dependecies
const crypto = require('crypto');
const config = require('./config')

//Container for the all helpers

const helpers = {};

// Create a SHA256 hash
helpers.hash = (str) => {
  if(typeof(str) == 'string' && str.length > 0) {
    const hash = crypto.createHmac('sha256', config.hashingSecret).update(str).digest('hex');
    return hash
  } else {
    return false
  }
};

//Parse a JSON string to an object in all cases, without throwing
helpers.parseJsonToObject = (str) => {
  try {
    const obj = JSON.parse(str);
    return obj;
  }catch (e) {
    return {}
  }
}

//Create a string of random alphanumeric characters, of a given length
helpers.createRandomString = (strLength) => {
  strLength = typeof(strLength) == 'number' && strLength > 0 ? strLength : false;
  if(strLength) {
    //Define all posaible character that could go to the string
    const posaibleCharacters = 'abcdefghijklmnoprstquwyz0123456789';
    //Start the final string

    let str = '';
    for(i = 1; i <= strLength; i++) {
      const randomCharacter = posaibleCharacters.charAt(Math.floor(Math.random() * posaibleCharacters.length));
      str += randomCharacter;
    }
    return str;
  }
};

// Export the module
module.exports = helpers