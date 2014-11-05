define(['logger', 'tracker', 'underscore', 'jquery', 'backbone', 'voc', 
        'utils/InputValidation',
        'text!templates/toolbar/activity_stream.tpl', 'text!templates/toolbar/components/selected_user.tpl',
        'view/sss/MessageView',
        'data/episode/UserData', 'data/sss/MessageData'], function(Logger, tracker, _, $, Backbone, Voc, InputValidation, ActivityStreamTemplate, SelectedUserTemplate, MessageView, UserData, MessageData){
    return Backbone.View.extend({
        events: {
            'keypress textarea[name="messageText"]' : 'updateOnEnter',
            'keyup textarea[name="messageText"]' : 'revalidateMessageText',
            'click .selectedUser > span' : 'removeSelectedUser'
        },
        LOG: Logger.get('ActivityStreamToolbarView'),
        initialize: function() {
            this.messageResultViews = [];
            this.selectedUsers = [];
            this.messageRecipientSelector = 'input[name="messageRecipient"]';
            this.messageTextSelector = 'textarea[name="messageText"]';

            this.fetchMessages();
        },
        render: function() {
            var that = this,
                notifications = _.template(ActivityStreamTemplate);
            this.$el.html(notifications);

            // Initialize user select autocomplete
            this.$el.find(this.messageRecipientSelector).autocomplete({
                source: function(request, response) {
                    // TODO Consider making a user search helper, move all the searchc logic there
                    // It could also deal with caching of search results if needed
                    // XXX This get the data multiple times
                    // Need some caching logic
                    var users = UserData.getSearchableUsers();
                    var pattern = new RegExp(request.term, 'i');
                    response(
                        _.filter(users, function(user) {
                            return pattern.test(user.label);
                        })
                    );
                },
                select: function(event, ui) {
                    event.preventDefault();
                    that.addSelectedUser(event, ui, this);
                }
            });
        },
        updateOnEnter: function(e) {
            if (e.keyCode == 13) {
                this.LOG.debug('updateOnEnter', e);
                e.preventDefault();
                this.sendMessage();
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
        sendMessage: function(e) {
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

            var promise = MessageData.sendMessage(this.selectedUsers[0], this.$el.find(this.messageTextSelector).val());

            promise.done(function() {
                that.messageBeingSent = false;
                that._cleanUpAdterSendMessage();
            });

            promise.fail(function() {
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
        fetchMessages: function() {
            var that = this,
                promise = MessageData.getMessages(true);

            promise.done(function(messages) {
                if ( !_.isEmpty(that.messageResultViews) ) {
                    _.each(that.messageResultViews, function(view) {
                        view.remove();
                    });
                    that.messageResultViews = [];
                }
                _.each(messages, function(message) {
                    var view = new MessageView({
                        model : message
                    });
                    that.messageResultViews.push(view);
                });
                that.displayActivityStream();
            });

            promise.fail(function(f) {
                // TODO Remove if unneeded
            });
        },
        displayActivityStream: function() {
            var resultSet = this.$el.find('.stream .resultSet');

            var sortedViews = _.sortBy(this.messageResultViews, function(view) {
                // Get reverse sort order
                return view.model.get(Voc.creationTime) * -1;
            });

            _.each(sortedViews, function(view) {
                resultSet.append(view.render().$el);
            });
        }
    });
});
