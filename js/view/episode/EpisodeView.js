define(['vie', 'logger', 'tracker', 'underscore', 'jquery', 'backbone', 'voc','model/episode/EpisodeModel'], function(VIE, Logger, tracker, _, $, Backbone, Voc, EpisodeModel){
    return Backbone.View.extend({
        LOG: Logger.get('EpisodeView'),
        events: {
            'click li.version' : 'changeCurrentVersion',
            'click h2' : 'changeCurrentEpisode'
        },
        initialize: function() {
            this.model.on('change:'+this.model.vie.namespaces.uri(Voc.hasVersion), this.render, this);
            this.model.on('change:'+this.model.vie.namespaces.uri(Voc.label), this.renderLabel, this);
        },
        renderLabel: function(model, value, options) {
            this.$el.find('h2').html(value);
            return this;
        },
        render: function() {
            this.$el.html('<h2>' + this.model.get('label') + '</h2><ul rel="'+this.model.vie.namespaces.uri(Voc.hasVersion)+'"></ul>');
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
                var versionElem = $('<li class="version '+highlit+'" about="'+version.getSubject()+'">Version<div class="timestamp">' + new Date(version.get('timestamp')-0) + '</div></li>');
                if( version.isNew() ) {
                    version.once('change:'+version.idAttribute, 
                        function(model, value) {
                            versionElem.attr('about', value );
                    });

                }
                ul.append(versionElem);
            });
            return this;
        },
        changeCurrentVersion: function(event) {
            if( !event || !event.currentTarget ) return;
            var id = $(event.currentTarget).attr('about');
            this.LOG.debug('EpisodeView changeCurrentVersion ' + id);
            tracker.info(tracker.SWITCHVERSION, id);
            if( !id ) return;
            this.model.get(Voc.belongsToUser).save( Voc.currentVersion, id);
        },
        changeCurrentEpisode: function(event) {
            if( !event || !event.currentTarget ) return;
            var id = EpisodeModel.getFirstVersion(this.model);
            if( !id ) return;
            this.LOG.debug('EpisodeView changeCurrentEpisode, version = ' + id.getSubject());
            tracker.info(tracker.SWITCHEPISODE, id.getSubject());
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
        }
    });
});
