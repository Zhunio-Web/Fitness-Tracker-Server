let express = require( 'express' );
let path = require( 'path' );
let fs = require( 'fs' );

let workoutsDb = path.resolve( __dirname, '../', 'database', 'workouts.json' );

let api = express.Router();

// GET: /api/workouts
api.get( '/workouts', (req, res) => {
    readWorkoutsDb( res, workouts => {
        res.json( workouts );
    } );
} );

// POST: /api/workouts
api.post( '/workouts', (req, res) => {
    readWorkoutsDb( res, workouts => {
        workouts.push( req.body );
        saveWorkoutsDb( res, workouts, _ => res.sendStatus( 204 ) );
    } );
} );

// GET: /api/workouts/:workoutName
api.get( '/workouts/:workoutName', (req, res) => {
    readWorkoutsDb( res, workouts => {
        let workout = workouts.filter(
            workout => workoutUrl( workout.name ) === req.params.workoutName );

        saveWorkoutsDb( res, workouts, _ => res.json( workout ) );
    } );
} );

function readWorkoutsDb(res, next) {
    fs.readFile( workoutsDb, 'utf8', (err, workoutsDb) => {
        if ( err ) sendErrorMessage( res, false, 'Problem accessing your files.' );
        return next( JSON.parse( workoutsDb ) );
    } );
}

function saveWorkoutsDb(res, workouts, next) {
    fs.writeFile( workoutsDb, JSON.stringify(workouts), 'utf8', (err) => {
        if ( err ) sendErrorMessage( res, false, 'Problem saving your changes.' );
        return next();
    } );
}

function sendErrorMessage(res, success, message) {
    return res.json( {
        success: success,
        message: message
    } );
}

function workoutUrl(workoutName) {
    return workoutName.toLowerCase().split( ' ' ).join( '-' );
}

module.exports = api;