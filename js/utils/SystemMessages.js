define(['logger','jquery', 'backbone', 'underscore',
        'text!templates/messages/dismissible.tpl'],
function (Logger, $, Backbone, _, DismissibleAlertTemplate) {
    return {
        LOG: Logger.get('SystemMessages'),
        addMessage: function(type, text, clearWithTimeout) {
            this.LOG.debug('Add dismissible message', text, clearWithTimeout);

            if ( !clearWithTimeout ) {
                clearWithTimeout = true;
            }

            var message = _.template(DismissibleAlertTemplate, {
                type: type, // success, info, warning, danger
                message: text
            });
            message = $(message);

            if ( clearWithTimeout ) {
                var timeoutId = setTimeout(function() {
                    message.alert('close');
                }, 20000);

                message.on('close.bs.alert', function() {
                    clearTimeout(timeoutId);
                });
            }

            $(document).find('#systemMessages').append(message);
        },
        addSuccessMessage: function(message, clearWithTimeout) {
            this.addMessage('success', message, clearWithTimeout);
        },
        addInfoMessage: function(message, clearWithTimeout) {
            this.addMessage('info', message, clearWithTimeout);
        },
        addWarningMessage: function(message, clearWithTimeout) {
            this.addMessage('warning', message, clearWithTimeout);
        },
        addDangerMessage: function(message, clearWithTimeout) {
            this.addMessage('danger', message, clearWithTimeout);
        }
    }
});
