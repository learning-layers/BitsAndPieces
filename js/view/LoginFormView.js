define(['module', 'logger', 'underscore', 'jquery', 'backbone', 'voc', 'UserAuth',
        'text!templates/login.tpl', 'text!templates/oidc_login.tpl'], function(module, Logger, _, $, Backbone, Voc, UserAuth, LoginTemplate, OIDCLoginTemplate){
    return Backbone.View.extend({
        events: {
            'submit form[name="login"]' : 'login',
            'submit form[name="oidcLogin"]' : 'oidcLoginRedirect'
        },
        LOG: Logger.get('LoginFormView'),
        initialize: function() {
        },
        render: function() {
            var oidcAuthorizationUrl = module.config().oidcAuthorizationUrl,
                oidcClientID = module.config().oidcClientID;
            
            this.$el.empty();
            if ( oidcAuthorizationUrl && oidcClientID ) {
                this.$el.html(_.template(OIDCLoginTemplate));
                
                this.oidcAuthorizationUrl = oidcAuthorizationUrl;
                this.oidcClientID = oidcClientID;

                // Check if we have returned
                if ( window.location.hash ) {
                    var params = this.parseQueryString();
                    this.oidcLogin(params['access_token']);
                    // TODO Probably need to display some ajaxLoader
                    // and disable resubmitting the form
                }
            } else {
                this.$el.html(_.template(LoginTemplate));
            }
        },
        parseQueryString: function() {
            var params = {},
                queryString = window.location.hash,
                regex = /([^&=]+)=([^&]*)/g,
                m;
            while ( m = regex.exec(queryString) ) {
                params[decodeURIComponent(m[1])] = decodeURIComponent(m[2]);
            }

            // This fix is due to URL having additional element in the hash
            if ( params['#access_token'] ) {
                params['access_token'] = params['#access_token'];
            }

            return params;
        },
        login: function(e) {
            var username = this.$el.find('input[name="username"]').val(),
                password = this.$el.find('input[name="password"]').val(),
                that = this;
            e.preventDefault();
            if ( username && password ) {
                UserAuth.authenticate(username, password).then(
                    function() {
                        window.location.reload();
                    },
                    function() {
                        that.$el.find('form[name="login"]').effect('shake');
                    });
            } else {
                that.$el.find('form[name="login"]').effect('shake');
            }
        },
        oidcLoginRedirect: function(e) {
            e.preventDefault();

            var url = this.oidcAuthorizationUrl + '?response_type=' + encodeURIComponent('id_token token') + '&client_id=' + this.oidcClientID + '&scope=' + encodeURIComponent('openid email profile');

            window.location.href = url;
        },
        oidcLogin: function(access_token) {
            var that = this;
            UserAuth.oidcAuthenticate(access_token).then(
                function() {
                    // Reload while removing hash and query string
                    window.location.href = window.location.origin + window.location.pathname;
                },
                function() {
                    that.$el.find('form[name="oidcLogin"]').effect('shake');
                }
            );
        }
    });
});
