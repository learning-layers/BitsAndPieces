define(['logger', 'underscore', 'jquery', 'backbone',
        'data/sss/CategoryData',
        'text!templates/circle_rename_modal.tpl'], function(Logger, _, $, Backbone, CategoryData, CircleRenameModalTemplate){
    return Backbone.View.extend({
        events: {
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
            });
            
            return this;
        },
        getRenamedCircleLabel: function() {
            return this.$el.find(this.renamedCircleLableSelector).val();
        },
        setRenamedCircleLabel: function(value) {
            this.$el.find(this.renamedCircleLableSelector).val(value);
        },
        resetAutocompleteSource: function() {
            this.$el.find(this.renamedCircleLableSelector).autocomplete('option', 'source', CategoryData.getPredefinedCategories());
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
        }
    });
});
