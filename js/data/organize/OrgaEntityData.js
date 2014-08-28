define(['logger', 'voc', 'underscore', 'data/Data' ], function(Logger, Voc, _, Data){
    var m = Object.create(Data);
    m.init = function(vie) {
        this.LOG.debug("initialize OrgaEntityData");
        this.vie = vie;
        this.vie.entities.on('add', this.filter, this);
        this.setIntegrityCheck(Voc.hasResource, Voc.ENTITY);
        this.setIntegrityCheck(Voc.belongsToVersion, Voc.VERSION, Voc.hasEntity);
    };
    m.LOG = Logger.get('OrgaEntityData');
    /** 
     * Filters entities from added entities to vie.entities
     */
    m.filter= function(model, collection, options) {
        if(model.isof(Voc.ORGAENTITY)){
            this.checkIntegrity(model, options);
            model.sync = this.sync;
        }
    };
    m.sync= function(method, model, options) {
        m.LOG.debug("sync entity " + model.getSubject() + " by " + method);
        if( !options ) options = {};

        if( method === 'create' ) {
            m.createEntity(model, options);
        } else if( method === 'update' ) {
            m.updateEntity(model, options);
        }
        if(options.success) {
            options.success(model);
        }
    };
    m.mapAttributes = function(model) {
        return  {
            'x' : model.get(Voc.x),
            'y' : model.get(Voc.y),
        };
    };
    m.createEntity = function(model, options) {
        var version = model.get(Voc.belongsToVersion);
        var resource = model.get(Voc.hasResource);
        var that = this;
        var data = this.mapAttributes(model);
        this.vie.onUrisReady(
            version.getSubject(),
            resource.getSubject(),
            function(versionUri, resourceUri) {
                that.vie.save({
                    'service' : 'learnEpVersionAddEntity',
                    'data' : _.extend( data, {
                        learnEpVersion : versionUri,
                        entity : resourceUri
                    }),
                }).to('sss').execute().success(function(savedEntityUri) {
                    model.set(model.idAttribute, savedEntityUri, options);
                });
            }
        );
    };
    m.updateEntity = function(model, options) {
        var version = model.get(Voc.belongsToVersion);
        var resource = model.get(Voc.hasResource);
        var that = this;
        var data = this.mapAttributes(model);
        this.vie.onUrisReady(
            model.getSubject(),
            resource.getSubject(),
            function(modelUri, resourceUri) {
                that.vie.save({
                    'service' : 'learnEpVersionUpdateEntity',
                    'data' : _.extend( data, {
                        learnEpEntity : modelUri,
                        entity : resourceUri
                    }),
                }).to('sss').execute();
            }
        );
    };
    return m;

});
