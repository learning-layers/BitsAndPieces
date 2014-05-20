define(['logger', 'voc', 'underscore', 'data/Data' ], function(Logger, Voc, _, Data){
    var m = Object.create(Data);
    m.init = function(vie) {
        this.LOG.debug("initialize UserEventData");
        this.vie = vie;
        this.vie.entities.on('add', this.filter, this);
        this.setIntegrityCheck(Voc.hasResource, Voc.THING);
        this.setIntegrityCheck(Voc.belongsToTimeline, Voc.TIMELINE, Voc.hasEntity);
    };
    m.LOG = Logger.get('UserEventData');
    /** 
     * Filters entities from added entities to vie.entities
     */
    m.filter= function(model, collection, options) {
        if(model.isof(Voc.USEREVENT)){
            this.checkIntegrity(model, options);
            var resource = model.get(Voc.hasResource);
            this.LOG.debug("resource", resource );
            if( resource.isEntity ) {
                resource.fetch();
            }
        }
    };
    return m;

});
