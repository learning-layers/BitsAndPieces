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

                // Check if user has returned after authentication with OIDC
                if ( window.location.hash ) {
                    var params = this.parseQueryString();
                    this.oidcLogin(params['access_token']);
                }
            } else {
                this.$el.html(_.template(LoginTemplate));
            }
        },
        disableFormSubmission: function() {
            this.$el.find('form :submit').prop('disabled', true);
            this.formSubmissionDisabled = true;
        },
        enableFormSubmission: function() {
            this.$el.find('form :submit').prop('disabled', false);
            this.formSubmissionDisabled = false;
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

            if ( this.formSubmissionDisabled === true ) {
                return false;
            }

            that.disableFormSubmission();

            if ( username && password ) {
                UserAuth.authenticate(username, password).then(
                    function() {
                        window.location.reload();
                    },
                    function() {
                        that.$el.find('form[name="login"]').effect('shake');
                        that.enableFormSubmission();
                    });
            } else {
                that.$el.find('form[name="login"]').effect('shake');
                that.enableFormSubmission();
            }
        },
        oidcLoginRedirect: function(e) {
            e.preventDefault();

            if ( this.formSubmissionDisabled === true ) {
                return false;
            }

            var url = this.oidcAuthorizationUrl
                + '?response_type=' + encodeURIComponent('id_token token')
                + '&client_id=' + this.oidcClientID
                + '&scope=' + encodeURIComponent('openid email profile')
                + '&redirect_uri=' + encodeURIComponent(window.location.origin + window.location.pathname);

            window.location.href = url;
        },
        oidcLogin: function(access_token) {
            var that = this;

            if ( this.formSubmissionDisabled === true ) {
                return false;
            }

            that.disableFormSubmission();

            UserAuth.oidcAuthenticate(access_token).then(
                function() {
                    // Reload while removing hash and query string
                    window.location.href = window.location.origin + window.location.pathname;
                },
                function() {
                    that.$el.find('form[name="oidcLogin"]').effect('shake');
                    that.enableFormSubmission();
                }
            );
        }
    });
});
