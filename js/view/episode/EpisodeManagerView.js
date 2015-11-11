// TODO EpisodeManagerView could be renamed to MenuView
define(['config/config', 'vie', 'logger', 'tracker', 'underscore', 'jquery', 'backbone', 'view/episode/EpisodeView', 'data/episode/EpisodeData', 'data/episode/VersionData', 'UserAuth', 'data/episode/UserData', 'voc',
        'utils/EntityHelpers', 'view/modal/PlaceholderAddModalView'], function(appConfig, VIE, Logger, tracker, _, $, Backbone, EpisodeView, EpisodeData, VersionData, UserAuth, UserData, Voc, EntityHelpers, PlaceholderAddModalView){
    return Backbone.View.extend({
        LOG: Logger.get('EpisodeManagerView'),
        events: {
            'click a#createBlank' : 'createBlank',
            'click a#createPlaceholder' : 'createPlaceholder',
            //'click button#createFromHere' : 'createFromHere',
            //'click button#createNewVersion' : 'createNewVersion',
            'click a#logout' : 'logOut',
            'click a.helpButton' : 'showHelp',
            'click a.affectButton' : 'handleAffect',
            'click .discussionToolButton' : 'handleDiscussionTool'
        },
        initialize: function() {
            this.views = {};
            this.LOG.debug('options', this.options);
            this.vie = this.options.vie;

            this.model.on('change:' + this.model.vie.namespaces.uri(Voc.currentVersion), this.episodeVersionChanged, this);
            this.model.on('change:' + this.model.vie.namespaces.uri(Voc.hasEpisode), this.changeEpisodeSet, this);

            this.placeholderAddModalView = new PlaceholderAddModalView().render();
            $(document).find('body').prepend(this.placeholderAddModalView.$el);
            var view = this;
        },
        render: function() {
            this.LOG.debug('EpisodeManager render');
            // Hide discussionTool button until episode is loaded
            this.$el.find('.discussionToolButton').hide();

            var version = this.model.get(Voc.currentVersion);
            this.LOG.debug('version', _.clone(version));
            if( !version || !version.isEntity ) {
                this.clearAllEpisodeVisuals();
                return;
            }
            this.currentEpisode = version.get(Voc.belongsToEpisode);
            this.LOG.debug('currentEpisode', _.clone(this.currentEpisode));
            if( !this.currentEpisode ) {
                // wait for the episode to be ready
                version.once('change:'+this.model.vie.namespaces.uri(Voc.belongsToEpisode), this.render, this);
                return;
            }

            var label = this.currentEpisode.get(Voc.label);
            this.renderLabel(this.currentEpisode, label);
            this.renderVisibility(this.currentEpisode, this.currentEpisode.get(Voc.circleTypes));
            this.renderAuthor(this.currentEpisode);
            this.renderSharedWith(this.currentEpisode, this.currentEpisode.get(Voc.hasUsers));
            this.renderDiscussionToolButton(this.currentEpisode);

            var prevCurrVersion = this.model.previous(Voc.currentVersion);
            var prevCurrEpisode, epView;
            if( prevCurrVersion ) {
                prevCurrEpisode = prevCurrVersion.get(Voc.belongsToEpisode);
                if ( prevCurrEpisode ) {
                    if(epView = this.views[prevCurrEpisode.cid]) {
                        epView.unhighlight();
                    }
                    prevCurrEpisode.off('change:'+this.model.vie.namespaces.uri(Voc.label), this.renderLabel, this);
                    prevCurrEpisode.off('change:'+this.model.vie.namespaces.uri(Voc.circleTypes), this.renderVisibility, this);
                    prevCurrEpisode.off('change:'+this.model.vie.namespaces.uri(Voc.hasUsers), this.renderAuthor, this);
                    prevCurrEpisode.off('change:'+this.model.vie.namespaces.uri(Voc.hasUsers), this.renderSharedWith, this);
                    prevCurrEpisode.off('change:'+this.model.vie.namespaces.uri(Voc.discussionsCount), this.renderDiscussionToolButton, this);
                }
            }
            if(epView = this.views[this.currentEpisode.cid]) {
                epView.highlight();
                this.currentEpisode.on('change:'+this.model.vie.namespaces.uri(Voc.label), this.renderLabel, this);
                this.currentEpisode.on('change:'+this.model.vie.namespaces.uri(Voc.circleTypes), this.renderVisibility, this);
                this.currentEpisode.on('change:'+this.model.vie.namespaces.uri(Voc.hasUsers), this.renderAuthor, this);
                this.currentEpisode.on('change:'+this.model.vie.namespaces.uri(Voc.hasUsers), this.renderSharedWith, this);
                this.currentEpisode.on('change:'+this.model.vie.namespaces.uri(Voc.discussionsCount), this.renderDiscussionToolButton, this);
            }
            this.handleNavbarHeightChange();
        },
        renderLabel: function(episode, label) {
            this.LOG.debug('renderLabel', label);
            this.$el.find('.currentEpisodeLabel').html(label);
        },
        renderVisibility: function(episode, circleTypes) {
            this.LOG.debug('renderVisibility', circleTypes);
            this.$el.find('.currentEpisodeVisibility').html(EntityHelpers.getEpisodeVisibility(episode));
        },
        renderAuthor: function(episode) {
            var authorText = '';
            this.LOG.debug('renderAuthor', episode);

            if ( EntityHelpers.isSharedEpisode(episode) ) {
                var author = episode.get(Voc.author),
                    authorLabel = '';

                if ( author && author.isEntity ) {
                    authorLabel = author.get(Voc.label);
                }
                authorText = ' | author: ' + authorLabel;
            }

            this.$el.find('.currentEpisodeAuthor').html(authorText);
        },
        renderSharedWith: function(episode, users) {
            this.LOG.debug('renderSharedWith', users);

            var sharedWithText = '';

            if ( !EntityHelpers.isSharedEpisode(episode) ) {
                this.$el.find('.currentEpisodeSharedWith').html(sharedWithText);
                return;
            }
            if ( _.isEmpty(users) ) {
                users = [];
            }

            if ( !_.isArray(users) ) {
                users = [users];
            }


            if ( users.length > 0 ) {
                sharedWithText = 'contributors: ' + EntityHelpers.getSharedWithNames(episode).join(', ');
            }

            this.$el.find('.currentEpisodeSharedWith').html(sharedWithText);
        },
        renderDiscussionToolButton: function(episode) {
            var count = episode.get(Voc.discussionsCount);

            if ( count && count > 0 ) {
                this.$el.find('.discussionToolButton > span.count').html('( ' + count + ' )');
            } else {
                this.$el.find('.discussionToolButton > span.count').html('');
            }

            this.$el.find('.discussionToolButton').show();
        },
        changeEpisodeSet: function(model, set, options) {
            this.LOG.debug('changeEpisodeSet', set);  
            // normalize to array
            set = set || [];
            if( !_.isArray(set)) set = [set];
            else set = _.clone(set);
            var previous = this.model.previous(Voc.hasEpisode) || [];
            if( !_.isArray(previous)) previous = [previous];
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
            this.LOG.debug('deleted', deleted);
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
            this.$el.find('ul.dropdown-menu').append(li);
            this.views[model.cid] = view;
            if( model === this.currentEpisode ) { view.highlight();}
            return this;
        },
        removeEpisode: function(model) {
            this.LOG.debug('removeEpisode', model);
        },
        // @unused Only one version allowed
        createNewVersion: function() {
            var version = this.model.get(Voc.currentVersion);
            this.LOG.debug('createNewVersion from', version);
            var episode = version.get(Voc.belongsToEpisode);
            var newVersion = VersionData.newVersion(episode, version);
            this.model.save(Voc.currentVersion, newVersion.getSubject());
        },
        // @unused Creating episode from version removed
        createFromHere: function() {
            var version = this.model.get(Voc.currentVersion);
            this.LOG.debug('create new episode from version', version);
            var newEpisode = EpisodeData.newEpisode(this.model, version );
            var newVersion = newEpisode.get(Voc.hasVersion);
            this.model.save(Voc.currentVersion, newVersion.getSubject());
        },
        createBlank: function(e) {
            e.preventDefault();
            this.LOG.debug('create new episode from scratch');
            var newEpisode = EpisodeData.newEpisode(this.model);
            var newVersion = newEpisode.get(Voc.hasVersion);
            this.model.save(Voc.currentVersion, newVersion.getSubject());
            var ev = $.Event("bnp:createEpisode", {
                originalEvent: e,
                entity: this.model
            });
            $(document).find("#myToolbar").trigger(ev);
        },
        createPlaceholder: function(e) {
            e.preventDefault();

            this.placeholderAddModalView.showModal();
        },
        episodeVersionChanged: function() {
            var version = this.model.get(Voc.currentVersion);
            if ( version && version.isEntity ) {
                var episode = version.get(Voc.belongsToEpisode);
                if( !episode ) {
                    // wait for the episode to be ready
                    version.once('change:'+this.model.vie.namespaces.uri(Voc.belongsToEpisode), this.loadAndSetDiscussionsCount, this);
                } else {
                    this.loadAndSetDiscussionsCount();
                }
            }

            this.render();
        },
        logOut: function(e) {
            e.preventDefault();
            var version = this.model.get(Voc.currentVersion);

            if ( version && version.isEntity ) {
                var episode = episode = version.get(Voc.belongsToEpisode);

                if ( episode && episode.isEntity ) {
                    // Release episode lock if needed
                    if ( true === episode.get(Voc.isLocked) && true == episode.get(Voc.isLockedByUser) ) {
                        EpisodeData.removeEpisodeLock(episode);
                    }
                }
            }

            if (UserAuth.logout()) {
                document.location.reload();
            }
        },
        showHelp: function(e) {
            tracker.info(tracker.CLICKHELPBUTTON, null);
        },
        handleAffect: function(e) {
            tracker.info(tracker.CLICKAFFECTBUTTON, null);
        },
        handleDiscussionTool: function(e) {
           if ( !this.currentEpisode ) return;

           var url = appConfig.discussionToolUrl
               + '#/auth/'
               + encodeURIComponent(encodeURIComponent(this.currentEpisode.getSubject()));
           window.open(url);
        },
        clearAllEpisodeVisuals: function() {
            this.LOG.debug('clearAllEpisodeVisuals called');
            this.$el.find('.currentEpisodeLabel').html('');
            this.$el.find('.currentEpisodeVisibility').html('');
            this.$el.find('.currentEpisodeAuthor').html('');
            this.$el.find('.currentEpisodeSharedWith').html('');
        },
        loadAndSetDiscussionsCount: function() {
            var version = this.model.get(Voc.currentVersion);
            if( !version || !version.isEntity ) {
                return;
            }
            var episode  = version.get(Voc.belongsToEpisode);
            if( !episode && !episode.isEntity ) {
                return;
            }

            // Load and set discussions count
            var discussionsPromise = EpisodeData.getDiscussionsCount(episode);
            discussionsPromise.done(function(count) {
                episode.set(Voc.discussionsCount, count);
            }).fail(function() {
                episode.set(Voc.discussionsCount, 0);
            });
        },
        handleNavbarHeightChange: function() {
            var menuHeight = this.$el.height(),
                compensatedHeight = menuHeight + 5;
            $(document).find('#bnpApp').css('margin-top', compensatedHeight);
            $(document).find('#myToolbar').css('top', compensatedHeight);
            $(document).find('#systemMessages').css('top', compensatedHeight);
        }
    });
});
