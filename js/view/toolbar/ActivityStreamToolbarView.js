define(['logger', 'tracker', 'underscore', 'jquery', 'backbone', 'spin', 'voc', 'userParams',
        'utils/InputValidation',
        'text!templates/toolbar/activity_stream.tpl', 'text!templates/toolbar/components/selected_user.tpl',
        'view/sss/ActivityView', 'view/sss/EntityRecommendationView',
        'data/sss/ActivityData', 'data/EntityData',
        'utils/SearchHelper', 'utils/SystemMessages'], function(Logger, tracker, _, $, Backbone, Spinner, Voc, userParams, InputValidation, ActivityStreamTemplate, SelectedUserTemplate, ActivityView, EntityRecommendationView, ActivityData, EntityData, SearchHelper, SystemMessages){
    return Backbone.View.extend({
        events: {
            'change input[name="showInToolbar[]"]' : 'filterStream',
            'click .activityStreamRefresh' : 'fetchRefreshActivityStream'
        },
        LOG: Logger.get('ActivityStreamToolbarView'),
        initialize: function() {
            this.streamSelector = '.stream';
            this.streamResultSetSelector = '.stream .resultSet';
            this.activityResultViews = [];
            this.recommendationsResultViews = [];

            this.fetchActivityStream();
        },
        render: function() {
            var that = this,
                notifications = _.template(ActivityStreamTemplate);
            this.$el.html(notifications);

            this.addAjaxLoader(this.$el.find(this.streamSelector));
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
            element.prepend(wrapper);
            this.spinner.spin(wrapper);
        },
        removeAjaxLoader: function(element) {
            this.spinner.stop();
            element.find('.ajaxLoader').remove();
        },
        fetchActivities: function() {
            var that = this,
                data = {
                types : [
//'removeCategories',
'addEntityToLearnEpVersion',
'changeEntityForLearnEpVersionEntity',
'moveLearnEpVersionEntity',
'removeLearnEpVersionEntity',
'addCircleToLearnEpVersion',
'changeLearnEpVersionCircleLabel',
'moveLearnEpVersionCircle',
'removeLearnEpVersionCircle',
'shareLearnEpWithUser',
'copyLearnEpForUsers',
'addEntityToLearnEpCircle',
'removeEntityFromLearnEpCircle',
'removeLearnEpVersionCircleWithEntitites',
'changeLearnEpVersionCircleDescription'
                ],
                includeOnlyLastActivities : true,
                startTime: this.activitiesFetchTime ? this.activitiesFetchTime : null
            },
            promise = ActivityData.getActivities(data),
            defer = $.Deferred();

            promise.done(function(activities, passThrough) {
                that.activitiesFetchTime = passThrough['queryTime'];
                defer.resolve(activities, passThrough);
            }).fail(function(f) {
                defer.resolve([], { 'queryTime' : null });
            });

            return defer.promise();
        },
        fetchRecommendations: function() {
            var data = {
                    forUser : userParams.user,
                    maxResources : 20,
                    typesToRecommOnly : ['evernoteResource', 'evernoteNote', 'evernoteNotebook', 'uploadedFile', 'placeholder', 'link']
                },
                promise = EntityData.getRecommResources(data),
                defer = $.Deferred();

            promise.done(function(entities) {
                defer.resolve(entities);
            }).fail(function(f) {
                defer.resolve([]);
            });

            return defer.promise();
        },
        fetchActivityStream: function() {
            var that = this,
                activitiesPromise = this.fetchActivities(),
                recommendationsPromise = this.fetchRecommendations();


            // Even one failure will prevent it from working, but all the wrapper
            // methods return their own promise object and resolve with empty
            // data even on case of reject
            $.when(activitiesPromise, recommendationsPromise)
                .done(function(activitiesData, recommendations) {
                    var activities = activitiesData[0];
                    that.LOG.debug('fetchActivityStream', activities, recommendations);

                    // Deal with activities
                    if ( !_.isEmpty(that.activityResultViews) ) {
                        _.each(that.activityResultViews, function(view) {
                            view.remove();
                        });
                        that.activityResultViews = [];
                    }
                    _.each(activities, function(activity) {
                        var view = new ActivityView({
                            model : activity
                        });
                        that.activityResultViews.push(view);
                    });

                    // Deal with recommendations
                    if ( !_.isEmpty(that.recommendationsResultViews) ) {
                        _.each(that.recommendationsResultViews, function(view) {
                            view.remove();
                        });
                        that.recommendationsResultViews = [];
                    }
                    _.each(recommendations, function(recommendation) {
                        var view = new EntityRecommendationView({
                            model : recommendation
                        });
                        that.recommendationsResultViews.push(view);
                    });

                    that.displayActivityStream();
                    that.removeAjaxLoader(that.$el.find(that.streamSelector));
                }).fail(function() {
                    that.LOG.debug('fetchActivityStream Failed');
                    that.removeAjaxLoader(that.$el.find(that.streamSelector));
                });
        },
        fetchRefreshActivityStream: function(e) {
            var that = this,
                currentTarget = $(e.currentTarget),
                activitiesPromise = this.fetchActivities();

            currentTarget.prop('disabled', true);

            this.addAjaxLoader(this.$el.find(this.streamSelector));

            $.when(activitiesPromise)
                .done(function(activitiesData) {
                    var activities = activitiesData[0];
                    that.LOG.debug('fetchRefreshActivityStream', activities);

                    // Remove extsting views
                    // Deal with activities
                    if ( !_.isEmpty(that.activityResultViews) ) {
                        _.each(that.activityResultViews, function(view) {
                            view.remove();
                        });
                    }

                    // Deal with recommendations
                    if ( !_.isEmpty(that.recommendationsResultViews) ) {
                        _.each(that.recommendationsResultViews, function(view) {
                            view.remove();
                        });
                    }

                    // Deal with activities
                    _.each(activities, function(activity) {
                        // TODO Check if already present, just in case
                        var view = new ActivityView({
                            model : activity
                        });

                        if ( !that.$el.find('#showActivities').is(':checked') ) {
                            view.$el.hide();
                        }

                        that.activityResultViews.push(view);
                    });

                    that.displayActivityStream();

                    currentTarget.prop('disabled', false);
                    that.removeAjaxLoader(that.$el.find(that.streamSelector));
                }).fail(function() {
                    currentTarget.prop('disabled', false);
                    that.removeAjaxLoader(that.$el.find(that.streamSelector));
                });
        },
        displayActivityStream: function() {
            var resultSet = this.$el.find(this.streamResultSetSelector);
                combined = this.activityResultViews.concat(this.recommendationsResultViews);

            var sortedViews = _.sortBy(combined, function(view) {
                // Get reverse sort order
                return view.model.get(Voc.creationTime) * -1;
            });

            _.each(sortedViews, function(view) {
                resultSet.append(view.render().$el);
            });
        },
        _showHideStreamViews: function(views, doShow) {
           if ( views.length > 0 ) {
               _.each(views, function(view) {
                   if ( doShow ) {
                       view.$el.show();
                   } else {
                       view.$el.hide();
                   }
               });
           }
        },
        filterStream: function(e) {
            this.LOG.debug('FilterStream', e);
            var currentTarget = $(e.currentTarget),
                value = currentTarget.val(),
                isChecked = currentTarget.is(':checked'),
                views = [];

            this.$el.find('input[name="showInToolbar[]"]').prop('disabled', true);

            switch (value) {
                case 'activities':
                    views = this.activityResultViews;
                    break;
                case 'recommendations':
                    views = this.recommendationsResultViews;
                    break;
            }

            this._showHideStreamViews(views, isChecked);
            this.$el.find('input[name="showInToolbar[]"]').prop('disabled', false);

            if ( isChecked ) {
                tracker.info(tracker.SETFILTER, tracker.NOTIFICATIONTAB, null, value);
            } else {
                tracker.info(tracker.REMOVEFILTER, tracker.NOTIFICATIONTAB, null, value);
            }
        }
    });
});
