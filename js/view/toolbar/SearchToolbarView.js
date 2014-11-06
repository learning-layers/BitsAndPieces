define(['logger', 'tracker', 'underscore', 'jquery', 'backbone', 'spin', 'voc',
        'text!templates/toolbar/search.tpl',
        'data/EntityData', 'view/sss/EntityView'], function(Logger, tracker, _, $, Backbone, Spinner, Voc, SearchTemplate, EntityData, EntityView){
    return Backbone.View.extend({
        searchResultSet : [],
        tagCloud: {},
        currentTagFilter : null,
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
            this.resultsSelector = '.results';
            this.resultSetSelector = '.results .resultSet';
            this.tagCloudSelector = '.tagcloud';
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
        _getModelTagsArray: function(model) {
            // Can return undefined/null instead of an array
            // Deals with single tag case
            var tags = model.get(Voc.hasTag);
            if ( _.isString(tags) ) {
                tags = [tags];
            }

            return tags;
        },
        _addModelTagsToTagCloud: function(model) {
            var that = this,
                tmpTags = this._getModelTagsArray(model);
            if ( tmpTags ) {
                _.each(tmpTags, function(tag) {
                    if ( _.has(that.tagCloud, tag) ) {
                        that.tagCloud[tag] += 1;
                    } else {
                        that.tagCloud[tag] = 1;
                    }
                });
            }
        },
        _addToResultSet: function(results) {
            var that = this;
                box = that.$el.find(this.resultSetSelector);
            
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
                that._addModelTagsToTagCloud(view.model);
            });
            this.displayTagcloud();
        },
        _checkModelHasTag: function(model, tag) {
            var tmpTags = this._getModelTagsArray(model);

            if ( _.indexOf(tmpTags, tag) !== -1 ) {
                return true;
            } else {
                return false;
            }
        },
        _resetTagCloud: function() {
            this.tagCloud = {};
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
           this.$el.find(this.tagCloudSelector).empty();
           this.$el.find(this.resultsSelector).hide();
           this._resetTagCloud();
           this._clearResultSet();
           this._resetCurrentTagFilter();
        },
        _resetCurrentTagFilter: function() {
            this.currentTagFilter = null;
        },
        getCurrentTagFilter: function() {
            return this.currentTagFilter;
        },
        addAjaxLoader: function(element) {
            if ( !this.spinner ) {
                this.spinner = new Spinner({
                    radius : 5,
                    length : 5,
                    width : 2
                });
            }
            var wrapper = document.createElement('div');
            wrapper.className = 'ajaxLoader';
            element.append(wrapper);
            this.spinner.spin(wrapper);
        },
        removeAjaxLoader: function(element) {
            this.spinner.stop();
            element.find('.ajaxLoader').remove();
        },
        search: function(searchString) {
            var that = this,
                tags = [searchString];
            EntityData.search(tags, function(results, passThrough) {

                that.$el.find(that.loadMoreResultsSelector).hide();
                that._clearResultSet();
                that._resetCurrentTagFilter();
                that._resetTagCloud();

                that.pageNumber = passThrough.pageNumber;
                that.pageNumbers = passThrough.pageNumbers;
                that.pagesID = passThrough.pagesID;

                // Show or hide results holder
                if ( !_.isEmpty(results) ) {
                    that.$el.find(that.resultsSelector).show();
                } else {
                    that.$el.find(that.resultsSelector).hide();
                }

                that._addToResultSet(results);

                if ( that.pageNumbers > that.pageNumber ) {
                    that.$el.find(that.loadMoreResultsSelector).show();
                }
            });
        },
        loadNextPage: function(e) {
            var that = this,
                box = this.$el.find(this.resultSetSelector),
                moreResultsElement = this.$el.find(this.loadMoreResultsSelector);

            moreResultsElement.hide().blur();
            this.addAjaxLoader(box);
            if ( this.pageNumber >= this.pageNumbers ) {
                this.removeAjaxLoader(box);
                return;
            }
            EntityData.loadSearchNextPage(this.pagesID, this.pageNumber + 1, function(results, passThrough) {
                that.pageNumber = passThrough.pageNumber;

                that._addToResultSet(results);
                that.removeAjaxLoader(box);
                if ( that.pageNumbers > that.pageNumber ) {
                    moreResultsElement.show();
                }
            });
        },
        clearDatepicker: function(e) {
            e.preventDefault();
            this.$el.find('.filter input.datepicker').val('');
        },
        displayTagcloud: function() {
            var that = this,
                tagCloudElement = this.$el.find(this.tagCloudSelector),
                fontMin = 10,
                fontMax = 14,
                frequMin = null,
                frequMax = null;

            tagCloudElement.empty();

            if ( _.isEmpty(that.tagCloud) ) {
                return;
            }

            frequMin = _.min(that.tagCloud);
            frequMax = _.max(that.tagCloud);

            _.each(that.tagCloud, function(frequ, tag) {
                var fontSize = (frequ === frequMin) ? fontMin : (frequ / frequMax) * (fontMax - fontMin) + fontMin,
                    tagClass = 'badge';
                if ( that.getCurrentTagFilter() === tag ) {
                    tagClass += ' selected';
                }
                tagCloudElement.append(' <span class="' + tagClass + '"><a href="#" style="font-size:' + fontSize+ 'px;" data-tag="' + tag + '">' + tag + '</a></span>');
            });
        },
        filterSearchResults: function(e) {
            var that = this,
                currentTarget = $(e.currentTarget),
                tagcloud = $(this.$el).find(this.tagCloudSelector),
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
        }
    });
});
