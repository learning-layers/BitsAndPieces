define(['logger', 'underscore', 'jquery', 'backbone',
        'data/EntityData',
        'utils/SystemMessages', 'utils/InputValidation',
        'text!templates/modal/bit_add_modal.tpl'], function(Logger, _, $, Backbone, EntityData, SystemMessages, InputValidation, BitAddTemplate){
    return Backbone.View.extend({
        events: {
            'submit form' : 'submitForm',
            'hide.bs.modal' : 'cleanForm',
            'click .btn-primary' : 'submitForm',
            'keyup input#bitLabel' : 'revalidateBitLabel',
            'change input#bitFile' : 'revalidateBitFile'
        },
        LOG: Logger.get('BitAddModalView'),
        initialize: function() {
            this.bitAddModalSelector = '#bitAddModal';
            this.labelInputSelector = '#bitLabel';
            this.descriptionSelector = '#bitDescription';
            this.fileSelector = '#bitFile';
        },
        render: function() {
            this.$el.html(_.template(BitAddTemplate));
            
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

            var validateSuccess = true;

            if ( !this.validateBitLabel() ) {
                validateSuccess = false;
            }
            if ( !this.validateBitFile() ) {
                validateSuccess= false;
            }

            if ( !validateSuccess ) {
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

            this.hideModal();

            promise.done(function(result) {
                SystemMessages.addSuccessMessage('New Bit has been added.');
            }).fail(function(f) {
                SystemMessages.addDangerMessage('A Bit could not be added!');
            });
        },
        cleanForm: function() {
            var labelElement = this.$el.find(this.labelInputSelector),
                fileElement = this.$el.find(this.fileSelector);

            this.$el.find(this.labelInputSelector).val('');
            this.$el.find(this.descriptionSelector).val('');
            this.$el.find(this.fileSelector).val('');

            InputValidation.removeAlertsFromParent(labelElement);
            InputValidation.removeValidationStateFromParent(labelElement);

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
        }
    });
});
