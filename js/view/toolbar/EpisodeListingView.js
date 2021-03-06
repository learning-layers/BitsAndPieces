define(['logger', 'tracker', 'underscore', 'jquery', 'backbone', 'voc',
        'text!templates/toolbar/episode_listing.tpl',
        'data/episode/EpisodeData',
        'userParams'], function(Logger, tracker, _, $, Backbone, Voc, EpisodeListingTemplate, EpisodeData, UserParams){
    return Backbone.View.extend({
        tagName: 'li',
        events: {
            'click' : 'episodeClicked'
        },
        LOG: Logger.get('EpisodeListingView'),
        initialize: function() {
            this.model.on('change:'+this.model.vie.namespaces.uri(Voc.label), this.changeLabel, this);
            this.model.on('destroy', function(model, collection, options) {
                this.remove();
            }, this);
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
            this.model.collection.get(UserParams.user).save( Voc.currentVersion, id.getSubject());

            if ( this.options.toolContext ) {
                tracker.info(tracker.CLICKBIT, this.options.toolContext, this.model.getSubject(), this.options.trackerEvtContent);
            }
        },
        changeLabel: function(model, value, options) {
            this.$el.find('.episodeLabel').html(value);
        }
    });
});
