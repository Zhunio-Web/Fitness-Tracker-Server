const path = require( 'path' );
const fs = require( 'fs' );

const WORKOUTS_DB = path.resolve( __dirname, '../', 'database', 'workouts.json' );
const USERS_DB = path.resolve( __dirname, '../', 'database', 'users.json' );
const TRAINERS_DB = path.resolve( __dirname, '../', 'database', 'trainers.json' );

const database = {
    // returns: next: (err, workouts) => any
    readWorkouts(next) {
        readDb( WORKOUTS_DB, next );
    },

    // returns: next: (err, users) => any
    readUsers(next) {
        readDb( USERS_DB, next );
    },

    // returns: next: (err, trainers) => any
    readTrainers(next) {
        readDb( TRAINERS_DB, (err, trainersIndices) => {
            // Error is handled appropriately in readDb
            if ( err ) return next( err );

            // If no error
            this.readUsers( (err, users) => {
                // Error is handled appropriately in readUsers
                if ( err ) return next( err );

                let trainers = [];
                trainersIndices.forEach( i => trainers.push( users[i] ) );

                return next( err, trainers );
            } );
        } );
    },

    // returns: next: (err) => any
    saveWorkouts(workouts, next) {
        writeDb( WORKOUTS_DB, workouts, next );
    },

    // returns: next: (err) => any
    saveUsers(users, next) {
        writeDb( USERS_DB, users, next );
    },

    // returns: next: (err) => any
    saveTrainers(trainers, next) {
        writeDb( TRAINERS_DB, trainers, next );
    },

    addTrainer(trainerIndex, next) {
        readDb( TRAINERS_DB, (err, trainersIndices) => {
            // Error is handled appropriately in readDb
            if ( err ) return next( err );

            if ( trainersIndices.includes( trainerIndex ) )
                writeDb( TRAINERS_DB, trainersIndices, next );
            else {
                trainersIndices.push( trainerIndex );
                writeDb( TRAINERS_DB, trainersIndices, next );
            }
        } );
    },

    isTrainer(trainerIndex, next) {
        readDb( TRAINERS_DB, (err, trainersIndices) => {
            // Error is handled appropriately in readDb
            if ( err ) return next( err );

            next( err, trainersIndices.includes( trainerIndex ) );
        } );
    }
};

// returns: next: (err, data) => any
function readDb(database, next) {
    fs.readFile( database, 'utf8', (err, data) => {
        if ( err ) {
            err.message = 'Problem accessing your files';
            console.log( err.message );
            return next( err );
        }
        return next( err, JSON.parse( data ) );
    } );
}

function writeDb(database, data, next) {
    fs.writeFile( database, JSON.stringify( data ), 'utf8', err => {
        if ( err ) {
            err.message = 'Problem saving your changes.';
            console.log( 'Problem saving your changes.' );
            next( err );
        }
        return next( err );
    } );
}

module.exports = database;
