define(['module', 'logger','jquery', 'jquery-cookie'],
function (module, Logger, $) {
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
            var cookie = this.getAuthCookie();
            if ( cookie && cookie['label'] && cookie['user'] && cookie['key'] ) {
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
        authCall: function(username, password, access_token) {
            var that = this,
                defer = $.Deferred();
                op = "authCheckCred";
                params = {
                    'label' : username, 
                    'password' : password
                },
                ajaxSettings = {
                    'url' : module.config().sssHostREST + op + "/",
                    'type': "POST",
                    'data' : JSON.stringify(params),
                    'contentType' : "application/json",
                    'async' : true,
                    'dataType': "application/json",
                    'complete' : function(jqXHR, textStatus) {
                        if( jqXHR.readyState !== 4 || jqXHR.status !== 200){
                            AppLog.error("sss json request failed");
                            return;
                        }
                        
                        var result = $.parseJSON(jqXHR.responseText);
                        that.LOG.debug('result', result);
                        
                        if( result.error ) {
                            that.LOG.debug('Auth Error', result);
                            defer.reject(false);
                            return;
                        }
                        that.LOG.debug('Auth Success', result);
                        var authData = {
                            label: username,
                            key: result[op].key,
                            user: result[op].user,
                        };
                        that.setAuthCookie(authData);
                        defer.resolve(true);
                    }
                };

            if ( access_token ) {
                ajaxSettings['headers'] = { 'Authorization' : "Bearer " + access_token };
            }
            $.ajax(ajaxSettings);

            return defer.promise();
        },
        authenticate: function(username, password) {
            return this.authCall(username, password);
        },
        oidcAuthenticate: function(access_token) {
            return this.authCall('somePassword', 'someLabel', access_token);
        },
        logout: function() {
            return $.removeCookie(this.authCookie);
        }
    }
});
