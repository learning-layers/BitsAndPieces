define(['vie', 'logger', 'underscore', 'jquery', 'backbone', 'voc','data/episode/EpisodeData', 'utils/SystemMessages', 'userParams'], function(VIE, Logger, _, $, Backbone, Voc, EpisodeData, SystemMessages, UserParams){
    return Backbone.View.extend({
        LOG: Logger.get('EpisodeView'),
        tagName: 'a',
        events: {
            //'click li.version' : 'changeCurrentVersion',
            'click' : 'changeCurrentEpisode',
            'click button.deleteEpisode' : 'deleteEpisode'
        },
        initialize: function() {
            this.model.on('change:'+this.model.vie.namespaces.uri(Voc.hasVersion), this.render, this);
            this.model.on('change:'+this.model.vie.namespaces.uri(Voc.label), this.renderLabel, this);
            this.model.on('destroy', function(model, collection, options) {
                this.remove();
            }, this);
        },
        renderLabel: function(model, value, options) {
            this.$el.find('span.episodeLabel').html(value);
            return this;
        },
        render: function() {
            this.$el.attr('href', '#');
            this.$el.html('<button class="btn btn-danger deleteEpisode" title="Delete Episode"><span class="glyphicon glyphicon-remove"></span></button> <span class="episodeLabel">' + this.model.get(Voc.label) + '</span>');
            return this;
        },
        changeCurrentVersion: function(event) {
            if( !event || !event.currentTarget ) return;
            var id = $(event.currentTarget).attr('about');
            this.LOG.debug('EpisodeView changeCurrentVersion ' + id);
            if( !id ) return;
            this.__getCurrentUserEntity().save( Voc.currentVersion, id);
        },
        changeCurrentEpisode: function(event) {
            event.preventDefault();
            if( !event || !event.currentTarget ) return;
            var id = EpisodeData.getFirstVersion(this.model);
            if( !id ) return;
            this.LOG.debug('EpisodeView changeCurrentEpisode, version = ' + id.getSubject());
            this.__getCurrentUserEntity().save( Voc.currentVersion, id.getSubject());
        },
        highlight: function() {
            this.$el.addClass('highlight');
        },
        unhighlight: function() {
            this.$el.removeClass('highlight');
        },
        deleteEpisode: function(e) {
            e.preventDefault();
            e.stopPropagation();

            var confirmDelete = confirm('Are you sure you want to remove this Episode? This can not be undone!');

            if ( true === confirmDelete ) {

                var that = this,
                    promise = EpisodeData.removeEpisode(this.model);

                promise.done(function(response) {
                    var episode = that.model,
                        episodeLabel = episode.get(Voc.label),
                        version = EpisodeData.getFirstVersion(episode),
                        currentUser = that.__getCurrentUserEntity(),
                        currentVersion = currentUser.get(Voc.currentVersion);
                    // Make sure to unset the user current episode if it is removed
                    if ( currentVersion && currentVersion.getSubject() === version.getSubject() ) {
                        currentUser.save(Voc.currentVersion, null);
                    }

                    var episodes = currentUser.get(Voc.hasEpisode);
                    if ( _.isArray(episodes) ) {
                        var episodeURIs = [];
                        _.each(episodes, function(single) {
                            if ( single.getSubject() !== episode.getSubject() ) {
                                episodeURIs.push(single.getSubject());
                            }
                        });
                        currentUser.save(Voc.hasEpisode, episodeURIs);
                    }

                    episode.destroy();
                    version.destroy();

                    SystemMessages.addSuccessMessage('Episode <strong>' + episodeLabel + '</strong> successfully removed.');
                }).fail(function(f) {
                    SystemMessages.addDangerMessage('Error! Could not delete episode <strong>' + that.model.get(Voc.label) + '</strong>.');
                });

                            }
        },
        __getCurrentUserEntity: function() {
            return this.model.collection.get(UserParams.user);
        }
    });
});
