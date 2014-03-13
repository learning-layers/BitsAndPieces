define(['logger', 'voc', 'underscore', 'model/Model' ], function(Logger, Voc, _, Model){
    var m = Object.create(Model);
    m.init = function(vie) {
        this.LOG.debug("initialize UserEventModel");
        this.vie = vie;
        this.vie.entities.on('add', this.filter, this);
        this.setIntegrityCheck(Voc.belongsToTimeline, Voc.TIMELINE, Voc.hasEntity);
    };
    m.LOG = Logger.get('UserEventModel');
    /** 
     * Filters entities from added entities to vie.entities
     */
    m.filter= function(model, collection, options) {
        if( this.vie.namespaces.curie(model.get('@type').id) === Voc.USEREVENT ) {
            this.checkIntegrity(model, options);
        }
    };
    return m;

});
