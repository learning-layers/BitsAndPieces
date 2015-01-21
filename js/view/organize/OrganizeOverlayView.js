define(['logger', 'underscore', 'jquery', 'backbone'],
    function(Logger, _, $, Backbone){
    return Backbone.View.extend({
        LOG: Logger.get('OrganizeOverlayView'),
        tagName: 'div',
        className: 'organizeOverlay',
        events:{
            'click button' : 'disableOverlay'
        },
        initialize: function() {
            // TODO See if an episode model has to be passed in
            // Probably needs an episode model and listener to it becoming
            // locked, as soon as that happens it should enable be displayed
            // and send the lock event for the WidgetView
        },
        render: function() {
            this.LOG.debug('Rendering OrganizeOverlayView', this.el, this.$el);

            this.$el.append('<button type="button" class="btn btn-default">Enable Organize</button>');

            return this;
        },
        disableOverlay: function(e) {
            this.$el.hide();
            var ev = $.Event('bnp:enableOrganize', {});
            this.$el.trigger(ev);
        },
        enableOverlay: function(e) {
            // TODO This one is still unhandled by the widget
            this.$el.show();
            var ev = $.Event('bnp:disableOrganize', {});
            this.$el.trigger(ev);
        }
    });
});
