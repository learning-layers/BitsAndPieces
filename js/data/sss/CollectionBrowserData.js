define(['logger', 'voc', 'underscore', 'data/Data', 'data/episode/UserData' ], function(Logger, Voc, _, Data, UserData){
    var m = Object.create(Data);
    m.init = function(vie) {
        this.LOG.debug("initialize CollectionBrowserData");
        this.vie = vie;
        this.vie.entities.on('add', this.filter, this);
        this.setIntegrityCheck(Voc.belongsToVersion, Voc.VERSION, Voc.hasWidget);
        this.setIntegrityCheck(Voc.belongsToUser, Voc.USER);
    };
    m.LOG = Logger.get('CollectionBrowserData');
    /** 
     * Filters entities from added entities to vie.entities
     */
    m.filter= function(model, collection, options) {
        if(model.isof(Voc.CollectionBrowser)){
            this.checkIntegrity(model, options);
        }
    };
    return m;
});
