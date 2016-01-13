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
            // Fetch state and fill start and end values
            this.fetchTimelineState(model);
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
        var that = this;
        this.vie.onUrisReady(
            function() {
                that.vie.save({
                    service : 'learnEpsTimelineStateSet',
                    data : {
                        'startTime' : model.get(Voc.start),
                        'endTime' : model.get(Voc.end)
                    }
                }).to('sss').execute().success(function(savedEntityUri) {
                    // This one updates timeline ID/Subject to URI of current state
                    // Not sure what is the purpose of it
                    // Disabled for causing issues, the id is uninportant anyway
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
        var that = this;
        this.vie.onUrisReady(
            function() {
                that.vie.load({
                    'service' : 'learnEpsTimelineStateGet',
                }).from('sss').execute().success(function(state) {
                    var dataSet = {};
                    dataSet[Voc.start] = state[Voc.start];
                    dataSet[Voc.end] = state[Voc.end];
                    model.set(dataSet);

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
