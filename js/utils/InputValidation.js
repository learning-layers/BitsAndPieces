define(['logger','jquery', 'backbone', 'underscore',
        'text!templates/messages/dismissible.tpl'],
function (Logger, $, Backbone, _, DismissibleAlertTemplate) {
    return {
        LOG: Logger.get('InputValidation'),
        addValidationStateToParent: function(element, stateClass) {
            element.parent().addClass(stateClass);
        },
        removeValidationStateFromParent: function(element) {
            element.parent().removeClass('has-error has-warning has-success');
        },
        addAlert: function(element, stateClass, text) {
            // alert-success, alert-info, alert-warning, alert-danger
            element.after('<div class="alert ' + stateClass+ '" role="alert">' + text + '</div>');
        },
        removeAlertsFromParent: function(element) {
            this.removeAlerts(element.parent());
        },
        removeAlerts: function(element) {
            element.find('.alert').remove();
        },
        validateUserSelect: function(element, selectedUsers, alertText) {
            this.removeAlertsFromParent(element);
            if ( _.isEmpty(selectedUsers) ) {
                this.addValidationStateToParent(element, 'has-error');
                this.addAlert(element, 'alert-danger', alertText);
                return false;
            } else {
                this.removeValidationStateFromParent(element);
                return true;
            }
        },
        validateTextInput: function(element, alertText) {       
            var elementText = element.val();
                                                     
            this.removeAlertsFromParent(element);
            if ( _.isEmpty(elementText.trim()) ) {
                this.addValidationStateToParent(element, 'has-error');
                this.addAlert(element, 'alert-danger', alertText);
                return false;
            } else {
                this.removeValidationStateFromParent(element);
                return true;
            }
        },
        validateFileInput: function(element, alertText) {
            var filesCount = element.get(0).files.length;

            this.removeAlertsFromParent(element);
            if ( filesCount === 0 ) {
                this.addValidationStateToParent(element, 'has-error');
                this.addAlert(element, 'alert-danger', alertText);
                return false;
            } else {
                this.removeValidationStateFromParent(element);
                return true;
            }
        }
    }
});
