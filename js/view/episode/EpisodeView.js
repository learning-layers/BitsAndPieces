define(['vie', 'logger', 'underscore', 'jquery', 'backbone', 'voc','data/episode/EpisodeData', 'utils/SystemMessages', 'userParams'], function(VIE, Logger, _, $, Backbone, Voc, EpisodeData, SystemMessages, UserParams){
    return Backbone.View.extend({
        LOG: Logger.get('EpisodeView'),
        tagName: 'li',
        className: 'episode',
        events: {
            //'click li.version' : 'changeCurrentVersion',
            'click a' : 'changeCurrentEpisode',
            'click button.deleteEpisode' : 'deleteEpisode'
        },
        initialize: function() {
            var that = this;

            this.$el.append('<a href="#"></a>');

            this.model.on('change:'+this.model.vie.namespaces.uri(Voc.hasVersion), this.render, this);
            this.model.on('change:'+this.model.vie.namespaces.uri(Voc.label), this.renderLabel, this);
            this.model.on('destroy', function(model, collection, options) {
                this.remove();
            }, this);

            if( this.model.isNew() ) {
                this.model.once('change:'+this.model.idAttribute,
                    function(model, value) {
                        that.$el.attr('about', value);
                });
            }
        },
        renderLabel: function(model, value, options) {
            this.$el.find('span.episodeLabel').html(value);
            return this;
        },
        render: function() {
            this.$el.find('a').attr('about', this.model.getSubject());
            this.$el.find('a').html('<button class="btn btn-danger deleteEpisode" title="Disconnect yourself from the Episode."><i class="fa fa-chain-broken bnp-navbar-icon"></i></button> <span class="episodeLabel">' + this.model.get(Voc.label) + '</span>');
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
            this.$el.find('a').addClass('highlight');
        },
        unhighlight: function() {
            this.$el.find('a').removeClass('highlight');
        },
        deleteEpisode: function(e) {
            e.preventDefault();
            e.stopPropagation();

            if ( this.options.episodeManager && this.options.episodeManager.episodeDeletionInProgress ) {
                SystemMessages.addWarningMessage('Episode is being deleted, please wait until the process has finished!');
                return;
            }

            var confirmDelete = confirm('Disconnect yourself from the Episode. The Episode will just disappear from your workspace and the other contributors will be able to go on collaborating on it.');

            if ( true === confirmDelete ) {

                var that = this,
                    promise = EpisodeData.removeEpisode(this.model),
                    elementContainer = this.$el.parent().parent();

                this._disableEpisodeDeletion(elementContainer);

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
                    that._enableEpisodeDeletion(elementContainer);
                }).fail(function(f) {
                    SystemMessages.addDangerMessage('Error! Could not delete episode <strong>' + that.model.get(Voc.label) + '</strong>.');
                    that._enableEpisodeDeletion(elementContainer);
                });

                            }
        },
        __getCurrentUserEntity: function() {
            return this.model.collection.get(UserParams.user);
        },
        _disableEpisodeDeletion: function(elementContainer) {
            this.options.episodeManager.episodeDeletionInProgress = true;
            elementContainer.find('button.deleteEpisode').prop('disabled', true);
        },
        _enableEpisodeDeletion: function(elementContainer) {
            this.options.episodeManager.episodeDeletionInProgress = false;
            elementContainer.find('button.deleteEpisode').prop('disabled', false);
        }
    });
});
