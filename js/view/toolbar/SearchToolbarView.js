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
            'click .search a' : '_clearSearch',
            'click .results button' : 'loadNextPage'
        },
        LOG: Logger.get('SearchToolbarView'),
        initialize: function() {
            this.loadMoreResultsSelector = '.results button';
            this.resulSetSelector = '.results .resultSet';
            this.currentTagFilter = null;
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
        _addToResultSet: function(results) {
            var that = this;
                box = that.$el.find(this.resulSetSelector);
            
            _.each(results, function(result) {
                var view = new EntityView({
                    model : result
                });
                if ( that.getCurrentTagFilter() === null ) {
                    box.append(view.render().$el);
                } else {
                    if ( that._checkModelHasTag(view.model, that.getCurrentTagFilter()) ) {
                        box.append(view.render().$el);
                    } else {
                        box.append(view.render().$el.hide());
                    }
                }
                that.searchResultSet.push(view);
            });
            // XXX Need to check if only new tags
            // could be added and then the tagcloud displayed
            this.displayTagcloud();
        },
        search: function(searchString) {
            var that = this;
            var tags = [searchString];
            EntityData.search(tags, function(results, passThrough) {

                that.$el.find(that.loadMoreResultsSelector).hide();
                that._clearResultSet();
                that._resetCurrentTagFilter();

                that.pageNumber = passThrough.pageNumber;
                that.pageNumbers = passThrough.pageNumbers;
                that.pagesID = passThrough.pagesID;

                // Show or hide results holder
                if ( !_.isEmpty(results) ) {
                    that.$el.find('.results').show();
                } else {
                    that.$el.find('.results').hide();
                }

                that._addToResultSet(results);

                if ( that.pageNumbers > that.pageNumber ) {
                    that.$el.find(that.loadMoreResultsSelector).show();
                }
            });
        },
        loadNextPage: function(e) {
            var that = this,
                box = that.$el.find('.results .resultSet');
            if ( this.pageNumber >= this.pageNumbers ) {
                this.$el.find(this.loadMoreResultsSelector).hide();
                return;
            }
            EntityData.loadSearchNextPage(this.pagesID, this.pageNumber + 1, function(results, passThrough) {
                that.pageNumber = passThrough.pageNumber;

                that._addToResultSet(results);
                if ( that.pageNumber >= that.pageNumbers ) {
                    that.$el.find(that.loadMoreResultsSelector).hide();
                }
            });
        },
        _clearResultSet: function() {
           _.each(this.searchResultSet, function(view) {
               view.remove();
           });
           this.searchResultSet = [];
           this.pageNumber = null;
           this.pageNumbers = null;
           this.pagesID = null;
        },
        _clearSearch: function(e) {
           e.preventDefault();
           this.$el.find('.search input').val('');
           this.$el.find('.tagcloud').empty();
           this.$el.find('.results').hide();
           this.tagCloud = {};
           this._clearResultSet();
           this._resetCurrentTagFilter();
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
                var fontSize = (frequ === frequMin) ? fontMin : (frequ / frequMax) * (fontMax - fontMin) + fontMin,
                    tagClass = 'badge';
                if ( that.getCurrentTagFilter() === tag ) {
                    tagClass += ' selected';
                }
                box.append(' <span class="' + tagClass + '"><a href="#" style="font-size:' + fontSize+ 'px;" data-tag="' + tag + '">' + tag + '</a></span>');
            });
        },
        filterSearchResults: function(e) {
            var that = this,
                currentTarget = $(e.currentTarget),
                tagcloud = $(this.$el).find('.tagcloud'),
                tag = currentTarget.data('tag'),
                tmpTags;
            e.preventDefault();

            this.currentTagFilter = tag;
            tagcloud.find('span.badge').removeClass('selected');
            currentTarget.parent().addClass('selected');

            _.each(this.searchResultSet, function(result) {
                if ( that._checkModelHasTag(result.model, tag) ) {
                    result.$el.show();
                } else {
                    result.$el.hide();
                }
            });
        },
        _checkModelHasTag: function(model, tag) {
            // Deals with single tag case
            tmpTags = model.get(Voc.hasTag);
            if ( _.isString(tmpTags) ) {
                tmpTags = [tmpTags];
            }
            
            if ( _.indexOf(tmpTags, tag) !== -1 ) {
                return true;
            } else {
                return false;
            }
        },
        getCurrentTagFilter: function() {
            return this.currentTagFilter;
        },
        _resetCurrentTagFilter: function() {
            this.currentTagFilter = null;
        }
    });
});
