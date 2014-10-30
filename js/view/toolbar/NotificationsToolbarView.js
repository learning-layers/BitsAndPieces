define(['logger', 'tracker', 'underscore', 'jquery', 'backbone', 'voc', 
        'utils/InputValidation',
        'text!templates/toolbar/notifications.tpl', 'text!templates/toolbar/components/selected_user.tpl',
        'data/episode/UserData'], function(Logger, tracker, _, $, Backbone, Voc, InputValidation, NotificationsTemplate, SelectedUserTemplate, UserData){
    return Backbone.View.extend({
        events: {
            'keypress textarea[name="messageText"]' : 'updateOnEnter',
            'keyup textarea[name="messageText"]' : 'revalidateMessageText',
            'click .selectedUser > span' : 'removeSelectedUser'
        },
        LOG: Logger.get('NotificationsToolbarView'),
        initialize: function() {
            this.selectedUsers = [];
            this.messageRecipientSelector = 'input[name="messageRecipient"]';
            this.messageTextSelector = 'textarea[name="messageText"]';
        },
        render: function() {
            var that = this,
                notifications = _.template(NotificationsTemplate);
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
            }
        },
        removeSelectedUser: function(e) {
            var removable = $(e.currentTarget).parent();
            this.selectedUsers = _.without(this.selectedUsers, removable.data('value'));

            removable.remove();
            this.validateMessageRecipient();
        },
        sendMessage: function(e) {
            var hasErrors = false;

            if ( !this.validateMessageRecipient() ) {
                hasErrors = true;
            }

            if ( !this.validateMessageText() ) {
                hasErrors = true;
            }

            if ( hasErrors ) {
                return false;
            }

            console.error('NOT IMPLEMENTED');

            this._cleanUpAdterSendMessage();
        },
        _cleanUpAdterSendMessage: function() {
            var that = this;

            this.$el.find(this.messageRecipientSelector).val('');
            this.$el.find('.selectedUser').remove();
            this.selectedUsers = [];

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
        }
    });
});
