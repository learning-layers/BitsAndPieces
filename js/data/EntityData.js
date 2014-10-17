define(['logger', 'voc', 'underscore', 'data/Data' ], function(Logger, Voc, _, Data){
    var m = Object.create(Data);
    m.init = function(vie) {
        this.LOG.debug("initialize EntityData");
        this.vie = vie;
        this.vie.entities.on('add', this.filter, this);
        this.setIntegrityCheck(Voc.belongsToTimeline, Voc.TIMELINE, Voc.hasEntity);
        this.setIntegrityCheck(Voc.author, Voc.USER);
    };
    m.LOG = Logger.get('EntityData');
    /** 
     * Filters entities from added entities to vie.entities
     */
    m.filter= function(model, collection, options) {
        if( model.isof(Voc.ENTITY) || model.isof(Voc.FILE) ){
            this.checkIntegrity(model, options);
            if ( model.has(Voc.author) ) {
                this.initUser(model);
            } 
            model.on('change:'+this.vie.namespaces.uri(Voc.author), this.initUser, this); 
            model.on('change:'+this.vie.namespaces.uri(Voc.hasTag), this.changedTags, this);
            model.on('change:'+this.vie.namespaces.uri(Voc.importance), this.setImportance, this);
            this.loadViewCount(model);
            this.loadRecommTags(model);
        }
    };
    m.initUser = function(model, value, options) {
        var user = model.get(Voc.author);
        if( user.isEntity ) {
            user.fetch();
        }
    };
    m.changedTags = function(model, set, options) {
        options = options || {};
        // Only change in case user_initiated flag is set
        if ( options.user_initiated !== true ) return;
        set = set || [];
        if( !_.isArray(set)) set = [set];
        var previous = model.previous(Voc.hasTag) || [];
        if( !_.isArray(previous)) previous = [previous];
        this.LOG.debug('previous', previous);  
        var that = this;
        var added = _.difference(set, previous);
        this.LOG.debug('added', added);
        this.vie.onUrisReady(
            model.getSubject(),
            function(modelUri) {
                _.each(added, function(tag){
                    that.vie.save({
                        'service' : 'tagAdd',
                        'data' : {
                            'entity' : modelUri,
                            'label' : tag,
                            'space' : 'privateSpace'
                        }
                    }).to('sss').execute().success(function(s){
                        that.LOG.debug('success addTag', s);
                        that.loadRecommTags(model);
                    }).fail(function(f){
                        var tags = model.get(Voc.hasTag) || [];
                        if( !_.isArray(tags)) tags = [tags];
                        model.set(Voc.hasTag, _.without(tags, tag));
                        that.LOG.debug('options', options);
                        options.error();
                    });
                });
            }
        );

        var deleted = _.difference(previous, set);
        this.LOG.debug('deleted', deleted);
        this.vie.onUrisReady(
            model.getSubject(),
            function(modelUri) {
                _.each(deleted, function(tag){
                    that.vie.remove({
                        'service' : 'tagsRemove',
                        'data' : {
                            'entity' : modelUri,
                            'label' : tag
                        }
                    }).from('sss').execute().success(function(s){
                        that.loadRecommTags(model);
                        that.LOG.debug('success removeTag', s);
                    });
                });
            }
        );
    };
    m.setLabel = function(model, label, options) {
        var that = this;
        options = options || {};
        // Only change if user_initiated flag is set to true
        if ( options.user_initiated !== true ) return;
        if ( model.previous(Voc.label) === label ) return;
        model.save(Voc.label, label, {
            'success' : function(result) {
                that.LOG.debug('success setLabel', result);
                // TODO check whether tag recomms can change due to label change
                that.loadRecommTags(model);
                if(options.success) {
                    options.success(result);
                }
            },
            'error' : function(result) {
                that.LOG.debug('fail setLabel', result);
                if( options.error ) {
                    options.error(result);
                }
            }
        });
    };
    m.search = function(tags, callback) {
        var that = this;
        this.vie.load({
            'service' : 'search',
            'data' : {
                'keywordsToSearchFor' : tags,
                'includeTags' : true,
                'includeLabel' : true,
                'typesToSearchOnlyFor' : ['entity', 'file', 'evernoteResource', 'evernoteNote', 'evernoteNotebook']
            }
        }).using('sss').execute().success(function(entities){
            that.LOG.debug('search entities', entities);
            entities = that.vie.entities.addOrUpdate(entities);
            // TODO Check if search returns full information for entities
            // If not, determine ones that need to be loaded and load those
            // using entityDescsGet call.
            // Please make sure to return the fully loaded entities to the callback.
            // One solution would be to load the ones that are needed, and only then
            // run the callback method. If none need loading, then just run the callback
            // here.
            callback(entities);
        });
    };
    m.loadRecommTags = function(model) {
        var that = this;

        this.vie.onUrisReady(
            model.getSubject(),
            function(modelUri) {
                that.vie.analyze({
                    'service' : 'recommTags',
                    'data' : {
                        'entity' : modelUri,
                        'maxTags' : 20
                    }
                }).using('sss').execute().success(function(result){
                    that.LOG.debug('recommTags', result);
                    model.set(Voc.hasTagRecommendation, result || []);
                });
            }
        );
    };
    m.loadViewCount = function(model) {
        var that = this;
        this.vie.onUrisReady(
            model.getSubject(),
            function(modelUri) {
                that.vie.analyze({
                    'service' : 'uECountGet',
                    'data' : {
                        'entity' : modelUri,
                        'type' : 'viewEntity'
                    }
                }).using('sss').execute().success(function(count){
                    that.LOG.debug('count', count);
                    model.set(Voc.hasViewCount, count || 0 );
                });
            }
        );
    };
    m.setImportance = function(model, importance, options) {
        var that = this;
        options = options || {};
        // Only change if user_initiated flag is set to true
        if ( options.user_initiated !== true ) return;
        if ( model.previous(Voc.importance) === importance ) return;
        this.vie.onUrisReady(
            model.getSubject(),
            function(modelUri) {
                that.vie.save({
                    'service' : 'flagsSet',
                    'data' : {
                        'entities' : [modelUri],
                        'types' : ['importance'],
                        'value' : importance
                    }
                }).to('sss').execute().success(function(s) {
                    that.LOG.debug('success setImportance', s);
                    if(options.success) {
                        options.success(result);
                    }
                }).fail(function(f) {
                    that.LOG.debug('fail setImportance', f);
                    if(options.error) {
                        options.error(result);
                    }
                });
            }
        );
    };

    return m;

});
