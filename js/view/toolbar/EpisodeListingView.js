define(['logger', 'tracker', 'underscore', 'jquery', 'backbone', 'voc',
        'text!templates/toolbar/episode_listing.tpl',
        'data/episode/EpisodeData'], function(Logger, tracker, _, $, Backbone, Voc, EpisodeListingTemplate, EpisodeData){
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
            this.$el.attr({
                'about' : this.model.getSubject()
            });
            this.$el.html(_.template(EpisodeListingTemplate, { label: this.model.get(Voc.label) }));
            return this;
        },
        episodeClicked: function() {
            var id = EpisodeData.getFirstVersion(this.model);
            if ( !id ) return;
            this.model.get(Voc.belongsToUser).save( Voc.currentVersion, id.getSubject());

            if ( this.options.toolContext ) {
                tracker.info(tracker.CLICKBIT, this.options.toolContext, this.model.getSubject(), this.options.trackerEvtContent);
            }
        },
        changeLabel: function(model, value, options) {
            this.$el.find('.episodeLabel').html(value);
        }
    });
});
