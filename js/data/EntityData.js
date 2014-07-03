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
        if( model.isof(Voc.ENTITY) || model.isof(Voc.FILE) || model.isof(Voc.EVERNOTE_RESOURCE)
            || model.isof(Voc.EVERNOTE_NOTE) || model.isof(Voc.EVERNOTE_NOTEBOOK) ){
            this.checkIntegrity(model, options);
            if ( model.has(Voc.author) ) {
                this.initUser(model);
            } 
            model.on('change:'+this.vie.namespaces.uri(Voc.author), this.initUser, this); 
            model.on('change:'+this.vie.namespaces.uri(Voc.hasTag), this.changedTags, this);
            model.on('change:'+this.vie.namespaces.uri(Voc.label), this.setLabel, this);
            model.on('change:'+this.vie.namespaces.uri(Voc.importance), this.setImportance, this);
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
        _.each(added, function(tag){
            that.vie.save({
                'entity' : model,
                'tag' : tag
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

        var deleted = _.difference(previous, set);
        this.LOG.debug('deleted', deleted);
        _.each(deleted, function(tag){
            that.vie.remove({
                'entity' : model,
                'tag' : tag
            }).from('sss').execute().success(function(s){
                that.LOG.debug('success removeTag', s);
            });
        });
    },
    m.setLabel = function(model, label, options) {
        var that = this;
        options = options || {};
        // Only change if user_initiated flag is set to true
        if ( options.user_initiated !== true ) return;
        if ( model.previous(Voc.label) === label ) return;
        this.vie.save({
            'entity' : model,
            'label' : label
        }).to('sss').execute().success(function(s) {
            that.LOG.debug('success setLabel', s);
        }).fail(function(f) {
            that.LOG.debug('fail setLabel', f);
            if ( options.error ) {
                options.error();
            }
        });
    };
    m.search = function(tags, callback) {
        var that = this;
        this.vie.analyze({
            'service' : 'searchByTags',
            'tags' : tags,
            'max' : 20
        }).using('sss').execute().success(function(entities){
            that.LOG.debug('search entities', entities);
            entities = that.vie.entities.addOrUpdate(entities);
            _.each(entities, function(entity) {
                // XXX This is quite a bad check, in case the search results will
                // change in future. Need a better check to determine entity
                // being fully loaded.
                if ( !entity.has(Voc.author) ) {
                    entity.fetch();
                }
            });
            callback(entities);
        });
    }
    m.loadRecommTagsBasedOnUserEntityTagTime = function(model) {
        var that = this;
        this.vie.analyze({
            'service' : 'recommTagsBasedOnUserEntityTagTime',
            'forUser' : null,
            'entity' : model.attributes['@subject'],
            'maxTags' : 20
        }).using('sss').execute().success(function(result){
            that.LOG.debug('recommTags', result);
            model.set(Voc.hasTagRecommendation, result);
        });
    }
    m.loadViewCount = function(model) {
        var that = this;
        this.vie.analyze({
            'service' : 'ueCountGet',
            'entity' : model.attributes['@subject'],
            'type' : 'viewEntity'
        }).using('sss').execute().success(function(count){
            that.LOG.debug('count', count);
            model.set(Voc.hasViewCount, count);
        });
    }
    m.setImportance = function(model, importance, options) {
        var that = this;
        options = options || {};
        // Only change if user_initiated flag is set to true
        if ( options.user_initiated !== true ) return;
        if ( model.previous(Voc.importance) === importance ) return;
        this.vie.save({
            'entity' : model,
            'importance' : importance
        }).to('sss').execute().success(function(s) {
            that.LOG.debug('success setImportance', s);
        }).fail(function(f) {
            that.LOG.debug('fail setImportance', f);
        });
    };

    return m;

});
