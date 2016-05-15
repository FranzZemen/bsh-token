/**
 * Created by Franz on 10/10/2015.
 */

(function () {
    'use strict';

    var log = require('bunyan').createLogger({name: 'bsh-token', level: 'info'});
    var uuid = require('uuid');
    var Q = require('q');
    var impl_;

    var sessionTimeout = 3600000;
    var finalTimeout = 86400 * 365 * 100 * 1000;
    var interval;
    var deleting;
    var truthyFrequency = undefined;

    /**
     * Provide the database implementation.  See bsh-mongo-token for code documentation on required API
     * @param implementation The implementation module.  Could be "requires('bsh-mongo-token')"
     */
    module.exports.implementation = function(implementation) {
        impl_ = implementation;
    };

    /**
     * Set the default session timeout in milliseconds.  If this is never called, it is one hour
     * @param timeout
     */
    module.exports.setSessionTimeout = function (timeout) {
        sessionTimeout = timeout;
    };

    /**
     * Set the default final timeout in milliseconds.  If this is never called, it is one hundred years.
     * @param timeout
     */
    module.exports.setFinalTimeout = function (timeout) {
        finalTimeout = timeout;
    };

    /**
     * If frequency is not provided, returns truthy if the cleanup was started false otherwise.  The truthy value is the frequency it was started with.
     * If frequency is provided start the token cleanup sequence after and every frequency millis.  If it was already started, it will stop and restart.
     * @param frequency in milliseconds
     * @return false if not started, the frequency if started.
     */
    module.exports.cleanup = function (frequency) {
        if (frequency) {
            log.trace({frequency:frequency},'cleanup');
            if (interval) {
                clearInterval(interval);
            }
            truthyFrequency = frequency;
            interval = setInterval(function () {
                module.exports.deleteExpiredTokens();
            }, truthyFrequency);
            log.trace({truthyFrequency:truthyFrequency},'cleanup started');
            return truthyFrequency;
        } else {
            log.trace({truthyFrequency:truthyFrequency},'cleanup result');
            return interval ? truthyFrequency : false;
        }
    };

    /**
     * Stop the token cleanup sequence
     */
    module.exports.stopCleanup = function () {
        if (interval) {
            clearInterval(interval);
            interval = undefined;
            truthyFrequency = undefined;
        }
    };


    /**
     *
     * @param context Defines the context for which the token is being created
     * @param user A user handle, such as an id.
     * @param roles An array of role names that are allowed by this token
     * @param tokenSessionTimeout optional session timeout for this token only in milliseconds (uses default if not set, see setSessionTimeout)
     * @param tokenFinalTimeout optional final timeout for this token only in milliseconds (uses default if not set, see setFinalTimeout).  If provided tokenSessionTimeout must also be provided.
     * @returns {*|promise} A promise that resolves to the token
     */
    module.exports.createToken = function (context, user, roles, tokenSessionTimeout, tokenFinalTimeout) {
        log.trace({context: context, user: user, roles: roles, tokenSessionTimeout: tokenSessionTimeout, tokenFinalTimeout:tokenFinalTimeout},'createToken');
        if (!impl_) {
            throw new Error('No implementation set.  impl must be called first.');
        }
        tokenSessionTimeout = tokenSessionTimeout || sessionTimeout;
        tokenFinalTimeout = tokenFinalTimeout || finalTimeout;
        var buffer = new Array(16);
        var token = uuid.unparse(uuid.v4(null, buffer));
        return impl_.createToken(token, context, user, roles, tokenSessionTimeout, tokenFinalTimeout)
            .then(function (result) {
                log.trace({result:result, token:token},'createToken result');
                return token;
            });
    };

    /**
     * Update a token's expiration.  Typically called because a client confirms session activity.  Calls the
     * implementation to do the touch
     * @param token
     * @param tokenSessionTimeout optional.  See createToken.
     * @param tokenFinalTimeout optional.  See createToken.
     * @returns {*|promise} A promise that resolves to the token
     */
    module.exports.touchToken = function (token, tokenSessionTimeout, tokenFinalTimeout) {
        log.trace({token:token, tokenSessionTimeout: tokenSessionTimeout, tokenFinalTimeout:tokenFinalTimeout},'touchToken');
        if (!impl_) {
            throw new Error('No implementation set.  impl must be called first.');
        }
        tokenSessionTimeout = tokenSessionTimeout || sessionTimeout;
        tokenFinalTimeout = tokenFinalTimeout || finalTimeout;
        return impl_.touchToken(token, tokenSessionTimeout, tokenFinalTimeout)
            .then(function (result) {
                log.trace({result:result}, 'touchToken result');
                return token;
            });
    };

    /**
     * Check to see if there is an unexpired token for a given role.   Calls the implementation to do the query.
     * @param token The token to check for.
     * @param role The role to check for.  Optional
     * @param touch Touch the token after checking.  If role is provided, optional, otherwise should not be provided.  Defaults to false.
     * @returns {*|promise} A promise that resolves to found or not found.  Does not indicate if expired.
     */
    module.exports.checkToken = function (token, role, touch) {
        log.trace({token:token, role:role, touch:touch},'checkToken');
        if (!impl_) {
            throw new Error('No implementation set.  impl must be called first.');
        }
        touch = touch || false;
        return impl_.checkToken(token, role)
            .then(function(checkedToken) {
                if (checkedToken && touch) {
                    return module.exports.touchToken(checkedToken);
                } else {
                    return checkedToken;
                }
            })
            .then(function(checkedToken) {
                var tokenFound = checkedToken && checkedToken === token ? true : false;
                log.trace({tokenFound: tokenFound}, 'checkToken result');
                return tokenFound;
            });
    };
    /**
     * Delete a token.  Only deletes if no other delete operation is in progress.  Calls the implementation to actually
     * perform the delete.
     * @param token
     * @returns {*|promise} A promise that evaulates to true if implementation was actually called.  Promise resolves to
     * false otherwise
     */
    module.exports.deleteToken = function (token) {
        log.trace({token:token},'deleteToken');
        if (!impl_) {
            throw new Error('No implementation set.  impl must be called first.');
        }
        if (!deleting) {
            deleting = true;
            return impl_.deleteToken(token)
                .then(function(result) {
                    deleting = false;
                    return true;
                });
        } else {
            return Q.fcall(function () {return false;});
        }
    };

    /**
     * Delete expired tokens if no deletions are currently ongoing.  Calls the implementation to actually perform the
     * delete and does not need to manage state.  The implementation shoudl return a promise.
     * @returns {*|promise} A promise that evaulates to true if implementation was actually called.  False if already
     * deleting.
     */
    module.exports.deleteExpiredTokens = function () {
        log.trace('deleteExpiredTokens');
        if (!impl_) {
            throw new Error('No implementation set.  impl must be called first.');
        }
        if (!deleting) {
            log.trace('deleteExpiredTokens deleting');
            deleting = true;
            return impl_.deleteExpiredTokens()
                .then(function(result) {
                    deleting = false;
                    return true;
                });
        } else {
            log.trace('deleteExpiredTokens already deleting, not deleting again');
            return Q.fcall(function () {return false;});
        }
    };
})();
