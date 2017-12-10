let express = require( 'express' );
let auth = require( './auth' );
let db = require( '../lib/database' );
let mw = require( '../lib/middleware' );

let api = express.Router();

// GET: /api/users/me
api.get( '/users/me', auth.checkAuthenticated, (req, res) => {

    // If user is attached, an error probably occurred and was already sent
    if ( !req.user ) return;

    db.readUsers( res, (err, users) => {
        if ( err ) return;

        const { email, firstName, lastName } = users[req.user];
        db.isTrainer( res, req.user, isTrainer => {
            res.json( { email, firstName, lastName, isTrainer: isTrainer } );
        } );


    } );
} );

// POST: /api/users/me
api.post( '/users/me', auth.checkAuthenticated, (req, res) => {

    // If user is attached, an error probably occurred and was already sent
    if ( !req.user ) return;

    const id = req.user;
    const user = req.body.user;

    db.readUsers( res, (err, users) => {
        if ( err ) return;

        users[id].firstName = user.firstName;
        users[id].lastName = user.lastName;

        db.saveUsers( res, users, err => {
            if ( err ) return;

            if ( req.body.isTrainer ) {
                db.addTrainer( res, id, err => {
                    if ( err ) return;
                    mw.sendMessage( res, 'User updated successfully' );
                } );
            }
        } );

    } );
} );

api.get( '/trainers', (req, res) => {
    db.readTrainers( res, (err, trainers) => {
        if ( err ) return;

        let trainerResponse = [];

        trainers.forEach( trainer => {
            const { firstName, lastName, id } = trainer;
            trainerResponse.push( { firstName, lastName, id, workouts: [] } );
        } );
        res.json( trainerResponse );
    } );
} );

api.get( '/trainers/workouts/:id', auth.checkAuthenticated, (req, res) => {
    db.readTrainers( res, (err, trainers) => {
        if ( err ) return;

        const trainerId = parseInt( req.params.id );
        const trainer = trainers.find( trainer => trainer.id === trainerId );
        db.readWorkouts( res, (err, workouts) => {
            if ( err ) return;

            const result = [];
            const { firstName, lastName, id } = trainer;

            if ( trainer.workouts )
                trainer.workouts.forEach( i => result.push( workouts[i] ) );

            res.json( { firstName, lastName, id, workouts: result } );
        } );
    } );
} );


// GET: /api/workouts
api.get( '/workouts', (req, res) => {
    db.readWorkouts( res, (err, workouts) => {
        if ( err ) return;

        res.json( workouts );
    } );
} );

// POST: /api/workouts
api.post( '/workouts', (req, res) => {
    db.readWorkouts( res, (err, workouts) => {
        if ( err ) return;

        workouts.push( req.body );
        db.saveWorkouts( res, workouts, err => {
            if ( err ) return;
            mw.sendMessage( res, 'Workout added successfully' );
        } );

    } );
} );

// GET: /api/workouts/:workoutName
api.get( '/workouts/:workoutName', (req, res) => {
    db.readWorkouts( res, (err, workouts) => {
        if ( err ) return;

        let workoutName = req.params.workoutName;
        let workout = workouts.filter( workout => workoutUrl( workout.name ) === workoutName );

        if ( workout.length === 0 )
            mw.sendErrorMessage( res, 'Could not find ' + workoutName );
        else
            db.saveWorkouts( res, workouts, err => {
                if ( err ) return;
                res.json( workout );
            } );
    } );
} );


function workoutUrl(workoutName) {
    return workoutName.toLowerCase().split( ' ' ).join( '-' );
}

module.exports = api;