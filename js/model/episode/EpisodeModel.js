define(['logger', 'voc', 'underscore', 'model/Model', 'model/episode/VersionModel'], function(Logger, Voc, _, Model, VersionModel){
    var m = Object.create(Model);
    m.init = function(vie) {
        this.LOG.debug("initialize Episode");
        this.vie = vie;
        this.vie.entities.on('add', this.filter, this);
        this.setIntegrityCheck(Voc.belongsToUser, Voc.USER, Voc.hasEpisode);
        this.setIntegrityCheck(Voc.hasVersion, Voc.VERSION, Voc.belongsToEpisode);
    };
    m.LOG = Logger.get('EpisodeModel');
    /** 
     * Filters entities from added entities to vie.entities
     */
    m.filter= function(model, collection, options) {
        if( this.vie.namespaces.curie(model.get('@type').id) === Voc.EPISODE ) {
            this.checkIntegrity(model);
            if( !model.isNew() ) {
                this.fetchVersions(model);
            } else {
                if(model.has(Voc.hasVersion)) {
                    if( _.isEmpty(model.get(Voc.hasVersion))) {
                        model.set(Voc.hasVersion, VersionModel.newVersion(model));
                    }
                }
            }
        }
    };
    m.fetchVersions= function(episode) {
        var em = this;
        this.vie.load({
            'episode' : episode.getSubject(),
            'type' : Voc.VERSION
        }).from('sss').execute().success(
            function(versions) {
                em.LOG.debug("success fetchVersions");
                em.LOG.debug("versions", versions);
                em.vie.entities.addOrUpdate(versions);
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
        VersionModel.newVersion(newEpisode, fromVersion);

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
