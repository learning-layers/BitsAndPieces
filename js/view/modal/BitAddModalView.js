define(['config/config', 'logger', 'underscore', 'jquery', 'backbone',
        'data/EntityData',
        'utils/SystemMessages', 'utils/LocalMessages', 'utils/InputValidation',
        'text!templates/modal/bit_add_modal.tpl'], function(appConfig, Logger, _, $, Backbone, EntityData, SystemMessages, LocalMessages, InputValidation, BitAddTemplate){
    return Backbone.View.extend({
        events: {
            'submit form' : 'submitForm',
            'hide.bs.modal' : 'hideBsModal',
            'click .btn-primary' : 'submitForm',
            'keyup input#bitLabel' : 'revalidateBitLabel',
            'keyup textarea#bitDescription' : 'revalidateBitDescription',
            'change input#bitFile' : 'revalidateBitFile'
        },
        LOG: Logger.get('BitAddModalView'),
        initialize: function() {
            this.localMessagesSelector = '.localMessages';
            this.bitAddModalSelector = '#bitAddModal';
            this.labelInputSelector = '#bitLabel';
            this.descriptionSelector = '#bitDescription';
            this.fileSelector = '#bitFile';
            this.descriptionMaxLength = appConfig.entityDescriptionMaxLength;
        },
        render: function() {
            this.$el.html(_.template(BitAddTemplate, {
                rows: appConfig.modalDescriptionRows,
                descriptionMaxLength: this.descriptionMaxLength
            }));
            
            return this;
        },
        showModal: function() {
            if ( !this.isFormDataSupported() ) {
                SystemMessages.addDangerMessage('Your current Browser does not support this feature. Please update it or use Google Chrome instead.');
                return;
            }
            this.$el.find(this.bitAddModalSelector).modal('show');
        },
        hideModal: function() {
            this.$el.find(this.bitAddModalSelector).modal('hide');
        },
        submitForm: function(e) {
            e.preventDefault();

            this.disableDialog();

            var that = this;

            LocalMessages.clearMessages(this.$el.find(this.localMessagesSelector));

            var validateSuccess = true;

            if ( !this.validateBitLabel() ) {
                validateSuccess = false;
            }
            if ( !this.validateBitDescription() ) {
                validateSuccess = false;
            }
            if ( !this.validateBitFile() ) {
                validateSuccess= false;
            }

            if ( !validateSuccess ) {
                this.enableDialog();
                return false;
            }

            var label = this.$el.find(this.labelInputSelector).val(),
                description = this.$el.find(this.descriptionSelector).val(),
                file = this.$el.find(this.fileSelector).get(0).files[0],
                promise = null,
                formData = new FormData();

            formData.append('file', file);
            formData.append('label', label);
            formData.append('description', description);
            formData.append('mimeType', file.type);

            promise = EntityData.uploadFile(formData);


            promise.done(function(result) {
                that.enableDialog();
                that.hideModal();
                SystemMessages.addSuccessMessage('New Bit has been added.');
            }).fail(function(f) {
                that.enableDialog();
                LocalMessages.addDangerMessage(that.$el.find(that.localMessagesSelector), 'A Bit could not be added!');
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
                descriptionElement = this.$el.find(this.descriptionSelector),
                fileElement = this.$el.find(this.fileSelector);

            LocalMessages.clearMessages(this.$el.find(this.localMessagesSelector));

            labelElement.val('');
            descriptionElement.val('');
            fileElement.val('');

            InputValidation.removeAlertsFromParent(labelElement);
            InputValidation.removeValidationStateFromParent(labelElement);

            InputValidation.removeAlertsFromParent(descriptionElement);
            InputValidation.removeValidationStateFromParent(descriptionElement);

            InputValidation.removeAlertsFromParent(fileElement);
            InputValidation.removeValidationStateFromParent(fileElement);
        },
        validateBitLabel: function() {
            var element = this.$el.find(this.labelInputSelector),
                alertText = 'Label is required!';

            return InputValidation.validateTextInput(element, alertText);
        },
        revalidateBitLabel: function() {
            this.validateBitLabel();
        },
        validateBitDescription: function() {
            var element = this.$el.find(this.descriptionSelector),
                alertText = 'Maximum number of allowed characters exceeded!';

            return InputValidation.validateTextInputLength(element, this.descriptionMaxLength, alertText);
        },
        revalidateBitDescription: function() {
            this.validateBitDescription();
        },
        validateBitFile: function() {
            var element = this.$el.find(this.fileSelector),
                alertText = 'File is required!';
            return InputValidation.validateFileInput(element, alertText);
        },
        revalidateBitFile: function() {
            this.validateBitFile();
        },
        isFormDataSupported() {
            return !! window.FormData;
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
