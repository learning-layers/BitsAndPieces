define(['logger', 'underscore', 'jquery', 'backbone', 'spin', 'voc',
        'text!templates/toolbar/search.tpl',
        'data/EntityData', 'data/episode/UserData', 'view/sss/EntityView'], function(Logger, _, $, Backbone, Spinner, Voc, SearchTemplate, EntityData, UserData, EntityView){
    return Backbone.View.extend({
        searchResultSet : [],
        tagCloud: {},
        events: {
            'keypress .search input' : 'updateOnEnter', 
            'click .filter .clearDatepicker' : 'clearDatepicker',
            'click .tagcloud a' : 'tagCloudTagClicked',
            'click .search a' : '_clearLabelSearchAndRestart',
            'click .results button' : 'loadNextPage'
        },
        LOG: Logger.get('SearchToolbarView'),
        initialize: function() {
            var that = this,
                promise = UserData.getCurrentUserTagFrequencies();
            this.loadMoreResultsSelector = '.results button';
            this.resultsSelector = '.results';
            this.resultSetSelector = '.results .resultSet';
            this.tagCloudSelector = '.tagcloud';
            this.searchInputSelector = '.search input';
            this.tagSearchSelector = '.tagSearch';

            promise.then(
                function(data) {
                    that.$el.find(that.tagSearchSelector).show();
                    that.tagCloud = data;
                    that.displayTagCloud();
                },
                function(f) {
                    that.LOG.debug('Failed to load tags cloud frequencies', f);
                }
            );
        },
        render: function() {
            var search = _.template(SearchTemplate);
            this.$el.html(search);

            this.$el.find('.filter input.datepicker').datepicker();
            this.$el.find(this.tagSearchSelector).hide();
        },
        updateOnEnter: function(e) {
            if (e.keyCode == 13) {
                this.search($(e.currentTarget).val());
            }
        },
        _addToResultSet: function(results) {
            var that = this;
                box = that.$el.find(this.resultSetSelector);
            
            _.each(results, function(result) {
                var view = new EntityView({
                    model : result
                });
                box.append(view.render().$el);
                that.searchResultSet.push(view);
            });
        },
        //@unused Probably is unused
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
        _clearLabelSearchAndRestart: function(e) {
           e.preventDefault();
           this.$el.find('.search input').val('');
           this.$el.find(this.resultsSelector).hide();
           this._clearResultSet();
           // Trigger a search in case there were any selected tags
           if ( !_.isEmpty(this._getSelectedTags()) ) {
               this.search( this.$el.find(this.searchInputSelector).val() );
           }
        },
        //@unused
        _clearSearch: function(e) {
           e.preventDefault();
           this.$el.find('.search input').val('');
           this.$el.find(this.resultsSelector).hide();
           this.$el.find(this.tagCloudSelector).find('span.selected').removeClass('selected');
           this._clearResultSet();
        },
        _getSelectedTags: function() {
            var selectedTags = [],
                selectedTagElements = this.$el.find(this.tagCloudSelector).find('span.selected');

            if ( selectedTagElements && selectedTagElements.length > 0 ) {
                _.each(selectedTagElements, function(element) {
                    selectedTags.push($(element).find('a').data('tag'));
                });
            }

            return selectedTags;
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
                keywords = [],
                tags = this._getSelectedTags();

            // Replace multiple spaces and split by space
            searchString = searchString.replace(/\s{2,}/g, '');
            keywords = searchString.split(' ');

            EntityData.search(keywords, tags, function(results, passThrough) {

                that.$el.find(that.loadMoreResultsSelector).hide();
                that._clearResultSet();

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
        displayTagCloud: function(data) {
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

            frequMin = _.min(that.tagCloud, function(tag) { return tag.frequ; }).frequ;
            frequMax = _.max(that.tagCloud, function(tag) { return tag.frequ; }).frequ;

            _.each(that.tagCloud, function(single) {
                var tag = single.label,
                    frequ = single.frequ,
                    fontSize = (frequ === frequMin) ? fontMin : (frequ / frequMax) * (fontMax - fontMin) + fontMin,
                    tagClass = 'badge';
                tagCloudElement.append(' <span class="' + tagClass + '"><a href="#" style="font-size:' + fontSize+ 'px;" data-tag="' + tag + '">' + tag + '</a></span>');
            });
        },
        tagCloudTagClicked: function(e) {
            e.preventDefault();
            var currentTarget = $(e.currentTarget);

            currentTarget.parent().toggleClass('selected');
            this.search( this.$el.find(this.searchInputSelector).val() );
        }
    });
});
