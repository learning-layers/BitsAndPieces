define(['logger', 'underscore', 'jquery', 'backbone', 'voc', 'UserAuth',
        'text!templates/login.tpl'], function(Logger, _, $, Backbone, Voc, UserAuth, LoginTemplate){
    return Backbone.View.extend({
        events: {
            'submit form[name="login"]' : 'login'
        },
        LOG: Logger.get('LoginFormView'),
        initialize: function() {
        },
        render: function() {
            this.$el.empty();
            this.$el.html(_.template(LoginTemplate));
        },
        login: function(e) {
            var username = this.$el.find('input[name="username"]').val(),
                password = this.$el.find('input[name="password"]').val(),
                that = this;
            e.preventDefault();
            if ( username && password ) {
                UserAuth.authenticate(username, password).then(
                    function() {
                        document.location.reload();
                    },
                    function() {
                        that.$el.find('form[name="login"]').effect('shake');
                    });
            } else {
                that.$el.find('form[name="login"]').effect('shake');
            }
        }
    });
});
