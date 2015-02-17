define(['logger', 'underscore', 'jquery', 'backbone', 'voc',
        'text!templates/toolbar/episode_listing.tpl',
        'data/episode/EpisodeData'], function(Logger, _, $, Backbone, Voc, EpisodeListingTemplate, EpisodeData){
    return Backbone.View.extend({
        tagName: 'li',
        events: {
            'click' : 'episodeClicked'
        },
        LOG: Logger.get('EpisodeListingView'),
        initialize: function() {
            this.model.on('change:'+this.model.vie.namespaces.uri(Voc.label), this.changeLabel, this);
        },
        render: function() {
            this.$el.html(_.template(EpisodeListingTemplate, { label: this.model.get(Voc.label) }));
            return this;
        },
        episodeClicked: function() {
            var id = EpisodeData.getFirstVersion(this.model);
            if ( !id ) return;
            this.model.get(Voc.belongsToUser).save( Voc.currentVersion, id.getSubject());
        },
        changeLabel: function(model, value, options) {
            this.$el.find('.episodeLabel').html(value);
        }
    });
});
