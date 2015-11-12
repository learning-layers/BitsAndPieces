define(['logger', 'underscore', 'jquery', 'backbone',
        'data/EntityData',
        'utils/SystemMessages', 'utils/InputValidation',
        'text!templates/modal/episode_add_modal.tpl'], function(Logger, _, $, Backbone, EntityData, SystemMessages, InputValidation, EpisodeAddTemplate){
    return Backbone.View.extend({
        events: {
            'submit form' : 'submitForm',
            'hide.bs.modal' : 'cleanForm',
            'click .btn-primary' : 'submitForm',
            'keyup input#episodeLabel' : 'revalidateEpisodeLabel',
        },
        LOG: Logger.get('EpisodeAddModalView'),
        initialize: function() {
            this.episodeAddModalSelector = '#episodeAddModal';
            this.labelInputSelector = '#episodeLabel';
            this.descriptionSelector = '#episodeDescription';
        },
        render: function() {
            this.$el.html(_.template(EpisodeAddTemplate));
            
            return this;
        },
        showModal: function() {
            this.$el.find(this.episodeAddModalSelector).modal('show');
        },
        hideModal: function() {
            this.$el.find(this.episodeAddModalSelector).modal('hide');
        },
        submitForm: function(e) {
            e.preventDefault();

            if ( !this.validateEpisodeLabel() ) {
                return false;
            }

            var label = this.$el.find(this.labelInputSelector).val(),
                description = this.$el.find(this.descriptionSelector).val();

            if ( this.formSubmitCallback ) {
                this.formSubmitCallback(label, description);
                this.hideModal();
            }
        },
        cleanForm: function() {
            var element = this.$el.find(this.labelInputSelector);

            this.$el.find(this.labelInputSelector).val('');
            this.$el.find(this.descriptionSelector).val('');
            InputValidation.removeAlertsFromParent(element);
            InputValidation.removeValidationStateFromParent(element);
        },
        validateEpisodeLabel: function() {
            var element = this.$el.find(this.labelInputSelector),
                alertText = 'Label is required!';

            return InputValidation.validateTextInput(element, alertText);
        },
        revalidateEpisodeLabel: function() {
            this.validateEpisodeLabel();
        },
        setCallback: function(cb) {
            this.formSubmitCallback = cb;
        }
    });
});
