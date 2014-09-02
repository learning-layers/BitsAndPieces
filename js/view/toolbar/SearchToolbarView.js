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

                // Show or hide results holder
                if ( !_.isEmpty(results) ) {
                    that.$el.find('.results').show();
                } else {
                    that.$el.find('.results').hide();
                }

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
                fontMax = 14,
                frequMin = null,
                frequMax = null,
                tmpTags;

            that.tagCloud = {};
            box.empty();
            _.each(this.searchResultSet, function(result) {
                // TODO Check if a better solution could be implemented
                // This is here to make sure that all entities have finished
                // loading and have some tags associated with them.
                if ( result.model.get(Voc.hasTag) === undefined) {
                    _.defer(function() {
                        that.displayTagcloud();
                    });
                    return;
                }
                if ( result.model.get(Voc.hasTag) ) {
                    tmpTags = result.model.get(Voc.hasTag);
                    // Deals with single tag case
                    if ( _.isString(tmpTags) ) {
                        tmpTags = [tmpTags];
                    }
                    _.each(tmpTags, function(tag) {
                        if ( _.has(that.tagCloud, tag) ) {
                            that.tagCloud[tag] += 1;
                        } else {
                            that.tagCloud[tag] = 1;
                        }
                    });
                }

            });
            var index = 0;
            _.each(_.values(that.tagCloud), function(key, frequ) {
                if (0 === index) {
                    frequMin = frequ;
                    frequMax = frequ;
                }
                if (frequ > frequMax) {
                    frequMax = frequ;
                } else if (frequ < frequMin) {
                    frequMin = frequ;
                }
                index += 1;
            });
            _.each(that.tagCloud, function(frequ, tag) {
                var fontSize = (frequ === frequMin) ? fontMin : (frequ / frequMax) * (fontMax - fontMin) + fontMin;
                box.append(' <span class="badge"><a href="#" style="font-size:' + fontSize+ 'px;" data-tag="' + tag + '">' + tag + '</a></span>');
            });
        },
        filterSearchResults: function(e) {
            var tag = $(e.currentTarget).data('tag'),
                tmpTags;
            e.preventDefault();
            _.each(this.searchResultSet, function(result) {
                // Deals with single tag case
                tmpTags = result.model.get(Voc.hasTag);
                if ( _.isString(tmpTags) ) {
                    tmpTags = [tmpTags];
                }
                if ( _.indexOf(tmpTags, tag) !== -1 ) {
                    result.$el.show();
                } else {
                    result.$el.hide();
                }
            });
        }
    });
});
