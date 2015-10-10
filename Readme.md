# bsh-token #
This module provides node.js token management services.  A typical use is to handle web sessions and authentications.

It can be indirectly used by instead using the REST endpoints defined by bsh-express-token located at
https://github.com/FranzZemen/bsh-express-token, or directly used for other reasons or by other frameworks.

## Installation ##

    npm install bsh-token --save

## Usage ##

    var bshToken = require('bsh-token');
    bshToken.implementation(require('bsh-mongo-token'));

### API ###
    /**
     * Provide the database implementation.  See bsh-mongo-token for code documentation on required API
     * @param implementation The implementation module.  Could be "requires('bsh-mongo-token')"
     */
    module.exports.implementation = function(implementation)

    /**
     * Set the default session timeout in milliseconds.  If this is never called, it is one hour
     * @param timeout
     */
    module.exports.setSessionTimeout = function (timeout)
    
    /**
     * Set the default final timeout in milliseconds.  If this is never called, it is one hundred years.
     * @param timeout
     */
    module.exports.setFinalTimeout = function (timeout)

    /**
     * If frequency is not provided, returns truthy if the cleanup was started false otherwise.  The truthy value is the frequency it was started with.
     * If frequency is provided start the token cleanup sequence after and every frequency millis.  If it was already started, it will stop and restart.
     * @param frequency in milliseconds
     * @return false if not started, the frequency if started.
     */
    module.exports.cleanup = function (frequency)
    
    /**
     * Stop the token cleanup sequence
     */
    module.exports.stopCleanup = function ()

    /**
     * Create a token.
     * @param context Defines the context for which the token is being created
     * @param user A user handle, such as an id.
     * @param roles An array of role names that are allowed by this token
     * @param tokenSessionTimeout optional session timeout for this token only in milliseconds (uses default if not set, see setSessionTimeout)
     * @param tokenFinalTimeout optional final timeout for this token only in milliseconds (uses default if not set, see setFinalTimeout).  If provided tokenSessionTimeout must also be provided.
     * @returns {*|promise} A promise that resolves to the token
     */
    module.exports.createToken = function (context, user, roles, tokenSessionTimeout, tokenFinalTimeout)
    
    /**
     * Update a token's expiration.  Typically called because a client confirms session activity.  Calls the
     * implementation to do the touch
     * @param token
     * @param tokenSessionTimeout optional.  See createToken.
     * @param tokenFinalTimeout optional.  See createToken.
     * @returns {*|promise} A promise that resolves to the token
     */
    module.exports.touchToken = function (token, tokenSessionTimeout, tokenFinalTimeout)

    /**
     * Check to see if there is an unexpired token for a given role.   Calls the implementation to do the query.
     * @param token The token to check for.
     * @param role The role to check for.  Optional
     * @param touch Touch the token after checking.  If role is provided, optional, otherwise should not be provided.  Defaults to false.
     * @returns {*|promise} A promise that resolves to found or not found.  Does not indicate if expired.
     */
    module.exports.checkToken = function (token, role, touch)
    
    /**
     * Delete a token.  Only deletes if no other delete operation is in progress.  Calls the implementation to actually
     * perform the delete.
     * @param token
     * @returns {*|promise} A promise that evaulates to true if implementation was actually called.  Promise resolves to
     * false otherwise
     */
    module.exports.deleteToken = function (token)    
    
    /**
     * Delete expired tokens if no deletions are currently ongoing.  Calls the implementation to actually perform the
     * delete and does not need to manage state.  The implementation shoudl return a promise.
     * @returns {*|promise} A promise that evaulates to true if implementation was actually called.  False if already
     * deleting.
     */
    module.exports.deleteExpiredTokens = function ()
        
## Database Connector Implementations ##
bsh-token is an abstracted token service with respect to persistence.  All methods require persistence also require
an implementation to be set (for practical purposes, you should set this implementation only once, but it can
be set as many times as you wish without issues).  You set the implementation using the API method of the same name.

An existing implementation is bsh-mongo-token for mongo database (https://github.com/FranzZemen/bsh-mongo-token).  Its
documentation provides guidance to create new implementations over other databases or persistence stores.
