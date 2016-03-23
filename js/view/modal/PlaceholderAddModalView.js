define(['config/config', 'logger', 'underscore', 'jquery', 'backbone',
        'data/EntityData',
        'utils/SystemMessages', 'utils/LocalMessages', 'utils/InputValidation', 'utils/EntityHelpers',
        'text!templates/modal/placeholder_add_modal.tpl'], function(appConfig, Logger, _, $, Backbone, EntityData, SystemMessages, LocalMessages, InputValidation, EntityHelpers, PlaceholderAddTemplate){
    return Backbone.View.extend({
        events: {
            'submit form' : 'submitForm',
            'hide.bs.modal' : 'hideBsModal',
            'click .btn-primary' : 'submitForm',
            'keyup input#placeholderLabel' : 'revalidatePlaceholderLabel',
            'keyup textarea#placeholderDescription' : 'revalidatePlaceholderDescription'
        },
        LOG: Logger.get('PlaceholderAddModalView'),
        initialize: function() {
            this.localMessagesSelector = '.localMessages';
            this.placeholderAddModalSelector = '#placeholderAddModal';
            this.labelInputSelector = '#placeholderLabel';
            this.descriptionSelector = '#placeholderDescription';
            this.descriptionMaxLength = appConfig.entityDescriptionMaxLength;
        },
        render: function() {
            this.$el.html(_.template(PlaceholderAddTemplate, {
                rows: appConfig.modalDescriptionRows,
                descriptionMaxLength: this.descriptionMaxLength
            }));
            
            return this;
        },
        showModal: function() {
            this.$el.find(this.placeholderAddModalSelector).modal('show');
        },
        hideModal: function() {
            this.$el.find(this.placeholderAddModalSelector).modal('hide');
        },
        submitForm: function(e) {
            e.preventDefault();

            var that = this;

            that.disableDialog();

            LocalMessages.clearMessages(this.$el.find(this.localMessagesSelector));

            if ( !( this.validatePlaceholderLabel() === true && this.validatePlaceholderDescription() === true ) ) {
                that.enableDialog();
                return false;
            }

            var label = this.$el.find(this.labelInputSelector).val(),
                description = this.$el.find(this.descriptionSelector).val(),
                promise = null;

            promise = EntityData.addEntity({
                label: label,
                description: description,
                type: 'placeholder'
            });


            promise.done(function(result) {
                that.enableDialog();
                that.hideModal();
                SystemMessages.addSuccessMessage('New Placeholder / Quick Note has been added.');

                EntityHelpers.triggerEntityAddedEvent(result);
            }).fail(function(f) {
                that.enableDialog();
                LocalMessages.addDangerMessage(that.$el.find(that.localMessagesSelector), 'A Placeholder  / Quick Note could not be added!');
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
            var labelElement = this.$el.find(this.labelInputSelector),
                descriptionElement = this.$el.find(this.descriptionSelector);

            LocalMessages.clearMessages(this.$el.find(this.localMessagesSelector));

            labelElement.val('');
            InputValidation.removeAlertsFromParent(labelElement);
            InputValidation.removeValidationStateFromParent(labelElement);
            descriptionElement.val('');
            InputValidation.removeAlertsFromParent(descriptionElement);
            InputValidation.removeValidationStateFromParent(descriptionElement);
        },
        validatePlaceholderLabel: function() {
            var element = this.$el.find(this.labelInputSelector),
                alertText = 'Label is required!';

            return InputValidation.validateTextInput(element, alertText);
        },
        revalidatePlaceholderLabel: function() {
            this.validatePlaceholderLabel();
        },
        validatePlaceholderDescription: function() {
            var element = this.$el.find(this.descriptionSelector),
                alertText = 'Maximum number of allowed characters exceeded!';

            return InputValidation.validateTextInputLength(element, this.descriptionMaxLength, alertText);
        },
        revalidatePlaceholderDescription: function() {
            this.validatePlaceholderDescription();
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
        }

    });
});
