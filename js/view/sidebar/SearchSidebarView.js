define(['logger', 'tracker', 'underscore', 'jquery', 'backbone', 'voc', 
        'text!templates/sidebar/search.tpl'], function(Logger, tracker, _, $, Backbone, Voc, SearchTemplate){
    return Backbone.View.extend({
        events: {
        },
        LOG: Logger.get('SearchSidebarView'),
        initialize: function() {
        },
        render: function() {
            var search = _.template(SearchTemplate);
            this.$el.html(search);
        }
    });
});
