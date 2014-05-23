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
        if(model.isof(Voc.ENTITY)){
            this.checkIntegrity(model, options);
            if ( model.has(Voc.author) ) {
                this.initUser(model);
            } 
            model.on('change:'+this.vie.namespaces.uri(Voc.author), this.initUser, this); 
            model.on('change:'+this.vie.namespaces.uri(Voc.hasTag), this.changedTags, this);
        }
    };
    m.initUser = function(model, value, options) {
        var user = model.get(Voc.author);
        if( user.isEntity ) {
            user.fetch();
        }
    };
    m.changedTags = function(model, set, options) {
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
    m.search = function(tags, callback) {
        var that = this;
        this.vie.analyze({
            'service' : 'searchByTags',
            'tags' : tags,
            'max' : 20
        }).using('sss').execute().success(function(entities){
            that.LOG.debug('search entities', entities);
            entities = that.vie.entities.addOrUpdate(entities);
            callback(entities);
        });
    }
    return m;

});
