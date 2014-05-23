define(['logger', 'tracker', 'underscore', 'jquery', 'backbone', 'voc', 
        'text!templates/sidebar/search.tpl',
        'data/EntityData', 'view/sss/EntityView'], function(Logger, tracker, _, $, Backbone, Voc, SearchTemplate, EntityData, EntityView){
    return Backbone.View.extend({
        searchResultSet : [],
        events: {
            'keypress .search input' : 'updateOnEnter', 
        },
        LOG: Logger.get('SearchSidebarView'),
        initialize: function() {
        },
        render: function() {
            var search = _.template(SearchTemplate);
            this.$el.html(search);

            this.$el.find('.filter input.datepicker').datepicker();
        },
        updateOnEnter: function(e) {
            if (e.keyCode == 13) {
                this.search($(e.currentTarget).val()); // TODO: get value from event
            }
        },
        search: function(searchString) {
            var that = this;
            EntityData.search(searchString, function(results) {
                var box = that.$el.find('.results .resultSet');
                _.each(this.searchResultSet, function(view) {
                    view.remove();
                });
                that.searchResultSet = [];
                _.each(results, function(result) {
                    var view = new EntityView({
                        model : result
                    });
                    box.append(view.render().$el);
                    that.searchResultSet.push(view);
                });
    
            });
        }
    });
});
