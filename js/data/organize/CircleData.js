define(['logger', 'voc', 'underscore', 'data/Data' ], function(Logger, Voc, _, Data){
    var m = Object.create(Data);
    m.init = function(vie) {
        this.LOG.debug("initialize OrgaEntityData");
        this.vie = vie;
        this.vie.entities.on('add', this.filter, this);
        this.setIntegrityCheck(Voc.belongsToOrganize, Voc.ORGANIZE, Voc.hasCircle);
    };
    m.LOG = Logger.get('CircleData');
    /** 
     * Filters entities from added entities to vie.entities
     */
    m.filter= function(model, collection, options) {
        if(model.isof(Voc.CIRCLE)){
            this.checkIntegrity(model, options);
        }
    };
    return m;

});
