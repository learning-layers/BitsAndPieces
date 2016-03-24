define(['config/config', 'logger', 'underscore', 'jquery', 'backbone',
        'data/EntityData',
        'utils/SystemMessages', 'utils/LocalMessages', 'utils/InputValidation', 'utils/EntityHelpers',
        'text!templates/modal/link_add_modal.tpl'], function(appConfig, Logger, _, $, Backbone, EntityData, SystemMessages, LocalMessages, InputValidation, EntityHelpers, LinkAddTemplate){
    return Backbone.View.extend({
        events: {
            'submit form' : 'submitForm',
            'hide.bs.modal' : 'hideBsModal',
            'click .btn-primary' : 'submitForm',
            'keyup input#linkLabel' : 'revalidateLabel',
            'keyup textarea#linkDescription' : 'revalidateDescription',
            'shown.bs.modal' : 'triggerAutofocus'
        },
        LOG: Logger.get('LinkAddModalView'),
        initialize: function() {
            this.localMessagesSelector = '.localMessages';
            this.linkAddModalSelector = '#linkAddModal';
            this.uriSelector = '#linkUri';
            this.labelInputSelector = '#linkLabel';
            this.descriptionSelector = '#linkDescription';
            this.descriptionMaxLength = appConfig.entityDescriptionMaxLength;
        },
        render: function() {
            this.$el.html(_.template(LinkAddTemplate, {
                rows: appConfig.modalDescriptionRows,
                descriptionMaxLength: this.descriptionMaxLength
            }));
            
            return this;
        },
        showModal: function() {
            this.$el.find(this.linkAddModalSelector).modal('show');
        },
        hideModal: function() {
            this.$el.find(this.linkAddModalSelector).modal('hide');
        },
        submitForm: function(e) {
            e.preventDefault();

            this.disableDialog();

            var that = this;

            LocalMessages.clearMessages(this.$el.find(this.localMessagesSelector));

            var validateSuccess = true;

            if ( !this.validateUri() ) {
                validateSuccess = false;
            }
            if ( !this.validateLabel() ) {
                validateSuccess = false;
            }
            if ( !this.validateDescription() ) {
                validateSuccess = false;
            }

            if ( !validateSuccess ) {
                this.enableDialog();
                return false;
            }

            var uri = this.$el.find(this.uriSelector).val(),
                label = this.$el.find(this.labelInputSelector).val(),
                description = this.$el.find(this.descriptionSelector).val(),
                promise = null;

            promise = EntityData.addLink({
                link: uri,
                label: label,
                description: description
            });


            promise.done(function(result) {
                that.enableDialog();
                that.hideModal();
                SystemMessages.addSuccessMessage('New Link has been added.');

                EntityHelpers.triggerEntityAddedEvent(result);
            }).fail(function(f) {
                that.enableDialog();
                LocalMessages.addDangerMessage(that.$el.find(that.localMessagesSelector), 'A Link could not be added!');
            });
        },
        hideBsModal: function(e) {
            if ( this.formDisabled === true ) {
                e.preventDefault();
            } else {
                this.cleanForm();
            }
        },
        cleanForm: function() {
            var uriElement = this.$el.find(this.uriSelector),
                labelElement = this.$el.find(this.labelInputSelector),
                descriptionElement = this.$el.find(this.descriptionSelector);

            LocalMessages.clearMessages(this.$el.find(this.localMessagesSelector));

            uriElement.val('');
            labelElement.val('');
            descriptionElement.val('');

            InputValidation.removeAlertsFromParent(uriElement);
            InputValidation.removeValidationStateFromParent(uriElement);

            InputValidation.removeAlertsFromParent(labelElement);
            InputValidation.removeValidationStateFromParent(labelElement);

            InputValidation.removeAlertsFromParent(descriptionElement);
            InputValidation.removeValidationStateFromParent(descriptionElement);
        },
        validateUri: function() {
            var element = this.$el.find(this.uriSelector),
                alertText = 'Url is required and sould be a valid URL!';

            return InputValidation.validateUrlInput(element, alertText);
        },
        validateLabel: function() {
            var element = this.$el.find(this.labelInputSelector),
                alertText = 'Label is required!';

            return InputValidation.validateTextInput(element, alertText);
        },
        revalidateLabel: function() {
            this.validateLabel();
        },
        validateDescription: function() {
            var element = this.$el.find(this.descriptionSelector),
                alertText = 'Maximum number of allowed characters exceeded!';

            return InputValidation.validateTextInputLength(element, this.descriptionMaxLength, alertText);
        },
        revalidateDescription: function() {
            this.validateDescription();
        },
        disableDialog: function() {
            this.formDisabled = true;
            this.$el.find('.modal-footer').find('button').prop('disabled', true);
            this.$el.find('.fa-spinner').show();
        },
        enableDialog: function() {
            this.formDisabled = false;
            this.$el.find('.modal-footer').find('button').prop('disabled', false);
            this.$el.find('.fa-spinner').hide();
        },
        triggerAutofocus: function() {
            this.$el.find(this.uriSelector).trigger('focus');
        }
    });
});
