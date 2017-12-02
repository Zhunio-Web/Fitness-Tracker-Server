let express = require( 'express' );

let router = express.Router();

router.get( '/', (req, res) => res.send( 'Welcome strangee!' ) );

module.exports = router;
