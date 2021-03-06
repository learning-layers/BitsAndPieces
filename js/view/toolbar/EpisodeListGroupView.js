define(['logger', 'underscore', 'jquery', 'backbone', 'voc',
        'data/episode/EpisodeData'], function(Logger, _, $, Backbone, Voc, EpisodeData){
    return Backbone.View.extend({
        tagName: 'a',
        className: 'list-group-item',
        events: {
            'click' : 'episodeClicked'
        },
        LOG: Logger.get('EpisodeListGroupView'),
        initialize: function() {
            this.model.on('change:'+this.model.vie.namespaces.uri(Voc.label), this.changeLabel, this);
            this.model.on('destroy', function(model, collection, options) {
                this.remove();
            }, this);
        },
        render: function() {
            this.$el.attr('href', '#');
            this.$el.html(this.model.get(Voc.label));
            return this;
        },
        episodeClicked: function(e) {
            e.preventDefault();
            var id = EpisodeData.getFirstVersion(this.model);
            if ( !id ) return;
            this.model.get(Voc.belongsToUser).save( Voc.currentVersion, id.getSubject());
        },
        changeLabel: function(model, value, options) {
            this.$el.html(value);
        }
    });
});
