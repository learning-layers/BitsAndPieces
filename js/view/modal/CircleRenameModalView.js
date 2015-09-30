define(['logger', 'underscore', 'jquery', 'backbone',
        'data/sss/CategoryData', 'data/episode/UserData',
        'text!templates/modal/circle_rename_modal.tpl'], function(Logger, _, $, Backbone, CategoryData, UserData, CircleRenameModalTemplate){
    return Backbone.View.extend({
        events: {
            'submit form' : 'submitForm',
            'hide.bs.modal' : 'callHideModalAction'
        },
        LOG: Logger.get('CircleRenameModalView'),
        initialize: function() {
            this.circleRenameModalSelector = '#circleRenameModal';
            this.renamedCircleLableSelector = '#renamedCircleLabel';
            this.renamedCircleDescriptionSelector = '#renameCircleDescription';
            this.authorNameSelector = '.authorName';
        },
        render: function() {
            var that = this;

            this.$el.html(_.template(CircleRenameModalTemplate));
            
            this.$el.find(this.renamedCircleLableSelector).autocomplete({
                source: [], // The source data will be set later
                select: function(event, ui) {
                    that.callSelectActionCallback(event, ui);
                }
            }).autocomplete('widget').addClass('circleRenameAutoComplete');
            
            return this;
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
            this.$el.find('button.btn-primary')
                .off('click') // Remove any previously registered handlers
                .on('click', cb);
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
        }
    });
});
