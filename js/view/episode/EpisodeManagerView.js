define(['vie', 'logger', 'tracker', 'underscore', 'jquery', 'backbone', 'view/episode/EpisodeView', 'model/episode/EpisodeModel', 'model/episode/VersionModel', 'voc'], function(VIE, Logger, tracker, _, $, Backbone, EpisodeView, EpisodeModel, VersionModel, Voc){
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
            this.$el.html('<img src="css/img/menu_small.png" id="toggleEpisodes"/><h1 contenteditable="true"></h1>' + 
                    '<div id="episodes"><button id="createNewVersion">New Version</button><button id="createBlank">Create new Episode from scratch</button><button id="createFromHere">Create new Episode from here</button><ul></ul></div>');

            this.model.on('change:' + this.model.vie.namespaces.uri(Voc.currentVersion), 
                this.render, this);
            this.model.on('change:' + this.model.vie.namespaces.uri(Voc.hasEpisode), this.changeEpisodeSet, this);
            var view = this;
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
            this.renderLabel(this.currentEpisode, label);
            if( this.currentEpisode.get('label') == label) return;
            this.LOG.debug('changeLabel', label);
            tracker.info(tracker.RENAMEEPISODE, this.model.getSubject(), label);
            this.currentEpisode.save({'label': label});
        },
        updateOnEnter: function(e) {
            if (e.keyCode == 13) {
                this.changeLabel();
            }
        },
        render: function() {
            this.LOG.debug('EpisodeManager render');
            var version = this.model.get(Voc.currentVersion);
            this.LOG.debug('version', _.clone(version));
            if( !version || !version.isEntity ) return;
            this.currentEpisode = version.get(Voc.belongsToEpisode);
            this.LOG.debug('currentEpisode', _.clone(this.currentEpisode));
            if( !this.currentEpisode ) {
                // wait for the episode to be ready
                version.once('change:'+this.model.vie.namespaces.uri(Voc.belongsToEpisode), this.render, this);
                return;
            }
            var label = this.currentEpisode.get(Voc.label);
            this.renderLabel(this.currentEpisode, label);

            var prevCurrVersion = this.model.previous(Voc.currentVersion);
            var prevCurrEpisode, epView;
            if( prevCurrVersion ) {
                prevCurrEpisode = prevCurrVersion.get(Voc.belongsToEpisode);
                if(epView = this.views[prevCurrEpisode.cid]) {
                    epView.unhighlight();
                }
                prevCurrEpisode.off('change:'+this.model.vie.namespaces.uri(Voc.label), this.renderLabel, this);
            }
            if(epView = this.views[this.currentEpisode.cid]) {
                epView.highlight(version.getSubject());
                this.currentEpisode.on('change:'+this.model.vie.namespaces.uri(Voc.label), this.renderLabel, this);
            }
        },
        renderLabel: function(episode, label) {
            this.LOG.debug('renderLabel', label);
            this.$el.find('h1').html(label);
        },
        changeEpisodeSet: function(model, set, options) {
            this.LOG.debug('changeEpisodeSet', set);  
            var previous = this.model.previous(Voc.hasEpisode);
            if( !_.isArray(set)) set = [set];
            for( var i = 0; i < set.length; i++ ) {
                set[i] = this.model.vie.entities.get(set[i]);
            }
            this.LOG.debug('previous', previous);  
            var that = this;
            var added = _.difference(set, previous);
            this.LOG.debug('added', added);
            _.each(added, function(a){
                a = that.model.vie.entities.get(a);
                that.addEpisode(a);
            });
            
            var deleted = _.difference(previous, set);
            _.each(deleted, function(a){
                a = that.model.vie.entities.get(a);
                that.removeEpisode(a);
            });
        },
        addEpisode: function(model) {
            this.LOG.debug('addEpisode', model);
            var view = new EpisodeView({'model':model});
            var li = $('<li class="episode" about="'+model.getSubject()+'"></li>');
            if( model.isNew() ) {
                model.once('change:'+model.idAttribute, 
                    function(model, value) {
                        li.attr('about', value);
                });
            }
            li.append(view.render().$el);
            this.$el.find('ul').first().append(li);
            this.views[model.cid] = view;
            if( model === this.currentEpisode ) { view.highlight();}
            return this;
        },
        removeEpisode: function(model) {
            this.LOG.debug('removeEpisode', model);
        },
        createNewVersion: function() {
            var version = this.model.get(Voc.currentVersion);
            this.LOG.debug('createNewVersion from', version);
            tracker.info(tracker.CREATENEWVERSION, version.getSubject());
            var episode = version.get(Voc.belongsToEpisode);
            var newVersion = VersionModel.newVersion(episode, version);
            this.model.save(Voc.currentVersion, newVersion.getSubject());
        },
        createFromHere: function() {
            var version = this.model.get(Voc.currentVersion);
            this.LOG.debug('create new episode from version', version);
            tracker.info(tracker.CREATENEWEPISODEFROMVERSION, version.getSubject());
            EpisodeModel.newEpisode(this.model, version );
        },
        createBlank: function() {
            var version = this.model.get(Voc.currentVersion);
            this.LOG.debug('create new episode from scratch');
            tracker.info(tracker.CREATENEWEPISODEFROMSCRATCH, version.getSubject());
            EpisodeModel.newEpisode(this.model);
        }

    });
});
