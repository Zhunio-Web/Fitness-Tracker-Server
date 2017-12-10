let express = require( 'express' );
let jwt = require( 'jsonwebtoken' );
const db = require( '../lib/database' );
const mw = require( '../lib/middleware' );

let auth = express.Router();

const SECRET = '123';

// POST: /auth/register
auth.post( '/register', handleRegister );

function handleRegister(req, res) {
    db.readUsers( handleReadUsers );

    function handleReadUsers(err, users) {
        // Error is handled appropriately in readUsers()
        if ( err ) return mw.sendErrorMessage( res, err.message );

        const user = req.body;

        const id = users.push( user ) - 1;
        user.id = id;

        db.saveUsers( users, handleSaveUser );
    }

    function handleSaveUser(err) {
        if ( err ) return mw.sendErrorMessage( res, err.message );
        let token = signToken( user );
        sendToken( res, user, token );
    }
}

/* POST: /auth/login
 * req.body: {object} user
 * req.body: {string} user.email
 * req.body: {string} user.password
 */
auth.post( '/login', handleLogin );

function handleLogin(req, res) {
    db.readUsers( handleReadUsers );

    function handleReadUsers(err, users) {
        // Error is handled appropriately in readUsers()
        if ( err ) return mw.sendErrorMessage( res, err.message );

        // Make sure user property exists
        if ( !req.body.user )
            return mw.sendErrorMessage( res, 'No login information provided' );

        // Find user by email
        const user = users.find( findUserByEmail );

        // Make sure user is found
        if ( !user )
            return mw.sendErrorMessage( res, `The email ${req.body.user.email} does not exists` );

        // Validate password
        if ( user.password !== req.body.user.password )
            return mw.sendErrorMessage( res, 'Invalid email or password.' );

        // Sign token using JWT
        const token = signToken( user );

        // Send user after passing all checks
        sendToken( res, user, token );
    }

    function findUserByEmail(user) {
        return user.email === req.body.user.email.toLowerCase();
    }
}

function checkAuthenticated(req, res, next) {
    let err;

    if ( !req.header( 'authorization' ) ) {
        err = new Error( 'Missing authentication header' );
        return next( err );
    }

    const token = req.header( 'authorization' ).split( ' ' )[1];

    const payload = decodeToken( token );

    if ( !payload ) {
        err = new Error( 'Unauthorized request. Authentication header is invalid' );
        return next( err );
    }

    req.user = payload.user;
    next();
}

function signToken(user) {
    return jwt.sign( { user: user.id }, SECRET );
}

function decodeToken(token) {
    return jwt.decode( token, SECRET );
}

function sendToken(res, user, token) {
    res.json( { name: user.firstName + ' ' + user.lastName, token: token } );
}

module.exports = auth;
module.exports.checkAuthenticated = checkAuthenticated;