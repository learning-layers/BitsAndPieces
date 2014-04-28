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
            } else {
                this.LOG.debug("new episode added", model);
                this.LOG.debug("hasVersion", model.get(Voc.hasVersion));
                if(model.has(Voc.hasVersion)) {
                    this.LOG.debug("hasVersion", model.get(Voc.hasVersion));
                    if( _.isEmpty(model.get(Voc.hasVersion))) {
                        this.LOG.debug("hasVersion isEmpty");
                        model.set(Voc.hasVersion, VersionData.newVersion(model).getSubject());
                    }
                }
            }
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
        var newVersion = false;
        if( fromVersion ) {
            newVersion = VersionData.newVersion(newEpisode, fromVersion).getSubject();
        }
        newEpisode.set(Voc.hasVersion, newVersion);
        this.vie.entities.addOrUpdate(newEpisode);

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
    return m;
});
