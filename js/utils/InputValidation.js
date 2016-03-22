define(['logger','jquery', 'backbone', 'underscore',
        'text!templates/messages/dismissible.tpl'],
function (Logger, $, Backbone, _, DismissibleAlertTemplate) {
    return {
        LOG: Logger.get('InputValidation'),
        _isUrl: function(url) {
            // This one just checks if string looks like a URL, very simple
            // It should begin with http:// or https://
            // It should have at least one character as domain name (any character)
            // It should have a point before domain extension
            // Domain extension should be at least two characters long from a to z
            // Rest of it could have more characters, none is also suitable
            var re = new RegExp("^https?:\/\/.+[.]{1}[a-z]{2,}.*$", "i");
            return re.test(url.trim());
        },
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
        },
        validateTextInputLength: function(element, allowedLength, alertText) {
            var elementText = element.val();

            this.removeAlertsFromParent(element);
            if ( elementText.length > allowedLength ) {
                this.addValidationStateToParent(element, 'has-error');
                this.addAlert(element, 'alert-danger', alertText);
                return false;
            } else {
                this.removeValidationStateFromParent(element);
                return true;
            }
        },
        validateUrlInput: function(element, alertText) {
            var elementText = element.val();

            this.removeAlertsFromParent(element);
            if ( _.isEmpty(elementText.trim()) || !this._isUrl(elementText) ) {
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
