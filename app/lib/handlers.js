/*
 *
 * Request handlers
 * 
 */

// Dependencies
const _data = require('./data');
const helpers = require('./helpers');
const config = require('./config')

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
handlers._users.get = (data, callback) => {
  //Chack that the phone number is valid
  const phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
  if(phone) {
    //Get the token from the headers
    const token = typeof(data.headers.token) == 'string' ? data.headers.token : false
    
    handlers._tokens.verifyToken(token, phone, (tokenIsValid) => {
      if(tokenIsValid) {
         // Lookup the user
        _data.read('users', phone, (err, data) => {
          if(!err && data) {
            //Remove the hashed password from the user object before returning it to the response
            delete data.hashPassword;
            callback(200, data)
          } else {
            callback(404, {})
          }
        });
      } else {
        callback(403, {'error': 'Missing required token or token is invalid'})
      }
    });
    
   
  } else {
    callback(400, {'error' : 'Missing required field'})
  }
}
//Users put
// Required data: phone
//Optional data: firstName, lastName, password (at least one must be specified)
handlers._users.put = (data, callback) => {
  //Check for required field
  const phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length === 10 ? data.payload.phone.trim() : false;

  //Check for the optional fields
  const firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
  const lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
  const password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

  //Error if phone is invalid
  if(phone) {

    //Error if nothing is sent to update
    if(firstName || lastName || password) {
      const token = typeof(data.headers.token) == 'string' ? data.headers.token : false
    
      handlers._tokens.verifyToken(token, phone, (tokenIsValid) => {
        if(tokenIsValid) {
          _data.read('users', phone, (err, userData) => {
            if(!err && userData) {
              //Update the field necessary
              if(firstName) {
                userData.firstName = firstName
              }
              if(lastName) {
                userData.lastName = lastName
              }
              if(password) {
                userData.hashPassword = helpers.hash(password)
              }
    
              //Store the new updates
              _data.update('users', phone, userData, (err) => {
                if(!err) {
                  callback(200, {})
                } else {
                  console.log(err)
                  callback(500, {'Error': 'Could not update the user'})
                }
              });
            } else {
              callback(400, {'Error': 'The specified user does not exist'})
            }
          });
        } else {
          callback(403, {'error': 'Missing required token or token is invalid'})
        }
      });
      
    } else {
      callback(400, {'Error' : 'Missing fields to update'})
    }
  }else {
    callback(400, {'Error' : 'Missing required fields'})
  }
}
//Users delete
// Required data : phone
// Optional data : none
//@TODO Only let an authenticated user delete their object. Dont let them delete anyone else's
//@TODO Cleanup (delete) any other data files associated with this user
handlers._users.delete = (data, callback) => {
  //Check that the phone number is valid
  const phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
  if(phone) {

    const token = typeof(data.headers.token) == 'string' ? data.headers.token : false
    
      handlers._tokens.verifyToken(token, phone, (tokenIsValid) => {
        if(tokenIsValid) {
          _data.read('users', phone, (err, data) => {
            if(!err && data) {
              
              _data.delete('users', phone, (err) => {
                if(!err) {
                  callback(200, {});
      
                }else {
                  callback(500, {'errror' : 'Could not delete the specified user'})
                }
              });
            } else {
              callback(400, {'error': 'could not find the specified user'})
            }
          });
        } else {
          callback(403, {'error': 'Missing required token or token is invalid'})
        }
      })
    // Lookup the user
    
  } else {
    callback(400, {'error' : 'Missing required field'})
  }

};

//Tokens
handlers.tokens = (data, callback) => {
  const acceptableMethods = ['post', 'get', 'put', 'delete'];
  if(acceptableMethods.indexOf(data.method) > -1) {
    handlers._tokens[data.method](data, callback);
  } else {
    callback(405)
  }
};

// Container for all the tokens methods
handlers._tokens = {};

//Tokens - post
//Required data: phone, password
//Optional data : none
handlers._tokens.post = (data, callback) => {
  const phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length === 10 ? data.payload.phone.trim() : false;
  const password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
  if(phone && password) {
    //Lookup the user who matches that phone number
    _data.read('users', phone, (err, userData)=> {
      if(!err && userData) {
        //Hash password, and compare it to the password stored in the object user
        const hashPassword = helpers.hash(password);
        if(hashPassword === userData.hashPassword) {
          //If valid, create a new token with a random name. Set expiration date 1 hour in future
          const tokenId = helpers.createRandomString(20);
          const expires = Date.now() + 1000 * 60 * 60;
          const tokenObject = {
            phone,
            'id' : tokenId,
            expires
          }
          //Store the tolen
          _data.create('tokens', tokenId, tokenObject, (err) => {
            if(!err){
              callback(200, tokenObject)
            }else{
              callback(500, 'Could create the new token')
            }
          });
        } else {
          callback(400, {'error' : 'Password did match the specified user'})
        }
      }else {
        callback(400, {'Error' : 'Could not find the specified user'})
      }
    })
  } else {
    callback(400, {'error': 'Missing required fields'})
  }
}
//Tokens - get
//Require data : id
//Optional data: none
handlers._tokens.get = (data, callback) => {
  const id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
  if(id) {
    // Lookup the user
    _data.read('tokens', id, (err, tokenData) => {
      if(!err && tokenData) {
        //Remove the hashed password from the user object before returning it to the response
        delete data.hashPassword;
        callback(200, tokenData)
      } else {
        callback(404, {})
      }
    })
  } else {
    callback(400, {'error' : 'Missing required field'})
  }
}
//Tokens - put
//Required data: id, extend
//Optional data: none
handlers._tokens.put = (data, callback) => {
  const id = typeof(data.payload.id) == 'string' && data.payload.id.trim().length === 20 ? data.payload.id.trim() : false;
  const extend = typeof(data.payload.extend) == 'boolean' && data.payload.extend === true ? true : false;
  if(id && extend) {
    _data.read('tokens', id, (err, tokenData) => {
      if(!err && tokenData) {
        //Check to the make sure the token isnt already expired
        if(tokenData.expires > Date.now()) {
          //Set the expiration an hour from now
          tokenData.expires = Date.now() + 1000 *60 * 60;
          //Store the new updates
          _data.update('tokens', id, tokenData, (err) => {
            if(!err) {
              callback(200, {});

            }else {
              callback(500, {'error' : `Could not update the token's expiration`})
            }
          });
        } else {
          callback(400, {'error' : 'The token has already expired, and cannot be extended'})
        }
      } else {
        callback(400, {'error' : 'specified token does not exist'})
      }
    });
  } else {
    callback(400, {'error' : 'missing requires field(s) ot invalid'})
  }
}
//Tokens - delete
//Required data: id
//Optional data : none
handlers._tokens.delete = (data, callback) => {
  const id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
  if(id) {
    // Lookup the user
    _data.read('tokens', id, (err, data) => {
      if(!err && data) {
        
        _data.delete('tokens', id, (err) => {
          if(!err) {
            callback(200, {});

          }else {
            callback(500, {'errror' : 'Could not delete the specified id'})
          }
        });
      } else {
        callback(400, {'error': 'could not find the specified id'})
      }
    });
  } else {
    callback(400, {'error' : 'Missing required field'})
  }
};

//Verify if a given token id is currently valid for a given user
handlers._tokens.verifyToken = (id, phone, callback) => {
  //Lookup the token
  _data.read('tokens', id, (err, tokenData) => {
    if(!err && tokenData) {
      //Check that the token is for the given user and has not expired
      if(tokenData.phone === phone && tokenData.expires > Date.now()) {
        callback(true)
      } else {
        callback(false)
      }
    } else {
      callback(false)
    }
  });
};

//Checks
handlers.checks = (data, callback) => {
  const acceptableMethods = ['post', 'get', 'put', 'delete'];
  if(acceptableMethods.indexOf(data.method) > -1) {
    handlers._checks[data.method](data, callback);
  } else {
    callback(405)
  }
};

//Container for all checks methods

handlers._checks = {};

//Checks - post
//Required data : protocol, url, method, successCodes, timoutSeconds
//Optional data : none

handlers._checks.post = (data, callback) => {
  //Validate inputs
  const protocol = typeof(data.payload.protocol) == 'string' && ['https', 'http'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol : false;
  const url = typeof(data.payload.url) == 'string' && data.payload.url.trim().length > 0 ? data.payload.url.trim() : false;
  const method = typeof(data.payload.method) == 'string' && ['post', 'get', 'put', 'delete'].indexOf(data.payload.method) > -1 ? data.payload.method : false;
  const successCodes = typeof(data.payload.successCodes) == 'object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0 ? data.payload.successCodes : false;
  const timeoutSeconds = typeof(data.payload.timeoutSeconds) == 'number' && data.payload.timeoutSeconds % 1 === 0 && data.payload.timeoutSeconds >= 1 && data.payload.timeoutSeconds <= 5 ? data.payload.timeoutSeconds : false;
  
  if (protocol && url && method && successCodes && timeoutSeconds) {
    //Get the token from the headers
    const token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

    //Lookup the user by reading the token
    _data.read('tokens', token, (err, tokenData) => {
      if(!err && tokenData) {
        const userPhone = tokenData.phone;

        _data.read('users', userPhone, (err, userData) => {
          if(!err && userData) {
            const userChecks = typeof(userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : [];
            //Verify that the user has less than the number of max-checks-per-user
            if(userChecks.length < config.maxChecks) {
              //Create a random id for the check
              const checkId = helpers.createRandomString(20);

              //Create the check object and include the user's object
              const checkObject = {
                'id' : checkId,
                userPhone,
                protocol,
                url,
                method,
                successCodes,
                timeoutSeconds
              }
              _data.create('checks', checkId, checkObject, (err) => {
                if(!err) {
                  //Add the check id to the user object
                  userData.checks = userChecks;
                  userData.checks.push(checkId);

                  // Save the new user data
                  _data.update('users', userPhone, userData, (err) => {
                    if(!err) {
                      callback(200, checkObject)
                    } else {
                      callback(500, {'Error' : 'Could not update the user with the new check'})
                    }
                  });
                } else {
                  callback(500, {'error' : 'Could not create a new check'})
                }
              });
            } else {
              callback(400, {'Error' : 'The user already has the maximum number of checks (' + config.maxChecks +')'})
            }
          } else {
            callback(403, {});
          }
        });
      } else {
        callback(403, {})
      }
    })
  } else {
    callback(400, {'Error' : 'Missing required inputs, or inputs are invalid'})
  }

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