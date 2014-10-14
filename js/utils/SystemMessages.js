define(['module', 'logger','jquery', 'backbone', 'underscore',
        'text!templates/messages/dismissible.tpl'],
function (module, Logger, $, Backbone, _, DismissibleAlertTemplate) {
    return {
        LOG: Logger.get('SystemMessages'),
        addMessage: function(type, text) {
            this.LOG.debug('Add dismissible message', text);
            var message = _.template(DismissibleAlertTemplate, {
                type: type, // success, info, warning, danger
                message: text
            });
            $(document).find('#systemMessages').append(message);
        },
        addSuccessMessage: function(message) {
            this.addMessage('success', message);
        },
        addInfoMessage: function(message) {
            this.addMessage('info', message);
        },
        addWarningMessage: function(message) {
            this.addMessage('warning', message);
        },
        addDangerMessage: function(message) {
            this.addMessage('danger', message);
        }
    }
});
