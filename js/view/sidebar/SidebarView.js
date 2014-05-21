define(['logger',
    'tracker',
    'underscore',
    'jquery',
    'backbone',
    'voc',
    'text!templates/sidebar/sidebar.tpl'], function(Logger, tracker, _, $, Backbone, Voc, Template){
    return Backbone.View.extend({
        events: {
            'click .show-hide': 'showHide'
        },
        LOG: Logger.get('SidebarView'),
        initialize: function() {
        },
        render: function() {
            var tabs = _.template(Template, {});
            this.$el.html(tabs);
            this.$el.find('#tabs').tabs();
        },
        showHide: function(e) {
            var width = this.$el.outerWidth();
            if (width < 250) {
                width = 250;
            } else {
                width = 10;
            }
            this.$el.animate({ width: width }, 1000);
        }
    });
});
