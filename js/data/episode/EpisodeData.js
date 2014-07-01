define(['logger', 'voc', 'underscore', 'data/Data', 'data/episode/VersionData'], function(Logger, Voc, _, Data, VersionData){
    var m = Object.create(Data);
    m.init = function(vie) {
        this.LOG.debug("initialize Episode");
        this.vie = vie;
        this.vie.entities.on('add', this.filter, this);
        this.setIntegrityCheck(Voc.belongsToUser, Voc.USER, Voc.hasEpisode);
        this.setIntegrityCheck(Voc.hasVersion, Voc.VERSION, Voc.belongsToEpisode);
    };
    m.LOG = Logger.get('EpisodeData');
    /** 
     * Filters entities from added entities to vie.entities
     */
    m.filter= function(model, collection, options) {
        if(model.isof(Voc.EPISODE)){
            this.checkIntegrity(model, options);
            if( !model.isNew() ) {
                this.fetchVersions(model);
            }
            model.on('change:'+this.vie.namespaces.uri(Voc.label), this.setLabel, this);
            model.on('change:'+this.vie.namespaces.uri(Voc.description), this.setDescription, this);
        }
    };
    m.fetchVersions= function(episode) {
        var em = this;
        this.vie.load({
            'episode' : episode.getSubject(),
            'type' : this.vie.types.get(Voc.VERSION)
        }).from('sss').execute().success(
            function(versions) {
                em.LOG.debug("success fetchVersions");
                em.LOG.debug("versions", versions);
                em.vie.entities.addOrUpdate(versions);
                if( _.isEmpty(versions) ) {
                    em.LOG.debug("versions empty");
                    episode.set(Voc.hasVersion, VersionData.newVersion(episode).getSubject());
                }
            }
        );

    };
    m.newEpisode= function(user, fromVersion) {
        var newEpisode, attr = {};
        newEpisode = new this.vie.Entity();
        this.LOG.debug("newEpisode", newEpisode);
        newEpisode.set(Voc.label, "New Episode");
        newEpisode.set(Voc.belongsToUser, user.getSubject());
        newEpisode.set('@type', Voc.EPISODE);
        this.vie.entities.addOrUpdate(newEpisode);
        newVersion = VersionData.newVersion(newEpisode, fromVersion).getSubject();
        newEpisode.set(Voc.hasVersion, newVersion);

        newEpisode.save();

        return newEpisode;
    };
    m.getFirstVersion= function(episode) {
        return this.getVersions(episode).at(0);
    };
    m.getVersions= function(episode) {

        var coll = new this.vie.Collection([],{'vie':this.vie});
        coll.comparator = this.vie.namespaces.uri(Voc.timestamp);
        coll.add(episode.get(Voc.hasVersion));
        return coll;
    };
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
            if ( options.error ) {
                options.error();
            }
        });
    };
    m.setDescription = function(model, description, options) {
        var that = this;
        options = options || {};
        // Only change if user_initiated flag is set to true
        if ( options.user_initiated !== true ) return;
        if ( model.previous(Voc.description) === description ) return;
        this.vie.save({
            'entity' : model,
            'description' : description
        }).to('sss').execute().success(function(s) {
            that.LOG.debug('success setDescription', s);
        }).fail(function(f) {
            if ( options.error ) {
                options.error();
            }
        });
    };
    m.shareEpisode = function(model, users, comment) {
        var that = this;
        this.vie.analyze({
            'service' : 'entityShare',
            'entity' : model.attributes['@subject'],
            'users' : users,
            'comment' : comment
        }).using('sss').execute().success(function(){
            that.LOG.debug('success entityShare');
        });
    };
    m.copyEpisode = function(model, users, exclude, comment) {
        var that = this;
        this.vie.analyze({
            'service' : 'entityCopy',
            'entity' : model.attributes['@subject'],
            'users' : users,
            'exclude' : exclude,
            'comment' : comment
        }).using('sss').execute().success(function(){
            that.LOG.debug('success entityCopy');
        });

    };
    return m;
});
