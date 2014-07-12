define(['logger', 'voc', 'underscore'], function(Logger, Voc, _){
    return {
        init : function(vie) {
            this.LOG.debug("initialize CategoryData");
            this.vie = vie;
            this.fetchPredefinedCategories();
        },
        LOG: Logger.get('CategoryData'),
        getPredefinedCategories: function() {
            return _.clone(this.predefinedCategories);
        },
        fetchPredefinedCategories: function() {
            var that = this;
            this.vie.analyze({
                'service' : 'categoriesPredefinedGet'
            }).using('sss').execute().success(function(categories) {
                that.predefinedCategories = categories;
            });
        }
    }
});
