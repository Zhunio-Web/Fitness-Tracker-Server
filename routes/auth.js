let express = require( 'express' );
let jwt = require( 'jsonwebtoken' );
const db = require( '../lib/database' );
const mw = require( '../lib/middleware' );

let auth = express.Router();

const SECRET = '123';

// POST: /auth/register
auth.post( '/register', (req, res) => {
    db.readUsers( res, (err, users) => {
        // Error is handled appropriately in readUsers()
        if ( err ) return;

        const user = req.body;

        const id = users.push( user ) - 1;
        user.id = id;

        db.saveUsers( res, users, err => {
            if ( err ) return;
            let token = signToken( user );
            sendToken( res, user, token );
        } );
    } );
} );

/* POST: /auth/login
 * req.body: {object} user
 * req.body: {string} user.email
 * req.body: {string} user.password
 */
auth.post( '/login', (req, res) => {

    db.readUsers( res, (err, users) => {
        // Error is handled appropriately in readUsers()
        if ( err ) return;

        // Make sure user property exists
        if ( !req.body.user ) {
            mw.sendErrorMessage( res, 'No login information provided' );
            return;
        }

        // Find user by email
        const user = users.find( user => user.email === req.body.user.email.toLowerCase() );

        // Make sure user is found
        if ( !user ) {
            mw.sendErrorMessage( res, `The email ${req.body.user.email} does not exists` );
            return;
        }

        // Validate password
        if ( user.password !== req.body.user.password ) {
            mw.sendErrorMessage( res, 'Invalid email or password.' );
            return;
        }

        // Sign token using JWT
        const token = signToken( user );

        // Send user after passing all checks
        sendToken( res, user, token );
    } );
} );


function checkAuthenticated(req, res, next) {
    if ( !req.header( 'authorization' ) )
        mw.sendErrorMessage( res, 'Missing authentication header' );

    const token = req.header( 'authorization' ).split( ' ' )[1];

    const payload = decodeToken( token );

    if ( !payload )
        mw.sendErrorMessage( res, 'Unauthorized request. Authentication header is invalid' );
    else
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
    res.json( { name: user.firstName, token: token } );
}

module.exports = auth;
module.exports.checkAuthenticated = checkAuthenticated;