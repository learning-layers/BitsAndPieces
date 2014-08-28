define(['logger', 'voc', 'underscore', 'data/Data' ], function(Logger, Voc, _, Data){
    var m = Object.create(Data);
    m.init = function(vie) {
        this.LOG.debug("initialize OrgaEntityData");
        this.vie = vie;
        this.vie.entities.on('add', this.filter, this);
        this.setIntegrityCheck(Voc.belongsToVersion, Voc.VERSION, Voc.hasCircle);
    };
    m.LOG = Logger.get('CircleData');
    /** 
     * Filters entities from added entities to vie.entities
     */
    m.filter= function(model, collection, options) {
        if(model.isof(Voc.CIRCLE)){
            this.checkIntegrity(model, options);
            model.sync = this.sync;
        }
    };
    m.sync= function(method, model, options) {
        m.LOG.debug("sync entity " + model.getSubject() + " by " + method);
        if( !options ) options = {};

        if( method === 'create' ) {
            m.createCircle(model, options);
        } else if( method === 'update' ) {
            m.updateCircle(model, options);
        } else if( method === 'delete' ) {
            m.removeCircle(model, options);
        } else {
            this.vie.Entity.prototype.sync(method, model, options);
        }
    };
    m.mapAttributes = function(model) {
        return  {
            'label' : model.get(Voc.label),
            'xLabel' : model.get(Voc.xLabel),
            'yLabel' : model.get(Voc.yLabel),
            'xR' : model.get(Voc.xR),
            'yR' : model.get(Voc.yR),
            'xC' : model.get(Voc.xC),
            'yC' : model.get(Voc.yC)
        };
    };
    m.createCircle = function(model, options) {
        var version = model.get(Voc.belongsToVersion);
        var that = this;
        var data = this.mapAttributes(model);
        this.vie.onUrisReady(
            version.getSubject(),
            function(versionUri) {
                that.vie.save({
                    'service' : 'learnEpVersionAddCircle',
                    'data' : _.extend( data, {learnEpVersion : versionUri}),
                }).to('sss').execute().success(function(savedEntityUri) {
                    model.set(model.idAttribute, savedEntityUri, options);
                    if(options.success) {
                        options.success(savedEntityUri);
                    }
                });
            }
        );
    };
    m.updateCircle = function(model, options) {
        var version = model.get(Voc.belongsToVersion);
        var that = this;
        var data = this.mapAttributes(model);
        this.vie.onUrisReady(
            model.getSubject(),
            function(modelUri) {
                that.vie.save({
                    'service' : 'learnEpVersionUpdateCircle',
                    'data' : _.extend( data, {learnEpCircle : modelUri}),
                }).to('sss').execute().success(function(result) {
                    if(options.success) {
                        options.success(result);
                    }
                });
            }
        );
    };
    m.removeCircle = function(model, options) {
        options = options || {};
        var that = this;
        this.vie.onUrisReady(
            model.getSubject(),
            function(modelUri) {
                that.vie.remove({
                    'service' : 'learnEpVersionRemoveCircle',
                    'data' : {
                        'learnEpCircle' : modelUri
                    }
                }).using('sss').execute().success(function(result) {
                    if(options.success) {
                        options.success(result);
                    }
                });
            }
        );
    }
    return m;

});
