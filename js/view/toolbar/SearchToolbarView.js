define(['logger', 'tracker', 'underscore', 'jquery', 'backbone', 'voc', 
        'text!templates/toolbar/search.tpl',
        'data/EntityData', 'view/sss/EntityView'], function(Logger, tracker, _, $, Backbone, Voc, SearchTemplate, EntityData, EntityView){
    return Backbone.View.extend({
        searchResultSet : [],
        tagCloud: {},
        events: {
            'keypress .search input' : 'updateOnEnter', 
            'click .filter .clearDatepicker' : 'clearDatepicker',
            'click .tagcloud a' : 'filterSearchResults',
        },
        LOG: Logger.get('SearchToolbarView'),
        initialize: function() {
        },
        render: function() {
            var search = _.template(SearchTemplate);
            this.$el.html(search);

            this.$el.find('.filter input.datepicker').datepicker();
        },
        updateOnEnter: function(e) {
            if (e.keyCode == 13) {
                this.search($(e.currentTarget).val());
            }
        },
        search: function(searchString) {
            var that = this;
            var tags = [searchString];
            EntityData.search(tags, function(results) {
                var box = that.$el.find('.results .resultSet');
                _.each(that.searchResultSet, function(view) {
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
                that.displayTagcloud();
            });
        },
        clearDatepicker: function(e) {
            e.preventDefault();
            this.$el.find('.filter input.datepicker').val('');
        },
        displayTagcloud: function() {
            var that = this,
                box = this.$el.find('.tagcloud'),
                fontMin = 10,
                fontMax = 30,
                frequMin = 1,
                frequMax = 1;

            that.tagCloud = {};
            box.empty();
            _.each(this.searchResultSet, function(result) {
                // TODO Check if a better solution could be implemented
                // This is here to make sure that all entities have finished
                // loading and have some tags associated with them.
                if ( result.model.get(Voc.hasTag) === undefined) {
                    console.log("WTF");
                    _.defer(function() {
                        that.displayTagcloud();
                    });
                    return;
                }
                if ( result.model.get(Voc.hasTag) ) {
                    _.each(result.model.get(Voc.hasTag), function(tag) {
                        if ( _.has(that.tagCloud, tag) ) {
                            that.tagCloud[tag] += 1;
                        } else {
                            that.tagCloud[tag] = 1;
                        }
                    });
                }

            });
            _.each(_.values(that.tagCloud), function(key, frequ) {
                if (0 === key) {
                    frequMin = frequ;
                    frequMax = frequ;
                }
                if (frequ > frequMax) {
                    frequMax = frequ;
                } else if (frequ < frequMin) {
                    frequMin = frequ;
                }
            });
            _.each(that.tagCloud, function(frequ, tag) {
                var fontSize = (frequ == frequMin) ? fontMin : (frequ / frequMax) * (fontMax - fontMin) + fontMin;
                box.append(' <a href="#" style="font-size:' + fontSize+ 'pt;" data-tag="' + tag + '">' + tag + '</a>');
            });
        },
        filterSearchResults: function(e) {
            e.preventDefault();
            var tag = $(e.currentTarget).data('tag');
            _.each(this.searchResultSet, function(result) {
                if ( _.indexOf(result.model.get(Voc.hasTag), tag) !== -1 ) {
                    result.$el.show();
                } else {
                    result.$el.hide();
                }
            });
        }
    });
});
