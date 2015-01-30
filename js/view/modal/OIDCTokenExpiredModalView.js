define(['logger', 'underscore', 'jquery', 'backbone',
        'UserAuth',
        'text!templates/oidc_token_expired_modal.tpl'], function(Logger, _, $, Backbone, UserAuth, OIDCTokenExpiredTemplate){
    return Backbone.View.extend({
        events: {
            'hide.bs.modal' : 'forceLogout'
        },
        LOG: Logger.get('OIDCTokenExpiredModalView'),
        initialize: function() {
            var that = this;

            this.isShown = false;
            this.circleRenameModalSelector = '#oidcTokenExpiredModal';

            $(document).on('bnp:oidcTokenExpired', function(e) {
                that.showModal();
            });
        },
        render: function() {
            this.$el.html(_.template(OIDCTokenExpiredTemplate));
            
            return this;
        },
        showModal: function() {
            if ( this.isShown ) return;

            this.$el.find(this.circleRenameModalSelector).modal('show');
            this.isShown = true;
        },
        hideModal: function() {
            this.$el.find(this.circleRenameModalSelector).modal('hide');
            this.isShown = false;
        },
        forceLogout: function(e) {
            if ( UserAuth.logout() ) {
                document.location.reload();
            }
        }
    });
});
