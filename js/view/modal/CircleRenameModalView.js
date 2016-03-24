define(['config/config', 'logger', 'underscore', 'jquery', 'backbone',
        'data/sss/CategoryData', 'data/episode/UserData',
        'utils/InputValidation',
        'text!templates/modal/circle_rename_modal.tpl'], function(appConfig, Logger, _, $, Backbone, CategoryData, UserData, InputValidation, CircleRenameModalTemplate){
    return Backbone.View.extend({
        events: {
            'submit form' : 'submitForm',
            'keyup input#episodeLabel' : 'revalidateCircleLabel',
            'keyup textarea#renameCircleDescription' : 'revalidateCircleDescription',
            'hide.bs.modal' : 'callHideModalAction'
        },
        LOG: Logger.get('CircleRenameModalView'),
        initialize: function() {
            this.circleRenameModalSelector = '#circleRenameModal';
            this.renamedCircleLableSelector = '#renamedCircleLabel';
            this.renamedCircleDescriptionSelector = '#renameCircleDescription';
            this.authorNameSelector = '.authorName';
            this.descriptionMaxLength = appConfig.entityDescriptionMaxLength;
        },
        render: function() {
            var that = this;

            this.$el.html(_.template(CircleRenameModalTemplate, {
                descriptionMaxLength: this.descriptionMaxLength
            }));
            
            this.$el.find(this.renamedCircleLableSelector).autocomplete({
                source: [], // The source data will be set later
                select: function(event, ui) {
                    that.callSelectActionCallback(event, ui);
                }
            }).autocomplete('widget').addClass('circleRenameAutoComplete');
            
            return this;
        },
        cleanForm: function() {
            var labelElement = this.$el.find(this.renamedCircleLableSelector),
                descriptionElement = this.$el.find(this.renamedCircleDescriptionSelector);

            labelElement.val('');
            InputValidation.removeAlertsFromParent(labelElement);
            InputValidation.removeValidationStateFromParent(labelElement);
            descriptionElement.val('');
            InputValidation.removeAlertsFromParent(descriptionElement);
            InputValidation.removeValidationStateFromParent(descriptionElement);
        },
        getRenamedCircleLabel: function() {
            return this.$el.find(this.renamedCircleLableSelector).val();
        },
        setRenamedCircleLabel: function(value) {
            this.$el.find(this.renamedCircleLableSelector).val(value);
        },
        getRenamedCircleDescription: function() {
            return this.$el.find(this.renamedCircleDescriptionSelector).val();
        },
        setRenamedCircleDescription: function(value) {
            this.$el.find(this.renamedCircleDescriptionSelector).val(value);
        },
        setAuthor: function(value) {
            this.$el.find(this.authorNameSelector).text(value);
        },
        resetAutocompleteSource: function() {
            this.$el.find(this.renamedCircleLableSelector).autocomplete('option', 'source', _.union(CategoryData.getPredefinedCategories(), UserData.getRecommendedTags()));
        },
        showModal: function() {
            this.$el.find(this.circleRenameModalSelector).modal('show');
        },
        hideModal: function() {
            this.$el.find(this.circleRenameModalSelector).modal('hide');
        },
        setSaveActionHandler: function(cb) {
            var that = this;
            this.$el.find('button.btn-primary')
                .off('click') // Remove any previously registered handlers
                .on('click', function(ev) {
                    if ( !( that.validateCircleLabel() === true && that.validateCircleDescription() === true ) ) {
                        return false;
                    }

                    cb(ev);
                });
        },
        submitForm: function(e) {
            e.preventDefault();
            
            this.$el.find('button.btn-primary').trigger('click');
        },
        setSelectActionHandler: function(cb) {
            this.selectActionCallback = cb;
        },
        callSelectActionCallback: function(event, ui) {
            this.selectActionCallback(event, ui);
        },
        setHideActionHandler: function(cb) {
            this.hideModalActionCallback = cb;
        },
        callHideModalAction: function() {
            if ( this.hideModalActionCallback ) {
                this.hideModalActionCallback();
            }
            this.cleanForm();
        },
        validateCircleLabel: function() {
            var element = this.$el.find(this.renamedCircleLableSelector),
                alertText = 'Label is required!';

            return InputValidation.validateTextInput(element, alertText);
        },
        revalidateCircleLabel: function() {
            this.validateCircleLabel();
        },
        validateCircleDescription: function() {
            var element = this.$el.find(this.renamedCircleDescriptionSelector),
                alertText = 'Maximum number of allowed characters exceeded!';

            return InputValidation.validateTextInputLength(element, this.descriptionMaxLength, alertText);
        },
        revalidateCircleDescription: function() {
            this.validateCircleDescription();
        }
    });
});
