define(['logger','jquery', 'jquery-cookie'],
function (Logger, $) {
    $.cookie.json = true;
    return {
        LOG: Logger.get('UserAuth'),
        authCookie : 'bnpAuth',
        getUser: function() {
            if ( this.isAuthenticated() ) {
                return this.getAuthCookie().user;
            }
            return '';
        },
        getUserKey: function() {
            if ( this.isAuthenticated() ) {
                return this.getAuthCookie().key;
            }
            return '';
        },
        isAuthenticated: function() {
            if ( this.getAuthCookie() ) {
                return true;
            }
            return false;
        },
        getAuthCookie: function() {
            return $.cookie(this.authCookie);
        },
        setAuthCookie: function(data) {
            $.cookie(this.authCookie, data);
        },
        authenticate: function(username, password) {
            var that = this,
                defer = $.Deferred();
            new SSAuthCheckCred(
                function(response) {
                    that.LOG.debug('Auth Success', response);
                    var authData = {
                        label: username,
                        key: response.key,
                        user: response.user,
                    };
                    that.setAuthCookie(authData);
                    defer.resolve(true);
                },
                function(response) {
                    that.LOG.debug('Auth Error', response);
                    defer.reject(false);
                },
                username,
                password
            );
            return defer;
        },
        logout: function() {
            return $.removeCookie(this.authCookie);
        }
    }
});
