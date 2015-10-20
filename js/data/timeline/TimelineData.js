define(['logger', 'voc', 'underscore', 'data/Data', 'data/episode/UserData' ], function(Logger, Voc, _, Data, UserData){
    var m = Object.create(Data);
    m.init = function(vie) {
        this.LOG.debug("initialize TimelineData");
        this.vie = vie;
        this.vie.entities.on('add', this.filter, this);
        this.setIntegrityCheck(Voc.belongsToVersion, Voc.VERSION, Voc.hasWidget);
        this.setIntegrityCheck(Voc.belongsToUser, Voc.USER);
        this.timerLookup = {};
    };
    m.LOG = Logger.get('TimelineData');
    /** 
     * Filters entities from added entities to vie.entities
     */
    m.filter= function(model, collection, options) {
        var that = m;
        if(model.isof(Voc.TIMELINE)){
            this.checkIntegrity(model, options);
            var version = model.get(Voc.belongsToVersion);
            version.once('change:'+this.vie.namespaces.uri(Voc.TIMELINE_STATE), function() {
                var timelineState = version.get(Voc.TIMELINE_STATE);
                var dataSet = {};
                dataSet[Voc.start] = timelineState.get(Voc.start);
                dataSet[Voc.end] = timelineState.get(Voc.end);
                model.set(dataSet);
            });

            var user = model.get(Voc.belongsToUser);
            // TODO resolve this hack: only fire on start change to avoid double execution
            model.on('change:' + this.vie.namespaces.uri(Voc.start),
                function(model, value, options){
                    var currentTimer = that.getTimerValue(model.getSubject(), 'fetchData');
                    if (currentTimer) {
                        clearTimeout(currentTimer);
                    }

                    currentTimer = setTimeout(function() {
                        that.clearTimerValue(model.getSubject(), 'fetchData');
                        UserData.fetchRange(user, value, model.get(Voc.end));
                    }, 250);
                    that.setTimerValue(model.getSubject(), 'fetchData', currentTimer);
                }
            );
            model.sync = this.sync;
        }
    };
    m.sync= function(method, model, options) {
        var that = m;
        m.LOG.debug("sync entity " + model.getSubject() + " by " + method);
        if( !options ) options = {};
        switch(method) {
            case 'create':
            case 'update':
                var currentTimer = that.getTimerValue(model.getSubject(), 'setState');
                if (currentTimer) {
                        clearTimeout(currentTimer);
                    }

                    currentTimer = setTimeout(function() {
                        that.clearTimerValue(model.getSubject(), 'setState');
                        m.saveTimelineState(model, options);
                    }, 250);
                    that.setTimerValue(model.getSubject(), 'setState', currentTimer);
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
                    // XXX This one updates timeline ID/Subject to URI of current state
                    // Not sure what is the purpose of it
                    //model.set(model.idAttribute, savedEntityUri, options);
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
                        'learnEpVersion' : versionUri
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
    m.getTimerValue = function(uri, type) {
        return this.timerLookup[uri + ':' + type];
    };
    m.setTimerValue = function(uri, type, value) {
        this.timerLookup[uri + ':' + type] = value;
    };
    m.clearTimerValue = function(uri, type) {
        delete this.timerLookup[uri + ':' + type];
    };
    return m;

});
