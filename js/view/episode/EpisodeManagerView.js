define(['vie', 'logger', 'tracker', 'underscore', 'jquery', 'backbone', 'view/episode/EpisodeView', 'model/episode/EpisodeModel', 'voc'], function(VIE, Logger, tracker, _, $, Backbone, EpisodeView, EpisodeModel, Voc){
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
            this.LOG.debug('options', this.options);
            this.vie = this.options.vie;
            this.vie.entities.on('add', this.filter, this);
            this.$el.html('<img src="css/img/menu_small.png" id="toggleEpisodes"/><h1 contenteditable="true"></h1>' + 
                    '<div id="episodes"><button id="createNewVersion">New Version</button><button id="createBlank">Create new Episode from scratch</button><button id="createFromHere">Create new Episode from here</button><ul></ul></div>');

            this.model.on('change:' + this.model.vie.namespaces.uri(Voc.currentVersion), 
                this.render, this);
            var view = this;
            this.vie.entities.each(this.filter, this);
            if( this.model.get(Voc.currentVersion)) this.render();
        },
        filter: function(model, collection, options) {
            if( this.vie.namespaces.curie(model.get('@type').id) === Voc.EPISODE ) {
                this.addEpisode(model);
            }
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
            var version = this.model.get(Voc.currentVersion);
            if( !version || !version.isEntity ) return;
            this.LOG.debug('version', version);
            var episode = version.get(Voc.belongsToEpisode);
            var label = episode.get(Voc.label);
            this.$el.find('h1').html(label);
            if( this.currentEpisode) this.currentEpisode.unhighlight();
            this.currentEpisode = this.views[episode.cid];
            this.currentEpisode.highlight(version.getSubject());
        },
        addEpisode: function(model, collection,options) {
            this.LOG.debug('addEpisode', model, collection);
            var view = new EpisodeView({'model':model});
            var li = $('<li class="episode"></li>');
            li.append(view.render().$el);
            this.$el.find('ul').first().append(li);
            this.views[model.cid] = view;
            return this;
        },
        createNewVersion: function() {
            var version = this.model.get(Voc.currentVersion);
            this.LOG.debug('createNewVersion from', version);
            tracker.info(tracker.CREATENEWVERSION, version.getSubject());
            var episode = version.get(Voc.belongsToEpisode);
            EpisodeModel.newVersion(episode, version);
        },
        createFromHere: function() {
            var version = this.model.get(Voc.currentVersion);
            var episode = version.get(Voc.belongsToEpisode);
            this.LOG.debug('create new episode from version', version);
            tracker.info(tracker.CREATENEWEPISODEFROMVERSION, version.getSubject());
            EpisodeModel.newEpisode(this.model, episode );
        },
        createBlank: function() {
            var version = this.model.get(Voc.currentVersion);
            this.LOG.debug('create new episode from scratch');
            tracker.info(tracker.CREATENEWEPISODEFROMSCRATCH, version.getSubject());
            EpisodeModel.newEpisode(this.model);
        }

    });
});
