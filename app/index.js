/*
 * Primary file for API
 *
 * 
 */

// Dependencies
const http = require('http');
const https = require('https')
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;
const config = require('./config');
const fs = require('fs')

// Instantiate the HTTP server
const httpServer = http.createServer((req, res) => {
    unifiedServer(req, res)

});

//Start the HTTP server

httpServer.listen(config.httpPort, () => 
    console.log("Server listen on port " + config.httpPort + ' in '+ config.envName + ' mode')
)

// Instantiate the HTTPS server
const httpServerOptions = {
    'key' :  fs.readFileSync('./https/key.pem'),
    'cert' : fs.readFileSync('./https/cert.pem')
};
const httpsServer = https.createServer(httpServerOptions, (req, res) => {
    unifiedServer(req, res)

});

//Start the HTTPS server

httpsServer.listen(config.httpsPort, () => 
    console.log("Server listen on port " + config.httpsPort + ' in '+ config.envName + ' mode')
)

// All the server logic for both the http and https
const unifiedServer = (req, res) => {
        // get the URL and parse it
    const parsedUrl = url.parse(req.url, true)

    //Get the path
    const path = parsedUrl.pathname;
    const trimmedPath = path.replace(/^\/+|\/+$/g, '')


    //Get the query string as object
    const queryStringObject = parsedUrl.query;

    //Get the HTTP Method
    const method = req.method.toLowerCase();

    //Get the headers as an object

    const headers = req.headers

    //Get the payload if any
    const decoder = new StringDecoder('utf-8');
    let buffer = '';
    req.on('data', (data) => {
        buffer += decoder.write(data)
    }).on('end', ()=> {
        buffer += decoder.end(); 
        
        //Choose the handler this request should go to
        let chosenHandler = typeof(router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound;
        console.log(typeof(router[trimmedPath]))
        //Construct the data object to send to the handler
        
        let data = {
            'trimmedPath' : trimmedPath,
            'queryStringObject' : queryStringObject,
            'method' : method,
            'headers' : headers,
            'payload' : buffer
            
        };
        
        //Route the request to the handler specified in the router
        chosenHandler(data, (statusCode, payload) => {
            //Use the status code called back by the handler, or default to 200
            statusCode = typeof(statusCode) == 'number' ? statusCode : 200
            console.log(typeof(statusCode))
            //Use the paylod called back by the handler, or default to an empty object
            payload = typeof(payload) == 'object' ? payload : buffer
            // Conve the payload to string
            let payloadString = JSON.stringify(payload)
            
            //Send the response
            res.setHeader('Content-Type','application/json')
            res.writeHead(statusCode)
            res.end(payload)
            
            //Log the request path
            console.log('return', statusCode, payloadString)
        });
        
        
    });
}

//Define handlers

let handlers = {}

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
//Define a request router
let router = {
    'sample' : handlers.sample,
    'ping' : handlers.ping,
}