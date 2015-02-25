define(['logger', 'underscore', 'jquery', 'backbone',
        'data/EntityData',
        'utils/SystemMessages', 'utils/InputValidation',
        'text!templates/modal/placeholder_add_modal.tpl'], function(Logger, _, $, Backbone, EntityData, SystemMessages, InputValidation, PlaceholderAddTemplate){
    return Backbone.View.extend({
        events: {
            'submit form' : 'submitForm',
            'hide.bs.modal' : 'cleanForm',
            'click .btn-primary' : 'submitForm',
            'keyup input#placeholderLabel' : 'revalidatePlaceholderLabel',
        },
        LOG: Logger.get('PlaceholderAddModalView'),
        initialize: function() {
            this.placeholderAddModalSelector = '#placeholderAddModal';
            this.labelInputSelector = '#placeholderLabel';
            this.descriptionSelector = '#placeholderDescription';
        },
        render: function() {
            this.$el.html(_.template(PlaceholderAddTemplate));
            
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

            if ( !this.validatePlaceholderLabel() ) {
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

            this.hideModal();

            promise.done(function(result) {
                SystemMessages.addSuccessMessage('New Placeholder has been added.');
            }).fail(function(f) {
                SystemMessages.addDangerMessage('A Placeholder could not be added!');
            });
        },
        cleanForm: function() {
            var element = this.$el.find(this.labelInputSelector);

            this.$el.find(this.labelInputSelector).val('');
            this.$el.find(this.descriptionSelector).val('');
            InputValidation.removeAlertsFromParent(element);
            InputValidation.removeValidationStateFromParent(element);
        },
        validatePlaceholderLabel: function() {
            var element = this.$el.find(this.labelInputSelector),
                alertText = 'Label is required!';

            return InputValidation.validateTextInput(element, alertText);
        },
        revalidatePlaceholderLabel: function() {
            this.validatePlaceholderLabel();
        }
    });
});
