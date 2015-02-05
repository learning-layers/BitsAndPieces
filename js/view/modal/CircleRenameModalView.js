define(['logger', 'underscore', 'jquery', 'backbone',
        'data/sss/CategoryData', 'data/episode/UserData',
        'text!templates/modal/circle_rename_modal.tpl'], function(Logger, _, $, Backbone, CategoryData, UserData, CircleRenameModalTemplate){
    return Backbone.View.extend({
        events: {
            'submit form' : 'submitForm'
        },
        LOG: Logger.get('CircleRenameModalView'),
        initialize: function() {
            this.circleRenameModalSelector = '#circleRenameModal';
            this.renamedCircleLableSelector = '#renamedCircleLabel';
        },
        render: function() {
            this.$el.html(_.template(CircleRenameModalTemplate));
            
            this.$el.find(this.renamedCircleLableSelector).autocomplete({
                source: [] // The source data will be set later
            }).autocomplete('widget').addClass('circleRenameAutoComplete');
            
            return this;
        },
        getRenamedCircleLabel: function() {
            return this.$el.find(this.renamedCircleLableSelector).val();
        },
        setRenamedCircleLabel: function(value) {
            this.$el.find(this.renamedCircleLableSelector).val(value);
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
        }
    });
});
