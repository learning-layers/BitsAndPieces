define(['logger', 'tracker', 'underscore', 'jquery', 'backbone', 'voc', 
        'text!templates/toolbar/notifications.tpl'], function(Logger, tracker, _, $, Backbone, Voc, NotificationsTemplate){
    return Backbone.View.extend({
        events: {
        },
        LOG: Logger.get('NotificationsToolbarView'),
        initialize: function() {
        },
        render: function() {
            var notifications = _.template(NotificationsTemplate);
            this.$el.html(notifications);
        }
    });
});
