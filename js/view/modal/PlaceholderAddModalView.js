define(['logger', 'underscore', 'jquery', 'backbone',
        'data/EntityData',
        'text!templates/modal/placeholder_add_modal.tpl'], function(Logger, _, $, Backbone, EntityData, PlaceholderAddTemplate){
    return Backbone.View.extend({
        events: {
            'submit form' : 'submitForm',
            'hide.bs.modal' : 'cleanForm',
            'click .btn-primary' : 'submitForm'
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
            // TODO Add validation
            e.preventDefault();
            var label = this.$el.find(this.labelInputSelector).val(),
                description = this.$el.find(this.descriptionSelector).val(),
                promise = null;

            promise = EntityData.addEntity({
                label: label,
                description: description,
                type: 'placeholder'
            });

            promise.done(function(result) {
                // TODO Clean-up and close the dialog
                // Probably display the success message
            }).fail(function(f) {
                // TODO Show error
            });
        },
        cleanForm: function() {
            this.$el.find(this.labelInputSelector).val('');
            this.$el.find(this.descriptionSelector).val('');
        }
    });
});
