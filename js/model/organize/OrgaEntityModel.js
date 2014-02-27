define(['logger', 'voc', 'underscore', 'model/Model' ], function(Logger, Voc, _, Model){
    var m = Object.create(Model);
    m.init = function(vie) {
        this.LOG.debug("initialize OrgaEntityModel");
        this.vie = vie;
        this.vie.entities.on('add', this.filter, this);
        this.setIntegrityCheck(Voc.belongsToOrganize, Voc.ORGANIZE, Voc.hasEntity);
    };
    m.LOG = Logger.get('UserEventModel');
    /** 
     * Filters entities from added entities to vie.entities
     */
    m.filter= function(model, collection, options) {
        if( this.vie.namespaces.curie(model.get('@type').id) === Voc.ORGAENTITY ) {
            this.checkIntegrity(model);
        }
    };
    return m;

});
