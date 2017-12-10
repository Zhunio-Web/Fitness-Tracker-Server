// Load Modules
let express = require( 'express' );
let path = require( 'path' );
let loggerDev = require( 'morgan' );
let cookieParser = require( 'cookie-parser' );
let bodyParser = require( 'body-parser' );

// Load User defined middleware
let logger = require( './lib/logger' );
let err = require( './lib/errors' );
let cors = require( './lib/cors' );

// Load Routers
let index = require( './routes/index' );
let api = require( './routes/api' );
let auth = require( './routes/auth' );

// Express app
let app = express();

// Boiler Plate Middleware
app.use( loggerDev( 'dev' ) );
app.use( cors );
app.use( logger.access );
app.use( bodyParser.json() );
app.use( bodyParser.urlencoded( { extended: false } ) );
app.use( cookieParser() );

// Serve static files under url: /public
app.use( express.static( path.join( __dirname, '../public' ) ) );

// User defined middleware Routes
app.use( '/', index );
app.use( '/api', api );
app.use( '/auth', auth );

// Error Logging, catching, and handling
app.use( logger.error );
app.use( err.catch );
app.use( err.handle );

module.exports = app;
