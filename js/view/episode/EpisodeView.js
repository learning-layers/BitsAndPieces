define(['vie', 'logger', 'tracker', 'underscore', 'jquery', 'backbone'], function(VIE, Logger, tracker, _, $, Backbone){
    return Backbone.View.extend({
        LOG: Logger.get('EpisodeView'),
        events: {
            'click li.version' : 'changeCurrentVersion',
            'click h2' : 'changeCurrentEpisode'
        },
        initialize: function() {
            this.model.versionCollection.on('add', this.render, this);
            this.model.versionCollection.on('change', this.render, this);
            this.model.on('change:'+this.model.vie.namespaces.uri('sss:label'), this.renderLabel, this);
        },
        renderLabel: function(model, value, options) {
            this.$el.find('h2').html(value);
            return this;
        },
        render: function() {
            this.$el.html('<h2>' + this.model.get('label') + '</h2><ul></ul>');
            var ul = this.$el.find('ul');
            this.LOG.debug("this.model", this.model, this.highlit);
            var view = this;
            this.model.versionCollection.each(function(version){
                var highlit = "";
                view.LOG.debug('version', version.getSubject());
                if( view.highlit && version.getSubject() === view.highlit ) 
                    highlit = 'highlight';
                ul.append('<li class="version '+highlit+'" about="'+version.getSubject()+'">Version<div class="timestamp">' + new Date(version.get('timestamp')-0) + '</div></li>');
            });
            return this;
        },
        changeCurrentVersion: function(event) {
            if( !event || !event.currentTarget ) return;
            var id = $(event.currentTarget).attr('about');
            this.LOG.debug('EpisodeView changeCurrentVersion ' + id);
            tracker.info(tracker.SWITCHVERSION, id);
            if( !id ) return;
            this.model.trigger('change:'+this.model.vie.namespaces.uri('sss:currentVersion'), this.model, id);
        },
        changeCurrentEpisode: function(event) {
            if( !event || !event.currentTarget ) return;
            var id = this.model.getFirstVersion();
            if( !id ) return;
            this.LOG.debug('EpisodeView changeCurrentEpisode, version = ' + id.getSubject());
            tracker.info(tracker.SWITCHEPISODE, id.getSubject());
            this.model.trigger('change:'+this.model.vie.namespaces.uri('sss:currentVersion'), this.model, id.getSubject());
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
