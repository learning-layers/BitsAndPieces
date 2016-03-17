// TODO EpisodeManagerView could be renamed to MenuView
define(['config/config', 'vie', 'logger', 'tracker', 'underscore', 'jquery', 'backbone', 'view/episode/EpisodeView', 'data/episode/EpisodeData', 'data/episode/VersionData', 'UserAuth', 'data/episode/UserData', 'voc',
        'utils/EntityHelpers', 'view/modal/PlaceholderAddModalView', 'view/modal/EpisodeAddModalView', 'view/modal/BitAddModalView'], function(appConfig, VIE, Logger, tracker, _, $, Backbone, EpisodeView, EpisodeData, VersionData, UserAuth, UserData, Voc, EntityHelpers, PlaceholderAddModalView, EpisodeAddModalView, BitAddModalView){
    return Backbone.View.extend({
        LOG: Logger.get('EpisodeManagerView'),
        events: {
            'click a#createBlank' : 'createBlank',
            'click a#createPlaceholder' : 'createPlaceholder',
            'click a#createBit' : 'createBit',
            'click a#logout' : 'logOut',
            'click a.helpButton' : 'showHelp',
            'click a.affectButton' : 'handleAffect',
            'click .discussionToolButton' : 'handleDiscussionTool'
        },
        initialize: function() {
            var that = this;
            this.heightChangeAllowed = true;
            this.views = {};
            this.LOG.debug('options', this.options);
            this.vie = this.options.vie;

            this.model.on('change:' + this.model.vie.namespaces.uri(Voc.currentVersion), this.episodeVersionChanged, this);
            this.model.on('change:' + this.model.vie.namespaces.uri(Voc.hasEpisode), this.changeEpisodeSet, this);

            this.placeholderAddModalView = new PlaceholderAddModalView().render();
            $(document).find('body').prepend(this.placeholderAddModalView.$el);

            this.episodeAddModalView = new EpisodeAddModalView().render();
            $(document).find('body').prepend(this.episodeAddModalView.$el);
            this.episodeAddModalView.setCallback(function(label, description) {
                var newEpisode = EpisodeData.newEpisode(that.model, null, {
                    label: label,
                    description: description
                });
                var newVersion = newEpisode.get(Voc.hasVersion);
                that.model.save(Voc.currentVersion, newVersion.getSubject());
                var ev = $.Event("bnp:createEpisode", {
                    entity: newEpisode
                });
                $(document).find("#myToolbar").trigger(ev);
            });

            this.bitAddModalView = new BitAddModalView().render();
            $(document).find('body').prepend(this.bitAddModalView.$el);

            var view = this;
        },
        render: function() {
            this.LOG.debug('EpisodeManager render');

            // Set Bit creation as disabled
            if ( !this.bitAddModalView.isFormDataSupported() ) {
                this.$el.find('#createBit').parent().addClass('disabled');
            }

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
            this.heightChangeAllowed = false;
            this.renderLabel(this.currentEpisode, label);
            this.renderVisibility(this.currentEpisode, this.currentEpisode.get(Voc.circleTypes));
            this.renderAuthor(this.currentEpisode);
            this.renderSharedWith(this.currentEpisode, this.currentEpisode.get(Voc.hasUsers));
            this.renderDiscussionToolButton(this.currentEpisode);
            this.heightChangeAllowed = true;

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
                    prevCurrEpisode.off('change:'+this.model.vie.namespaces.uri(Voc.discussionsCount)+' change:'+this.model.vie.namespaces.uri(Voc.unreadEntriesCount)+' change:'+this.model.vie.namespaces.uri(Voc.entriesCount), this.renderDiscussionToolButton, this);
                    prevCurrEpisode.off('change:'+this.model.vie.namespaces.uri(Voc.label), this.redrawEpisodes, this);
                }
            }
            if(epView = this.views[this.currentEpisode.cid]) {
                epView.highlight();
                this.currentEpisode.on('change:'+this.model.vie.namespaces.uri(Voc.label), this.renderLabel, this);
                this.currentEpisode.on('change:'+this.model.vie.namespaces.uri(Voc.circleTypes), this.renderVisibility, this);
                this.currentEpisode.on('change:'+this.model.vie.namespaces.uri(Voc.hasUsers), this.renderAuthor, this);
                this.currentEpisode.on('change:'+this.model.vie.namespaces.uri(Voc.hasUsers), this.renderSharedWith, this);
                this.currentEpisode.on('change:'+this.model.vie.namespaces.uri(Voc.discussionsCount)+' change:'+this.model.vie.namespaces.uri(Voc.unreadEntriesCount)+' change:'+this.model.vie.namespaces.uri(Voc.entriesCount), this.renderDiscussionToolButton, this);
                this.currentEpisode.on('change:'+this.model.vie.namespaces.uri(Voc.label), this.redrawEpisodes, this);
            }
            this.handleNavbarHeightChange();
        },
        renderLabel: function(episode, label) {
            this.LOG.debug('renderLabel', label);
            this.$el.find('.currentEpisodeLabel').html(label);
            this.handleNavbarHeightChange();
        },
        renderVisibility: function(episode, circleTypes) {
            this.LOG.debug('renderVisibility', circleTypes);
            var elementClasses = ['fa', 'bnp-navbar-icon'],
                elementTitle = '';

            if ( EntityHelpers.isSharedEpisode(episode) ) {
                elementClasses.push('fa-users');
                elementTitle = 'This Episode is shared with other users.';
            } else {
                elementClasses.push('fa-user-secret');
                elementTitle = 'This Episode is private and only visible to owner.';
            }

            this.$el.find('.currentEpisodeVisibility').html('<i class="' + elementClasses.join(' ') + '" title="' + elementTitle + '"></i>');
            this.handleNavbarHeightChange();
        },
        renderAuthor: function(episode) {
            var authorText = '';
            this.LOG.debug('renderAuthor', episode);

            var author = episode.get(Voc.author),
                authorLabel = '',
                elementClasses = ['fa', 'bnp-navbar-icon'];

            if ( author && author.isEntity ) {
                authorLabel = author.get(Voc.label).split('@')[0];
            }

            if ( EntityHelpers.isSharedEpisode(episode) ) {
                elementClasses.push('fa-unlock');
                elementClasses.push('bnp-episode-shared');
            } else {
                elementClasses.push('fa-lock');
                elementClasses.push('bnp-episode-private');
            }

            this.$el.find('.currentEpisodeAuthor').html('<i class="' + elementClasses.join(' ') + '" title="Author: ' + authorLabel  + '"></i>');
            this.handleNavbarHeightChange();
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
                var sharedWithNames = EntityHelpers.getSharedWithNames(episode, true);
                sharedWithText = '<span class="badge bnp-navbar-icon bnp-contributors">' + sharedWithNames.length + '</span>';
            }

            this.$el.find('.currentEpisodeSharedWith > span.bnp-contributors').popover('destroy');
            this.$el.find('.currentEpisodeSharedWith').html(sharedWithText);
            if ( sharedWithText !== '' ) {
                this.$el.find('.currentEpisodeSharedWith > span.bnp-contributors').popover({
                    container: '.navbar',
                    content: sharedWithNames.join(', '),
                    placement: 'bottom',
                    title: 'Contributors',
                    trigger: 'hover'
                });
            }
            this.handleNavbarHeightChange();
        },
        renderDiscussionToolButton: function(episode) {
            // NB! This could be triggered up to a few times in a row
            // If is proven to be resource consuming or in other way problematic
            // Then timeout could be added to maek sure that it only runs once per
            // multiple subsequent calls
            var count = episode.get(Voc.discussionsCount),
                unreadEntriesCount = episode.get(Voc.unreadEntriesCount),
                entriesCount = episode.get(Voc.entriesCount);

            if ( count && count > 0 ) {
                if ( entriesCount && entriesCount > 0 ) {
                    if ( unreadEntriesCount && unreadEntriesCount > 0 ) {
                        this.$el.find('.discussionToolButton > span.count').html(count + ' ( <strong>' + unreadEntriesCount + '</strong> / ' + entriesCount + ' )');
                    } else {
                        this.$el.find('.discussionToolButton > span.count').html(count + ' ( 0 / ' + entriesCount + ' )');
                    }
                } else {
                    this.$el.find('.discussionToolButton > span.count').html(count);
                }
            } else {
                this.$el.find('.discussionToolButton > span.count').html('');
            }

            this.$el.find('.discussionToolButton').popover('destroy');
            this.$el.find('.discussionToolButton').show();
            if ( count && count > 0 ) {
                this.$el.find('.discussionToolButton').popover({
                    container: '.navbar',
                    content: '<strong>' + count + '</strong> discussions in total.<br>With <strong>' + unreadEntriesCount + '</strong> unread entries out of <strong>' + entriesCount + '</strong> total entries.',
                    html: true,
                    placement: 'bottom',
                    trigger: 'hover'
                });
            }
            this.handleNavbarHeightChange();
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
            that.redrawEpisodes();
            
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
            this.$el.find('ul.dropdown-menu').append(view.render().$el);
            this.views[model.cid] = view;
            if ( model === this.currentEpisode ) { view.highlight();}
            return this;
        },
        removeEpisode: function(model) {
            this.LOG.debug('removeEpisode', model);
        },
        createBlank: function(e) {
            var that = this;
            e.preventDefault();
            this.LOG.debug('create new episode from scratch');
            this.episodeAddModalView.showModal();
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
                    version.once('change:'+this.model.vie.namespaces.uri(Voc.belongsToEpisode), this.loadAndSetDiscussionsData, this);
                } else {
                    this.loadAndSetDiscussionsData();
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
           
           tracker.info(tracker.OPENDISCUSSIONTOOL, null, this.currentEpisode.getSubject());
        },
        clearAllEpisodeVisuals: function() {
            this.LOG.debug('clearAllEpisodeVisuals called');
            this.$el.find('.currentEpisodeLabel').html('');
            this.$el.find('.currentEpisodeVisibility').html('');
            this.$el.find('.currentEpisodeAuthor').html('');
            this.$el.find('.currentEpisodeSharedWith').html('');
        },
        loadAndSetDiscussionsData: function() {
            var version = this.model.get(Voc.currentVersion);
            if( !version || !version.isEntity ) {
                return;
            }
            var episode  = version.get(Voc.belongsToEpisode);
            if( !episode && !episode.isEntity ) {
                return;
            }

            // Load and set discussions count
            // Make sure the discussionsCount is set last
            // Listener will change on that being set
            var discussionsPromise = EpisodeData.getDiscussionsData(episode);
            discussionsPromise.done(function(dataSet) {
                episode.set(Voc.discussionsCount, dataSet.discussions);
                episode.set(Voc.unreadEntriesCount, dataSet.unreadEntries);
                episode.set(Voc.entriesCount, dataSet.entries);
            }).fail(function() {
                episode.set(Voc.discussionsCount, 0);
                episode.set(Voc.unreadEntriesCount, 0);
                episode.set(Voc.entriesCount, 0);
            });
        },
        handleNavbarHeightChange: function() {
            if ( this.heightChangeAllowed !== true ) {
                return;
            }
            var menuHeight = this.$el.height(),
                compensatedHeight = menuHeight + 5;
            $(document).find('#bnpApp').css('margin-top', compensatedHeight);
            $(document).find('#myToolbar').css('top', compensatedHeight);
            $(document).find('#systemMessages').css('top', compensatedHeight);
        },
        createBit: function(e) {
            e.preventDefault();

            this.bitAddModalView.showModal();
        },
        redrawEpisodes: function() {
            var that = this;

            if ( _.keys(this.views).length > 1 ) {
                this.$el.find('ul.dropdown-menu').find('li.episode').detach();

                var orderedViews = _.sortBy(this.views, function(view) {
                    return view.model.get(Voc.label).trim();
                });
                _.each(orderedViews, function(view) {
                    that.$el.find('ul.dropdown-menu').append(view.$el);
                });
            }
        }

    });
});
