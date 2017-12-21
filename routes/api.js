let express = require( 'express' );
let auth = require( './auth' );
let db = require( '../lib/database' );
let mw = require( '../lib/middleware' );

let api = express.Router();

// GET: /api/users/me
api.get( '/users/me', auth.checkAuthenticated, handleUser );

function handleUser(req, res) {

    db.readUsers( handleReadUsers );

    function handleReadUsers(err, users) {
        if ( err ) return mw.sendErrorMessage( res, err.message );

        const { email, firstName, lastName } = users[req.user];
        db.isTrainer( req.user, (err, isTrainer) => {
            if ( err ) return mw.sendErrorMessage( res, err.message );

            res.json( { email, firstName, lastName, isTrainer: isTrainer } );
        } );
    }
}

// POST: /api/users/me
api.post( '/users/me', auth.checkAuthenticated, handleUpdateUser );

function handleUpdateUser(req, res) {
    const id = req.user;
    const user = req.body.user;

    db.readUsers( handleReadUsers );

    function handleReadUsers(err, users) {
        if ( err ) return mw.sendErrorMessage( res, err.message );

        users[id].firstName = user.firstName;
        users[id].lastName = user.lastName;
        users[id].workouts = [];

        db.saveUsers( users, handleSaveUserAsTrainer );
    }

    function handleSaveUserAsTrainer(err) {
        if ( err ) return mw.sendErrorMessage( res, err.message );

        if ( req.body.isTrainer ) {
            db.addTrainer( id, err => {
                if ( err ) return mw.sendErrorMessage( res, err.message );
                mw.sendMessage( res, 'User updated successfully' );
            } );
        }
    }
}

api.get( '/trainers', handleSendTrainers );

function handleSendTrainers(req, res) {
    db.readTrainers( (err, trainers) => {
        if ( err ) return mw.sendErrorMessage( res, err.message );

        let trainerResponse = [];

        trainers.forEach( formatTrainersResponse );
        res.json( trainerResponse );

        function formatTrainersResponse(trainer) {
            const { firstName, lastName, id } = trainer;
            trainerResponse.push( { firstName, lastName, id, workouts: [] } );
        }
    } );
}

api.get( '/trainers/workouts/:id', auth.checkAuthenticated, handleWorkoutsByTrainer );

function handleWorkoutsByTrainer(req, res) {
    db.readTrainers( (err, trainers) => {
        if ( err ) return mw.sendErrorMessage( res, err.message );

        const trainerId = parseInt( req.params.id );
        const trainer = trainers.find( trainer => trainer.id === trainerId );

        if ( !trainer ) return mw.sendErrorMessage( res, 'Not trainer' );

        db.readWorkouts( handleWorkouts );

        function handleWorkouts(err, workouts) {
            if ( err ) return mw.sendErrorMessage( res, err.message );

            const result = [];
            const { firstName, lastName, id } = trainer;

            if ( trainer.workouts )
                trainer.workouts.forEach( i => result.push( workouts[i] ) );

            res.json( { firstName, lastName, id, workouts: result } );
        }
    } );
}

// GET: /api/workouts
api.post( '/workouts', auth.checkAuthenticated, handleWorkouts );

function handleWorkouts(req, res) {
    let workout = req.body;
    
    db.readWorkouts( (err, workouts) => {
        if ( err ) return mw.sendErrorMessage( res, err.message );

        let response = filterbyName(workouts);

        res.json( response );
    } );
    
    function filterbyName(workouts) {
        return workouts.filter(byName);
    }
    
    function byName(element) {
        return element.name.toLowerCase().includes(workout.name.toLowerCase());
    }
}

// POST: /api/workouts
api.post( '/workouts/new', auth.checkAuthenticated, handleAddWorkout );

function handleAddWorkout(req, res) {
    let workoutIndex;

    db.readWorkouts( handleReadWorkouts );

    function handleReadWorkouts(err, workouts) {
        if ( err ) return mw.sendErrorMessage( res, err.message );

        // Add workout to workouts database
        workoutIndex = workouts.push( req.body.workout ) - 1;
        db.saveWorkouts( workouts, handleSaveWorkouts );
    }

    function handleSaveWorkouts(err) {
        if ( err ) return mw.sendErrorMessage( res, err.message );

        // Add workout to user.workouts
        db.readUsers( handleReadUsers );
    }

    function handleReadUsers(err, users) {
        if ( err ) return mw.sendErrorMessage( res, err.message );

        const user = users[req.user];
        console.log( user );
        user.workouts.push( workoutIndex );

        db.saveUsers( users, handleSaveUsers );
    }

    function handleSaveUsers(err) {
        if ( err ) return mw.sendErrorMessage( res, err.message );
        return mw.sendMessage( res, 'Workout added successfully' );
    }
}

// GET: /api/workouts/:workoutName
api.get( '/workouts/:workoutName', handleGetWorkout );

api.use( handleErrors );

function handleErrors(err, req, res, next) {
    if ( err ) {
        return mw.sendErrorMessage( res, err.message );
    }
    next( err );
}

function handleGetWorkout(req, res) {
    db.readWorkouts( (err, workouts) => {
        if ( err ) return mw.sendErrorMessage( res, err.message );

        let workoutName = req.params.workoutName;
        let workout = workouts.filter( workout => workoutUrl( workout.name ) === workoutName );

        if ( workout.length === 0 )
            mw.sendErrorMessage( res, 'Could not find ' + workoutName );
        else
            db.saveWorkouts( workouts, err => {
                if ( err ) return mw.sendErrorMessage( res, err.message );
                res.json( workout );
            } );
    } );
}

function workoutUrl(workoutName) {
    return workoutName.toLowerCase().split( ' ' ).join( '-' );
}

module.exports = api;