define(['vie', 'logger', 'underscore', 'jquery', 'backbone', 'voc','data/episode/EpisodeData', 'utils/SystemMessages'], function(VIE, Logger, _, $, Backbone, Voc, EpisodeData, SystemMessages){
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
            //this.$el.html('<h2>' + this.model.get(Voc.label) + '</h2><ul rel="'+this.model.vie.namespaces.uri(Voc.hasVersion)+'"></ul>');
            this.$el.html('<button class="btn btn-danger deleteEpisode" title="Delete Episode"><span class="glyphicon glyphicon-remove"></span></button> <span class="episodeLabel">' + this.model.get(Voc.label) + '</span>');
            /*
            var ul = this.$el.find('ul');
            this.LOG.debug("this.model", this.model, this.highlit);
            var view = this;
            var versionCollection = new Backbone.Collection;
            versionCollection.comparator = this.model.vie.namespaces.uri(Voc.timestamp);
            versionCollection.add(this.model.get(Voc.hasVersion));
            versionCollection.each(function(version){
                var highlit = "";
                view.LOG.debug('version', version.getSubject());
                if( view.highlit && version.getSubject() === view.highlit ) 
                    highlit = 'highlight';
                var versionElem = $('<li class="version '+highlit+'" about="'+version.getSubject()+'">Version<div class="timestamp">' + new Date(version.get(Voc.timestamp)-0) + '</div></li>');
                if( version.isNew() ) {
                    version.once('change:'+version.idAttribute, 
                        function(model, value) {
                            versionElem.attr('about', value );
                    });

                }
                ul.append(versionElem);
            });
            */
            return this;
        },
        changeCurrentVersion: function(event) {
            if( !event || !event.currentTarget ) return;
            var id = $(event.currentTarget).attr('about');
            this.LOG.debug('EpisodeView changeCurrentVersion ' + id);
            if( !id ) return;
            this.model.get(Voc.belongsToUser).save( Voc.currentVersion, id);
        },
        changeCurrentEpisode: function(event) {
            event.preventDefault();
            if( !event || !event.currentTarget ) return;
            var id = EpisodeData.getFirstVersion(this.model);
            if( !id ) return;
            this.LOG.debug('EpisodeView changeCurrentEpisode, version = ' + id.getSubject());
            this.model.get(Voc.belongsToUser).save( Voc.currentVersion, id.getSubject());
        },
        highlight: function(versionId) {
            this.$el.addClass('highlight');
            this.$el.find('li[about="'+versionId+'"]').addClass('highlight');
            this.highlit = versionId;
        },
        unhighlight: function() {
            this.$el.removeClass('highlight');
            this.$el.find('li').removeClass('highlight');
            this.highlit = "";
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
                        user = episode.get(Voc.belongsToUser),
                        currentVersion = user.get(Voc.currentVersion);
                    // Make sure to unset the user current episode if it is removed
                    if ( currentVersion && currentVersion.getSubject() === version.getSubject() ) {
                        user.save(Voc.currentVersion, null);
                    }

                    var episodes = user.get(Voc.hasEpisode);
                    if ( _.isArray(episodes) ) {
                        var episodeURIs = [];
                        _.each(episodes, function(single) {
                            if ( single.getSubject() !== episode.getSubject() ) {
                                episodeURIs.push(single.getSubject());
                            }
                        });
                        user.save(Voc.hasEpisode, episodeURIs);
                    }

                    episode.destroy();
                    version.destroy();

                    SystemMessages.addSuccessMessage('Episode <strong>' + episodeLabel + '</strong> successfully removed.');
                }).fail(function(f) {
                    SystemMessages.addDangerMessage('Error! Could not delete episode <strong>' + that.model.get(Voc.label) + '</strong>.');
                });

                            }
        }
    });
});
