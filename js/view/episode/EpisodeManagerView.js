define(['vie', 'logger', 'tracker', 'underscore', 'jquery', 'backbone', 'view/episode/EpisodeView', 'model/episode/EpisodeModel'], function(VIE, Logger, tracker, _, $, Backbone, EpisodeView, EpisodeModel){
    return Backbone.View.extend({
        LOG: Logger.get('EpisodeManagerView'),
        events: {
            'click button#createBlank' : 'createBlank',
            'click button#createFromHere' : 'createFromHere',
            'click button#createNewVersion' : 'createNewVersion',
            'click #toggleEpisodes' : 'toggleEpisodes',
            'mouseleave #episodes' : 'toggleEpisodes',
            'keypress h1' : 'updateOnEnter',
            'blur h1' : 'changeLabel'
        },
        initialize: function() {
            this.views = {};
            this.model.episodeCollection.on('add', this.addEpisode, this);
            var user = this.model;
            this.$el.html('<img src="css/img/menu_small.png" id="toggleEpisodes"/><h1 contenteditable="true"></h1>' + 
                    '<div id="episodes"><button id="createNewVersion">New Version</button><button id="createBlank">Create new Episode from scratch</button><button id="createFromHere">Create new Episode from here</button><ul></ul></div>');

            this.model.on('change:' + this.model.vie.namespaces.uri('sss:currentVersion'), 
                this.render, this);
            var view = this;
            this.LOG.debug('episodeCollection.length', this.model.episodeCollection.length);
            this.model.episodeCollection.each(function(episode){
                view.addEpisode(episode, user.episodeCollection );
            });
            if( this.model.get('currentVersion')) this.render();
        },
        toggleEpisodes: function() {
            var episodes = this.$el.find('#episodes');
            if( episodes.css('display') == 'none')
                tracker.info(tracker.OPENEPISODESDIALOG, tracker.NULL);
            episodes.toggle();
        },
        changeLabel: function() {
            if( !this.currentEpisode ) return;
            var label = this.$el.find('h1').text();
            label = label.replace(/(<([^>]+)>)/ig,"");
            this.$el.find('h1').html(label);
            if( this.currentEpisode.model.get('label') == label) return;
            this.LOG.debug('changeLabel', label);
            tracker.info(tracker.RENAMEEPISODE, this.model.getSubject(), label);
            this.currentEpisode.model.save({'label': label});
        },
        updateOnEnter: function(e) {
            if (e.keyCode == 13) {
                this.changeLabel();
            }
        },
        render: function() {
            this.LOG.debug('EpisodeManager render');
            var version = this.model.get('currentVersion');
            if( !version || !version.isVersion ) return;
            this.LOG.debug('version', version);
            var episode = version.get('episode');
            var label = episode.get('label');
            this.$el.find('h1').html(label);
            if( this.currentEpisode) this.currentEpisode.unhighlight();
            this.currentEpisode = this.views[episode.cid];
            this.currentEpisode.highlight(version.getSubject());
        },
        addEpisode: function(model, collection,options) {
            this.LOG.debug('addEpisode', model, collection);
            if( !collection || collection !== this.model.episodeCollection ) return null;
            var view = new EpisodeView({'model':model});
            var li = $('<li class="episode"></li>');
            li.append(view.render().$el);
            this.$el.find('ul').first().append(li);
            this.views[model.cid] = view;
            return this;
        },
        createNewVersion: function() {
            var version = this.model.get('currentVersion');
            this.LOG.debug('createNewVersion from', version);
            tracker.info(tracker.CREATENEWVERSION, version.getSubject());
            var episode = version.get('episode');
            episode.newVersion(version);
        },
        createFromHere: function() {
            var version = this.model.get('currentVersion');
            this.LOG.debug('create new episode from version', version);
            tracker.info(tracker.CREATENEWEPISODEFROMVERSION, version.getSubject());
            var epr = this;
            this.model.episodeCollection.create(new EpisodeModel({
                'label' : 'New Episode'
            }), { 
                'success' : function(newEpisode, response, options) {
                    epr.LOG.debug('new Episode created', newEpisode);
                    newEpisode.newVersion(version);
            }});
        },
        createBlank: function() {
            var version = this.model.get('currentVersion');
            this.LOG.debug('create new episode from scratch', version);
            tracker.info(tracker.CREATENEWEPISODEFROMSCRATCH, version.getSubject());
            this.model.episodeCollection.create(new EpisodeModel({
                'label' : 'New Episode'
            }), { 
                'success' : function(newEpisode, response, options) {
                newEpisode.newVersion(); // a blank new version
            }});

        }

    });
});
