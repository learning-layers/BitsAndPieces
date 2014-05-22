define(['logger', 'voc', 'underscore', 'data/Data' ], function(Logger, Voc, _, Data){
    var m = Object.create(Data);
    m.init = function(vie) {
        this.LOG.debug("initialize EntityData");
        this.vie = vie;
        this.vie.entities.on('add', this.filter, this);
        this.setIntegrityCheck(Voc.belongsToTimeline, Voc.TIMELINE, Voc.hasEntity);
        this.setIntegrityCheck(Voc.author, Voc.USER);
    };
    m.LOG = Logger.get('UserEventData');
    /** 
     * Filters entities from added entities to vie.entities
     */
    m.filter= function(model, collection, options) {
        if(model.isof(Voc.ENTITY)){
            this.checkIntegrity(model, options);
            if ( model.has(Voc.author) ) {
                var user = model.get(Voc.author);
                if( user.isEntity ) {
                    user.fetch();
                }
            } else {
                model.on('change:'+this.vie.namespaces.uri(Voc.author), function(model, value, options) {
                    var user = model.get(Voc.author);
                    if( user.isEntity ) {
                        user.fetch();
                    }

                });
            }
        }
    };
    return m;

});
