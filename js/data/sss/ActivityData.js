define(['logger', 'voc', 'underscore', 'jquery', 'data/Data' ], function(Logger, Voc, _, $, Data){
    var m = Object.create(Data);
    m.init = function(vie) {
        this.LOG.debug("initialize ActivityData");
        this.vie = vie;
        this.vie.entities.on('add', this.filter, this);
        this.setIntegrityCheck(Voc.author, Voc.USER);
    };
    m.LOG = Logger.get('ActivityData');
    /**
     * Filters entities from added entities to vie.entities
     */
    m.filter= function(model, collection, options) {
        if(model.isof(Voc.ACTIVITY)){
            this.checkIntegrity(model, options);
            // TODO Not sure about this one
            if ( model.has(Voc.author) ) {
                this.initUser(model);
            }
            // TODO Not sure about this one
            model.on('change:'+this.vie.namespaces.uri(Voc.author), this.initUser, this);
        }
    };
    m.initUser = function(model, value, options) {
        var user = model.get(Voc.author);
        if( user.isEntity ) {
            user.fetch();
        }
    };
    m.getActivities = function(data) {
        var that = this,
            defer = $.Deferred();

        data = data || {};

        this.vie.onUrisReady(
            function() {
                that.vie.analyze({
                    'service' : 'activitiesGet',
                    'data' : data
                }).using('sss').execute().success(function(activities){
                    that.LOG.debug('activitiesGet success', activities);
                    activities = that.vie.entities.addOrUpdate(activities);
                    defer.resolve(activities);
                }).fail(function(f) {
                    that.LOG.debug('activitiesGet fail', f);
                    defer.reject(f);
                });
            }
        );
        return defer.promise();
    };

    return m;
});
