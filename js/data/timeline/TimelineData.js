define(['logger', 'voc', 'underscore', 'data/Data', 'data/episode/UserData', 'utils/EntityHelpers' ], function(Logger, Voc, _, Data, UserData, EntityHelpers){
    var m = Object.create(Data);
    m.init = function(vie) {
        this.LOG.debug("initialize TimelineData");
        this.vie = vie;
        this.vie.entities.on('add', this.filter, this);
        this.setIntegrityCheck(Voc.belongsToVersion, Voc.VERSION, Voc.hasWidget);
        this.setIntegrityCheck(Voc.belongsToUser, Voc.USER);
    };
    m.LOG = Logger.get('TimelineData');
    /** 
     * Filters entities from added entities to vie.entities
     */
    m.filter= function(model, collection, options) {
        if(model.isof(Voc.TIMELINE)){
            this.checkIntegrity(model, options);
            this.fetchTimelineState(model);

            var user = model.get(Voc.belongsToUser);
            // TODO resolve this hack: only fire on start change to avoid double execution
            model.on('change:' + this.vie.namespaces.uri(Voc.start),
                function(model, value, options){
                    UserData.fetchRange(user, value, model.get(Voc.end));
                }
            );
            model.sync = this.sync;
        }
    };
    m.sync= function(method, model, options) {
        m.LOG.debug("sync entity " + model.getSubject() + " by " + method);
        if( !options ) options = {};
        switch(method) {
            case 'create':
            case 'update':
                m.saveTimelineState(model, options);
                break;
            case 'read':
                m.fetchTimelineState(model, options);
                break;
            default:
                this.vie.Entity.prototype.sync(method, model, options);
        }
    },
    m.saveTimelineState= function(model,options) {
        options = options || {};
        var version = model.get(Voc.belongsToVersion);
        var that = this;
        this.vie.onUrisReady(
            version.getSubject(),
            function(versionUri) {
                that.vie.save({
                    service : 'learnEpVersionSetTimelineState',
                    data : {
                        'learnEpVersion' : versionUri,
                        'startTime' : model.get(Voc.start),
                        'endTime' : model.get(Voc.end)
                    }
                }).to('sss').execute().success(function(savedEntityUri) {
                    model.set(model.idAttribute, savedEntityUri, options);
                    if(options.success) {
                        options.success(model);
                    }
                });
            }
        );
    },
    m.fetchTimelineState= function(model, options) {
        options = options || {};
        var version = model.get(Voc.belongsToVersion);
        var that = this;
        this.vie.onUrisReady(
            version.getSubject(),
            function(versionUri) {
                that.vie.load({
                    'service' : 'learnEpVersionGetTimelineState',
                    'data' : {
                        'learnEpVersionId' : EntityHelpers.getIdFromUri(versionUri)
                    }
                }).from('sss').execute().success(function(state) {
                    var type = null;

                    // Store @type and remove it from entity data
                    if ( state['@type'] ) {
                        type = state['@type'];
                        delete state['@type'];
                    }

                    model.set(state);

                    // Add @type back if stored
                    if ( null !== type ) {
                        state['@type'] = type;
                    }

                    if(options.success) {
                        options.success(state);
                    }
                });
            }
        );
    },
    m.copy= function(timeline, overrideAttributes) {
        var newAttr = _.clone(timeline.attributes);
        delete newAttr[timeline.idAttribute];
        newAttr = _.extend(newAttr, overrideAttributes || {});
        var newTimeline = new this.vie.Entity(newAttr);
        this.vie.entities.addOrUpdate(newTimeline);
        newTimeline.save();
        return newTimeline;
    };
    return m;

});
