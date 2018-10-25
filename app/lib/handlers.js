/*
 *
 * Request handlers
 * 
 */

// Dependencies
const _data = require('./data');
const helpers = require('./helpers')

//Define handlers
let handlers = {}

handlers.users = (data, callback) => {
  const acceptableMethods = ['post', 'get', 'put', 'delete'];
  if(acceptableMethods.indexOf(data.method) > -1) {
    handlers._users[data.method](data, callback);
  } else {
    callback(405)
  }
};

//Container for the users submethods
handlers._users = {};

//Users post
// Required data: firstName, lastName, phone, password, tosAgreement
// Optional data: none
handlers._users.post = (data, callback) => {
  //Check that all requires fields are filled
  const firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
  const lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
  const phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length === 10 ? data.payload.phone.trim() : false;
  const password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
  const tosAgreement = typeof(data.payload.tosAgreement) == 'boolean' && data.payload.tosAgreement == true ? true : false;

  if(firstName && lastName && phone && password && tosAgreement) {
    // make sure that the user dosent already exist
    _data.read('users', phone, (err, data) => {
      if(err) {
        // Hash the password
        const hashPassword = helpers.hash(password);
        if(hashPassword) {
          //Create the user object
          const userObject = {
            firstName,
            lastName,
            phone,
            hashPassword,
            tosAgreement : true
          }

          //store the user
          _data.create('users', phone, userObject, (err) => {
            if(!err) {
              callback(200, {})
            } else {
              console.log(err)
              callback(500, {'error' : 'Could not create a new user'})
            }
          });
        } else {
          callback(500, {'error' : `Could not hash a user's password`})
        }
        
      } else {
        // User already exist
        callback(400, {'Error' : 'A user with that phone number already exist'})
      }

    });
  } else {
    callback(400, {'Error': 'Missing required fields'})
  }
}

//Users get
//Required data: phone
//Optional data: noen
//@TODO Only let an authenticated user access their object. Don't let them access anyone else
handlers._users.get = (data, callback) => {
  //Chack that the phone number is valid
  const phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
  if(phone) {
    // Lookup the user
    _data.read('users', phone, (err, data) => {
      if(!err && data) {
        //Remove the hashed password from the user object before returning it to the response
        delete data.hashPassword;
        callback(200, data)
      } else {
        callback(404, {})
      }
    })
  } else {
    callback(400, {'error' : 'Missing required field'})
  }
}
//Users put
handlers._users.put = (data, callback) => {

}
//Users delete
handlers._users.delete = (data, callback) => {

}




handlers.sample = (data, callback) => {
//Callback a http status code, and a payload object
    callback(406, {'name':'sample handler'})
}

handlers.ping = (data, callback) => {
    callback(200)
}


handlers.notFound = (data, callback) => {
    callback(404);
}

//Export module
module.exports = handlers;