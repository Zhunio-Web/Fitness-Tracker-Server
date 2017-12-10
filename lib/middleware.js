const middleware = {
    sendMessage(res, message) {
        const response = {
            success: true,
            message: message
        };

        console.log( response );
        return res.status( 200 ).json( response );
    },

    sendErrorMessage(res, message) {
        const response = {
            success: false,
            message: message
        };

        console.log( response );
        return res.status( 404 ).json( response );
    }
};

module.exports = middleware;