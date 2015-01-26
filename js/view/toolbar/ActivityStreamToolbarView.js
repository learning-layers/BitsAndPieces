define(['logger', 'tracker', 'underscore', 'jquery', 'backbone', 'spin', 'voc', 'userParams',
        'utils/InputValidation',
        'text!templates/toolbar/activity_stream.tpl', 'text!templates/toolbar/components/selected_user.tpl',
        'view/sss/MessageView', 'view/sss/ActivityView', 'view/sss/EntityRecommendationView',
        'data/sss/MessageData', 'data/sss/ActivityData', 'data/EntityData',
        'utils/SearchHelper'], function(Logger, tracker, _, $, Backbone, Spinner, Voc, userParams, InputValidation, ActivityStreamTemplate, SelectedUserTemplate, MessageView, ActivityView, EntityRecommendationView, MessageData, ActivityData, EntityData, SearchHelper){
    return Backbone.View.extend({
        events: {
            'keypress textarea[name="messageText"]' : 'updateOnEnter',
            'keyup textarea[name="messageText"]' : 'revalidateMessageText',
            'click .selectedUser > span' : 'removeSelectedUser',
            'change input[name="showInToolbar[]"]' : 'filterStream',
            'bnp:markMessageAsRead' : 'reduceAndUpdateUnreadMessagesCount'
        },
        LOG: Logger.get('ActivityStreamToolbarView'),
        initialize: function() {
            this.messageTextCharactersLimit = 300;
            this.activityResultViews = [];
            this.messageResultViews = [];
            this.recommendationsResultViews = [];
            this.selectedUsers = [];
            this.unreadMessagesCount = 0;
            this.messageRecipientSelector = 'input[name="messageRecipient"]';
            this.messageTextSelector = 'textarea[name="messageText"]';

            this.fetchActivityStream();
        },
        render: function() {
            var that = this,
                notifications = _.template(ActivityStreamTemplate);
            this.$el.html(notifications);

            // Initialize user select autocomplete
            this.$el.find(this.messageRecipientSelector).autocomplete({
                source: SearchHelper.userAutocompleteSource,
                select: function(event, ui) {
                    event.preventDefault();
                    that.addSelectedUser(event, ui, this);
                }
            });

            this.resetCharactersRemaining();
            this.$el.find(this.messageTextSelector).on('keyup', function(e) {
                var thisElem = $(this),
                    charsRemainingElem = thisElem.next().find('.charactersRemaining'),
                    remaining = that.messageTextCharactersLimit - thisElem.val().length;

                if ( remaining === 0 ) {
                    e.preventDefault();
                } else if ( remaining < 0 ) {
                    thisElem.val(thisElem.val().substring(0, that.messageTextCharactersLimit));
                }

                charsRemainingElem.html( ( remaining >= 0 ) ? remaining : 0 );
            });
        },
        updateOnEnter: function(e) {
            if (e.keyCode == 13) {
                this.LOG.debug('updateOnEnter', e);
                e.preventDefault();
                this.sendMessage(e);
            }
        },
        addSelectedUser: function(event, ui, autocomplete) {
            if ( _.indexOf(this.selectedUsers, ui.item.value) === -1 ) {
                var input = $(autocomplete);
                this.selectedUsers.push(ui.item.value);
                input.val('');
                input.parent().append(_.template(SelectedUserTemplate, {
                    value : ui.item.value,
                    label : ui.item.label
                }));
                this.validateMessageRecipient();
                // Disable input as only one recipient is allowed
                input.prop('disabled', true);
            }
        },
        removeSelectedUser: function(e) {
            var currentTarget = $(e.currentTarget),
                removable = currentTarget.parent();
            this.selectedUsers = _.without(this.selectedUsers, removable.data('value'));

            removable.remove();
            this.validateMessageRecipient();
            // Enable input once recipient is removed
            this.$el.find(this.messageRecipientSelector).prop('disabled', false);
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
        sendMessage: function(e) {
            var currentTarget = $(e.currentTarget);
            if ( this.messageBeingSent === true ) {
                return false;
            }

            var that = this,
                hasErrors = false;

            if ( !this.validateMessageRecipient() ) {
                hasErrors = true;
            }

            if ( !this.validateMessageText() ) {
                hasErrors = true;
            }

            if ( hasErrors ) {
                return false;
            }

            this.messageBeingSent = true;
            InputValidation.removeAlerts(this.$el.find('.writeMessage'));
            this.addAjaxLoader(currentTarget.parent());

            var promise = MessageData.sendMessage(this.selectedUsers[0], this.$el.find(this.messageTextSelector).val());

            promise.done(function() {
                that.removeAjaxLoader(currentTarget.parent());
                that.messageBeingSent = false;
                that._cleanUpAdterSendMessage();
            });

            promise.fail(function() {
                that.removeAjaxLoader(currentTarget.parent());
                that.messageBeingSent = false;
                InputValidation.addAlert(that.$el.find('.writeMessage > label'), 'alert-danger', 'Message could not be sent! Please try again.');
            });
        },
        _cleanUpAdterSendMessage: function() {
            var that = this;

            this.$el.find(this.messageRecipientSelector).val('');
            this.$el.find('.selectedUser').remove();
            this.selectedUsers = [];
            // Enable user selector once cleanUp procedure runs
            this.$el.find(this.messageRecipientSelector).prop('disabled', false);

            // Disable message text input validation temporarily
            this.disableMessageTextValidation = true;
            this.$el.find(this.messageTextSelector).val('');

            this.resetCharactersRemaining();
        },
        validateMessageRecipient: function() {
            var element = this.$el.find(this.messageRecipientSelector),
                alertText = 'Please select at least one user from suggested list!';

            return InputValidation.validateUserSelect(element, this.selectedUsers, alertText);
        },
        validateMessageText: function() {
            var element = this.$el.find(this.messageTextSelector),
                alertText = 'Please provide message text!';

            return InputValidation.validateTextInput(element, alertText);
        },
        revalidateMessageText: function(e) {
            if ( !this.disableMessageTextValidation ) {
                this.validateMessageText();
            } else {
                // Re-enable message text input validation
                this.disableMessageTextValidation = false;
            }
        },
        fetchActivities: function() {
            var data = {
                types : [
                    'addCategory',
                    'removeCategories',
                    //'createLearnEp',
                    'addEntityToLearnEpVersion',
                    'updateLearnEpVersionEntity', // Potential slow-down due to a large number
                    'removeLearnEpVersionEntity',
                    'addCircleToLearnEpVersion',
                    'updateLearnEpVersionCircle', // Petential slow-down due to a large number
                    'removeLearnEpVersionCircle',
                    'shareLearnEpWithUser'
                ]
            },
            promise = ActivityData.getActivities(data);

            return promise;
        },
        fetchMessages: function() {
            var promise = MessageData.getMessages(true);

            return promise;
        },
        fetchRecommendations: function() {
            var data = {
                    forUser : userParams.user,
                    maxResources : 20,
                    typesToRecommOnly : ['file', 'evernoteResource', 'evernoteNote', 'evernoteNotebook']
                },
                promise = EntityData.getRecommResources(data);

            return promise;
        },
        fetchActivityStream: function() {
            var that = this,
                activitiesPromise = this.fetchActivities(),
                messagesPromise = this.fetchMessages(),
                recommendationsPromise = this.fetchRecommendations();

            // XXX Even if one of the call is rejected, nothing will be displayed
            // Probably need to tune the corresponding calls to always resolve
            // just resolve with an empty array in case of failure.
            $.when(activitiesPromise, messagesPromise, recommendationsPromise)
                .done(function(activities, messages, recommendations) {
                    that.LOG.debug('fetchActivityStream', activities, messages, recommendations);

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

                    // Deal with messages
                    if ( !_.isEmpty(that.messageResultViews) ) {
                        _.each(that.messageResultViews, function(view) {
                            view.remove();
                        });
                        that.messageResultViews = [];
                        that.unreadMessagesCount = 0;
                    }
                    _.each(messages, function(message) {
                        var view = new MessageView({
                            model : message
                        });
                        that.messageResultViews.push(view);
                        if ( view.model.get(Voc.isRead) !== true ) {
                            that.unreadMessagesCount += 1;
                        }
                    });
                    that.addUpdateUnreadMessagesCount();

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
                });
            // TODO Check if fail handler is also needed
        },
        displayActivityStream: function() {
            var resultSet = this.$el.find('.stream .resultSet');
                combined = this.activityResultViews.concat(this.messageResultViews, this.recommendationsResultViews);

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
                case 'messages':
                    views = this.messageResultViews;
                    break;
                case 'notifications':
                    // TODO Handle this when implemented
                    break;
                case 'recommendations':
                    views = this.recommendationsResultViews;
                    break;
            }

            this._showHideStreamViews(views, isChecked);
            this.$el.find('input[name="showInToolbar[]"]').prop('disabled', false);
        },
        addUpdateUnreadMessagesCount: function() {
            var showMessagesLabel = this.$el.find('label[for="showMessages"]'),
                theCountBadge = showMessagesLabel.find('span.badge');

            if ( this.unreadMessagesCount > 0) {
                if ( theCountBadge.length > 0 ) {
                    theCountBadge.html(this.unreadMessagesCount);
                } else {
                    showMessagesLabel.append(' <span class="badge">' + this.unreadMessagesCount + '</span>');
                }
            } else {
                if ( theCountBadge.length > 0 ) {
                    theCountBadge.remove();
                }
            }
        },
        reduceAndUpdateUnreadMessagesCount: function(e) {
            this.unreadMessagesCount -= 1;
            this.addUpdateUnreadMessagesCount();
        },
        resetCharactersRemaining: function() {
            this.$el.find(this.messageTextSelector).next().find('.charactersRemaining').html(this.messageTextCharactersLimit);
        }
    });
});
