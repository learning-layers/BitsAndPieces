define(['logger','jquery', 'backbone', 'underscore',
        'text!templates/messages/dismissible.tpl'],
function (Logger, $, Backbone, _, DismissibleAlertTemplate) {
    return {
        LOG: Logger.get('SystemMessages'),
        addMessage: function(type, text, clearWithTimeout, timeoutValue) {
            this.LOG.debug('Add dismissible message', text, clearWithTimeout);

            if ( clearWithTimeout !== false ) {
                clearWithTimeout = true;
            }

            if ( !timeoutValue ) {
                timeoutValue = 20000;
            }

            var message = _.template(DismissibleAlertTemplate, {
                type: type, // success, info, warning, danger
                message: text
            });
            message = $(message);

            if ( clearWithTimeout ) {
                var timeoutId = setTimeout(function() {
                    message.alert('close');
                }, timeoutValue);

                message.on('close.bs.alert', function() {
                    clearTimeout(timeoutId);
                });
            }

            $(document).find('#systemMessages').append(message);
        },
        addSuccessMessage: function(message, clearWithTimeout, timeoutValue) {
            this.addMessage('success', message, clearWithTimeout, timeoutValue);
        },
        addInfoMessage: function(message, clearWithTimeout, timeoutValue) {
            this.addMessage('info', message, clearWithTimeout, timeoutValue);
        },
        addWarningMessage: function(message, clearWithTimeout, timeoutValue) {
            this.addMessage('warning', message, clearWithTimeout, timeoutValue);
        },
        addDangerMessage: function(message, clearWithTimeout, timeoutValue) {
            this.addMessage('danger', message, clearWithTimeout, timeoutValue);
        }
    }
});
