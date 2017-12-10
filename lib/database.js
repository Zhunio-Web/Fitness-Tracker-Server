const path = require( 'path' );
const fs = require( 'fs' );

const mw = require( '../lib/middleware' );

const WORKOUTS_DB = path.resolve( __dirname, '../', 'database', 'workouts.json' );
const USERS_DB = path.resolve( __dirname, '../', 'database', 'users.json' );
const TRAINERS_DB = path.resolve( __dirname, '../', 'database', 'trainers.json' );

const database = {
    // returns: next: (err, workouts) => any
    readWorkouts(res, next) {
        readDb( res, WORKOUTS_DB, next );
    },

    // returns: next: (err) => any
    saveWorkouts(res, workouts, next) {
        writeDb( res, WORKOUTS_DB, workouts, next );
    },

    // returns: next: (err, users) => any
    readUsers(res, next) {
        readDb( res, USERS_DB, next );
    },

    // returns: next: (err) => any
    saveUsers(res, users, next) {
        writeDb( res, USERS_DB, users, next );
    },

    // returns: next: (err, trainers) => any
    readTrainers(res, next) {
        readDb( res, TRAINERS_DB, (err, trainersIndices) => {
            // Error is handled appropriately in readDb
            if ( err ) return next( err );

            // If no error
            this.readUsers( res, (err, users) => {
                // Error is handled appropriately in readUsers
                if ( err ) return next( err );

                let trainers = [];
                trainersIndices.forEach( i => trainers.push( users[i] ) );

                return next( err, trainers );
            } );
        } );
    },

    // returns: next: (err) => any
    saveTrainers(res, trainers, next) {
        writeDb( res, TRAINERS_DB, trainers, next );
    },

    addTrainer(res, trainerIndex, next) {
        readDb( res, TRAINERS_DB, (err, trainersIndices) => {
            // Error is handled appropriately in readDb
            if ( err ) return next( err );

            if ( trainersIndices.includes( trainerIndex ) )
                writeDb( res, TRAINERS_DB, trainersIndices, next );
            else {
                trainersIndices.push( trainerIndex );
                writeDb( res, TRAINERS_DB, trainersIndices, next );
            }
        } );
    },

    isTrainer(res, trainerIndex, next) {
        readDb( res, TRAINERS_DB, (err, trainersIndices) => {
            // Error is handled appropriately in readDb
            if ( err ) return next( err );

            next( trainersIndices.includes( trainerIndex ) );
        } );
    }
};

// returns: next: (err, data) => any
function readDb(res, database, next) {
    fs.readFile( database, 'utf8', (err, data) => {
        if ( err ) {
            console.log( err );
            mw.sendErrorMessage( res, 'Problem accessing your files.' );
            return next( err );
        }
        return next( err, JSON.parse( data ) );
    } );
}

function writeDb(res, database, data, next) {
    fs.writeFile( database, JSON.stringify( data ), 'utf8', (err) => {
        if ( err ) {
            mw.sendErrorMessage( res, 'Problem saving your changes.' );
            next( err );
        }
        return next( err );
    } );
}

module.exports = database;
