define(['config/config', 'logger', 'underscore', 'jquery', 'backbone',
        'data/EntityData',
        'utils/SystemMessages', 'utils/InputValidation',
        'text!templates/modal/episode_add_modal.tpl'], function(appConfig, Logger, _, $, Backbone, EntityData, SystemMessages, InputValidation, EpisodeAddTemplate){
    return Backbone.View.extend({
        events: {
            'submit form' : 'submitForm',
            'hide.bs.modal' : 'cleanForm',
            'click .btn-primary' : 'submitForm',
            'keyup input#episodeLabel' : 'revalidateEpisodeLabel',
            'keyup textarea#episodeDescription' : 'revalidateEpisodeDescription'
        },
        LOG: Logger.get('EpisodeAddModalView'),
        initialize: function() {
            this.episodeAddModalSelector = '#episodeAddModal';
            this.labelInputSelector = '#episodeLabel';
            this.descriptionSelector = '#episodeDescription';
            this.descriptionMaxLength = appConfig.entityDescriptionMaxLength;
        },
        render: function() {
            this.$el.html(_.template(EpisodeAddTemplate, {
                rows: appConfig.modalDescriptionRows,
                descriptionMaxLength: this.descriptionMaxLength
            }));
            
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

            if ( !( this.validateEpisodeLabel() === true && this.validateEpisodeDescription() === true ) ) {
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
            var labelElement = this.$el.find(this.labelInputSelector),
                descriptionElement = this.$el.find(this.descriptionSelector);

            labelElement.val('');
            InputValidation.removeAlertsFromParent(labelElement);
            InputValidation.removeValidationStateFromParent(labelElement);
            descriptionElement.val('');
            InputValidation.removeAlertsFromParent(descriptionElement);
            InputValidation.removeValidationStateFromParent(descriptionElement);
        },
        validateEpisodeLabel: function() {
            var element = this.$el.find(this.labelInputSelector),
                alertText = 'Label is required!';

            return InputValidation.validateTextInput(element, alertText);
        },
        revalidateEpisodeLabel: function() {
            this.validateEpisodeLabel();
        },
        validateEpisodeDescription: function() {
            var element = this.$el.find(this.descriptionSelector),
                alertText = 'Maximum number of allowed characters exceeded!';

            return InputValidation.validateTextInputLength(element, this.descriptionMaxLength, alertText);
        },
        revalidateEpisodeDescription: function() {
            this.validateEpisodeDescription();
        },
        setCallback: function(cb) {
            this.formSubmitCallback = cb;
        }
    });
});
