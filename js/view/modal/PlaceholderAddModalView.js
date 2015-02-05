define(['logger', 'underscore', 'jquery', 'backbone',
        'text!templates/modal/placeholder_add_modal.tpl'], function(Logger, _, $, Backbone, PlaceholderAddTemplate){
    return Backbone.View.extend({
        events: {
            'submit form' : 'submitForm',
            'hide.bs.modal' : 'cleanForm'
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
        },
        cleanForm: function() {
            this.$el.find(this.labelInputSelector).val('');
            this.$el.find(this.descriptionSelector).val('');
        }
    });
});
