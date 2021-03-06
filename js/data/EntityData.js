define(['config/config', 'logger', 'voc', 'underscore', 'jquery', 'data/Data', 'userParams', 'utils/EntityHelpers' ], function(appConfig, Logger, Voc, _, $, Data, userParams, EntityHelpers){
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
        if( model.isof(Voc.ENTITY) || model.isof(Voc.FILE) || model.isof(Voc.LINK) ){
            this.checkIntegrity(model, options);
            if ( model.has(Voc.author) ) {
                this.initUser(model);
            } 
            model.on('change:'+this.vie.namespaces.uri(Voc.author), this.initUser, this); 
            model.on('change:'+this.vie.namespaces.uri(Voc.hasTag), this.changedTags, this);
            model.on('change:'+this.vie.namespaces.uri(Voc.importance), this.setImportance, this);
            model.on('change:'+this.vie.namespaces.uri(Voc.hasThumbnail), this.setThumbnail, this);
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
                            'space' : 'sharedSpace'
                        }
                    }).to('sss').execute().success(function(s){
                        that.LOG.debug('success addTag', s);
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
    m.setDescription = function(model, description, options) {
        var that = this;
        options = options || {};
        // Only change if user_initiated flag is set to true
        if ( options.user_initiated !== true ) return;
        if ( model.previous(Voc.description) === description ) return;
        model.save(Voc.description, description, {
            'success' : function(result) {
                that.LOG.debug('success setDescription', result);
                if(options.success) {
                    options.success(result);
                }
            },
            'error' : function(result) {
                that.LOG.debug('fail setDescription', result);
                if( options.error ) {
                    options.error(result);
                }
            }
        });
    };
    m.search = function(keywords, tags, callback) {
        var that = this,
            serviceData = {
                'typesToSearchOnlyFor' : appConfig.acceptableEntityTypes,
                'localSearchOp' : appConfig.localSearchOp,
                'globalSearchOp' : appConfig.globalSearchOp
            };

        if ( !_.isEmpty(keywords) ) {
            serviceData.labelsToSearchFor = keywords;
            serviceData.descriptionsToSearchFor = keywords;
        }
        if ( !_.isEmpty(tags) ) {
            serviceData.tagsToSearchFor = tags;
        }

        this.vie.load({
            'service' : 'search',
            'data' : serviceData
        }).using('sss').execute().success(function(entities, passThrough){
            that.LOG.debug('search entities', entities, passThrough);
            entities = that.vie.entities.addOrUpdate(entities, {'overrideAttributes': true});
            callback(entities, passThrough);
        });
    };
    m.loadSearchNextPage = function(pagesID, pageNumber, callback) {
        var that = this;
        this.vie.load({
            'service' : 'search',
            'data' : {
                'pagesID' : pagesID,
                'pageNumber' : pageNumber
            }
        }).using('sss').execute().success(function(entities, passThrough){
            that.LOG.debug('search entities', entities, passThrough);
            entities = that.vie.entities.addOrUpdate(entities, {'overrideAttributes': true});
            callback(entities, passThrough);
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
                        'maxTags' : 10,
                        'forUser' : userParams.user,
                        'includeOwn' : false
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
    m.setThumbnail = function(model, thumbnail, options) {
        if ( !_.isEmpty(thumbnail) ) {
            model.set(Voc.hasThumbnailCache, thumbnail);
        }
    };
    m.hasLoaded = function(model, attributeUri) {
        var loaded = model.get(Voc.hasLoaded);
        if ( _.isUndefined(loaded) ) {
            return false;
        }

        if ( !_.isArray(loaded) ) {
            loaded = [loaded];
        }

        if ( loaded.indexOf(attributeUri) !== -1 ) {
            return true;
        }

        return false;
    };
    m.addHasLoaded = function(model, attributeUri) {
        var loaded = model.get(Voc.hasLoaded);
        if ( _.isUndefined(loaded) ) {
            loaded = [];
        } else if ( !_.isArray(loaded) ) {
            loaded = [loaded];
        }

        if ( loaded.indexOf(attributeUri) === -1 ) {
            loaded.push(attributeUri);
            model.set(Voc.hasLoaded, loaded);
            return true;
        }

        return false;
    };
    m.getRecommResources = function(data) {
        var that = this,
            defer = $.Deferred();

        data = data || {};

        this.vie.onUrisReady(
            function() {
                that.vie.analyze({
                    'service' : 'recommResources',
                    'data' : data
                }).using('sss').execute().success(function(result){
                    that.LOG.debug('recommResources success', result);
                    var entities = [];
                    _.each(result, function(single) {
                        entities.push(single.resource);
                    });
                    // TODO Think about adding "likelihood" to an entity
                    entities = that.vie.entities.addOrUpdate(entities, {'overrideAttributes': true});
                    defer.resolve(entities);
                }).fail(function(f) {
                    that.LOG.debug('recommResources fail', f);
                    defer.reject(f);
                });
            }
        );
        return defer.promise();
    };
    m.addEntity = function(data) {
        var that = this,
            defer = $.Deferred();

        data = data || {};

        this.vie.onUrisReady(
            function() {
                that.vie.analyze({
                    'service' : 'entityAdd',
                    'data' : data
                }).using('sss').execute().success(function(result){
                    that.LOG.debug('addEntity success', result);
                    defer.resolve(result);
                }).fail(function(f) {
                    that.LOG.debug('addEntity fail', f);
                    defer.reject(f);
                });
            }
        );

        return defer.promise();
    };
    m.uploadFile = function(formData) {
        var that = this,
            defer = $.Deferred();

        this.vie.onUrisReady(
            function() {
                that.vie.analyze({
                    'service' : 'fileUpload',
                    'data' : formData
                }).using('sss').execute().success(function(result){
                    that.LOG.debug('uploadFile success', result);
                    defer.resolve(result);
                }).fail(function(f) {
                    that.LOG.debug('uploadFile fail', f);
                    defer.reject(f);
                });
            }
        );

        return defer.promise();
    };
    m.addLink = function(data) {
        var that = this,
            defer = $.Deferred();

        data = data || {};

        this.vie.onUrisReady(
            function() {
                that.vie.analyze({
                    'service' : 'linkAdd',
                    'data' : data
                }).using('sss').execute().success(function(result){
                    that.LOG.debug('linkAdd success', result);
                    defer.resolve(result);
                }).fail(function(f) {
                    that.LOG.debug('linkAdd fail', f);
                    defer.reject(f);
                });
            }
        );

        return defer.promise();
    };


    return m;

});
