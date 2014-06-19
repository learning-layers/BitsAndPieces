define(['logger', 'tracker', 'underscore', 'jquery', 'backbone', 'voc',
        'text!templates/toolbar/episode.tpl'], function(Logger, tracker, _, $, Backbone, Voc, EpisodeTemplate){
    return Backbone.View.extend({
        events: {
        },
        LOG: Logger.get('EpisodeToolbarView'),
        initialize: function() {
        },
        setEntity: function(version) {
            this.LOG.debug('Provided version', version);
            this.LOG.debug('Version episode', version.get(Voc.belongsToEpisode));
            if( this.model === version ) return;
            //this.stopListening(this.model, 'change', this.render);
            this.model = version;
            if( version ) {
                //this.listenTo(this.model, 'change', this.render);
            }
            this.render();
        },
        render: function() {
            this.$el.empty();
            if( !this.model ) {
                // ... empty the toolbar content
                this.$el.html("No episode version")
                return;
            }
            this.$el.html(_.template(EpisodeTemplate, this.getEpisodeViewData()));
        },
        updateOnEnter: function(e) {
            if (e.keyCode == 13) {
                this.LOG.debug('updateOnEnter', e);
            }
        },
        getEpisodeViewData: function() {
            var episode = this.model.get(Voc.belongsToEpisode);
            return {
                entity : {
                    label : episode.get(Voc.label),
                    description : ''
                }
            };
        }
    });
});
