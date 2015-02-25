define(['logger', 'tracker', 'underscore', 'jquery', 'backbone', 'voc',
        'spin',
        'data/episode/EpisodeData',
        'utils/SystemMessages', 'utils/EntityHelpers'],
    function(Logger, tracker, _, $, Backbone, Voc, Spinner, EpisodeData, SystemMessages, EntityHelpers){
    return Backbone.View.extend({
        LOG: Logger.get('OrganizeOverlayView'),
        tagName: 'div',
        className: 'organizeOverlay',
        events:{
            'click button' : 'disableOverlay'
        },
        initialize: function() {
            this.organizeView = this.options.organizeView;
            this.isOverlayEnabled = false;
            // Organize Model is provided
            var that = this,
                episode = this.getEpisode();

            if ( _.isEmpty(episode) ) {
                var version = this.getVersion();

                version.once('change:'+this.model.vie.namespaces.uri(Voc.belongsToEpisode), this.setEpisodeModelAndListeners, this);
            } else {
                this.setEpisodeModelAndListeners();
            }
        },
        render: function() {
            this.LOG.debug('Rendering OrganizeOverlayView', this.el, this.$el);

            this.$el.append('<button type="button" class="btn btn-info">Request Editing Lock</button>');
            if ( !this.episodeModel ) {
                this.$el.find('button').hide();
                this.$el.append('<span class="episodeLoading">Loading ...</span>');
            }

            return this;
        },
        setEpisodeModelAndListeners: function() {
            this.episodeModel = this.getEpisode();

            this.$el.find('span.episodeLoading').remove();
            this.$el.find('button').show();
            this.$el.hide();

            if ( this.isOverlayNeeded() ) {
                this.enableOverlayVisuals();
            } else if ( this.isLockedByCurrentUser() ) {
                this.enableReleaseLockButton();
            }

            this.episodeModel.on('change:'+this.model.vie.namespaces.uri(Voc.circleTypes), this.episodeModelChanged, this);
            this.episodeModel.on('change:'+this.model.vie.namespaces.uri(Voc.isLocked), this.episodeModelChanged, this);
            this.episodeModel.on('change:'+this.model.vie.namespaces.uri(Voc.isLockedByUser), this.episodeModelChanged, this);
            this.episodeModel.on('change:'+this.model.vie.namespaces.uri(Voc.remainingTime), this.remainingTimeChanged, this);
            this.episodeModel.on('change:'+this.model.vie.namespaces.uri(Voc.lockReleasedByOtherTime), this.lockReleasedByOther, this);
        },
        episodeModelChanged: function() {
            if ( this.isOverlayNeeded() ) {
                if ( false === this.isOverlayEnabled ) {
                    this.enableOverlayVisuals();
                }
            } else {
                if ( true === this.isOverlayEnabled ) {
                    this.disableOverlayVisuals();
                }
            }
        },
        isOverlayNeeded: function() {
            var episode = this.getEpisode();

            // This means model not loaded yet
            if ( _.isEmpty(episode) ) {
                return false;
            }

            if ( EntityHelpers.isSharedEpisode(episode) ) {
                if ( true === episode.get(Voc.isLocked) ) {
                    if ( true === episode.get(Voc.isLockedByUser) ) {
                        return false;
                    } else {
                        return true;
                    }
                } else {
                    return true;
                }
            }

            return false;
        },
        isLockedByCurrentUser: function() {
            var episode = this.getEpisode();

            // Model not loaded yet
            if ( _.isEmpty(episode) ) {
                return false;
            }

            if ( true === episode.get(Voc.isLocked) && true == episode.get(Voc.isLockedByUser) ) {
                return true;
            }

            return false;
        },
        getVersion: function() {
            return this.model.get(Voc.belongsToVersion);
        },
        getEpisode: function() {
            var version = this.getVersion();

            return version.get(Voc.belongsToEpisode);
        },
        addAjaxLoader: function(element) {
            if ( !this.spinner ) {
                this.spinner = new Spinner({
                    radius : 5,
                    length : 5,
                    width : 2
                });
            }
            var wrapper = document.createElement('div');
            wrapper.className = 'ajaxLoaderAbsolute';
            element.append(wrapper);
            this.spinner.spin(wrapper);
        },
        removeAjaxLoader: function(element) {
            this.spinner.stop();
            element.find('.ajaxLoaderAbsolute').remove();
        },
        disableOverlayVisuals: function() {
            if ( false === this.isOverlayEnabled ) {
                return;
            }

            var that = this;

            this.isOverlayEnabled = false;
            this.$el.hide();
            var ev = $.Event('bnp:enableOrganize', {});
            this.$el.trigger(ev);
        },
        disableOverlay: function(e) {
            var that = this,
                episode = this.getEpisode(),
                promise = EpisodeData.setEpisodeLock(episode);

            this.addAjaxLoader(this.$el);

            promise.done(function(result) {

                if ( result === true ) {
                    that.organizeView.clearOrganizeAndViews();
                    var versionsPromise = EpisodeData.fetchVersions(episode);
                    var versionsCB = function() {
                        that.organizeView.reRenderOrganize();
                        that.removeAjaxLoader(that.$el);
                        that.disableOverlayVisuals();

                        episode.set(Voc.isLocked, true);
                        episode.set(Voc.isLockedByUser, true);
                    };

                    versionsPromise.done(function() {
                        versionsCB();
                    }).fail(function() {
                        versionsCB();
                    });

                    tracker.info(tracker.REQUESTEDITBUTTON, tracker.ORGANIZEAREA, episode.getSubject(), 'success');
                } else {
                    that.organizeView.clearOrganizeAndViews();
                    var versionsPromise = EpisodeData.fetchVersions(episode);

                    versionsPromise.done(function() {
                        that.organizeView.reRenderOrganize();
                    }).fail(function() {
                        that.organizeView.reRenderOrganize();
                    });

                    that.removeAjaxLoader(that.$el);
                    SystemMessages.addWarningMessage('Episode could not be locked for editing. Please try again later.');

                    tracker.info(tracker.REQUESTEDITBUTTON, tracker.ORGANIZEAREA, episode.getSubject(), 'fail');
                }
            }).fail(function(f) {
                SystemMessages.addDangerMessage('Service error occured while trying to lock an episode.');

                tracker.info(tracker.REQUESTEDITBUTTON, tracker.ORGANIZEAREA, episode.getSubject(), 'error');
            });
        },
        enableReleaseLockButton: function() {
            var ev = $.Event('bnp:addReleaseLockButton', {});
            this.$el.trigger(ev);
        },
        enableOverlayVisuals: function() {
            if ( true === this.isOverlayEnabled ) {
                return;
            }

            this.isOverlayEnabled = true;
            this.$el.show();
            var ev = $.Event('bnp:disableOrganize', {});
            this.$el.trigger(ev);
        },
        enableOverlay: function(e) {
            var that = this,
                promise = EpisodeData.removeEpisodeLock(this.getEpisode()),
                episode = this.getEpisode();

            // TODO Consider using some AJAX loader
            // TODO Consider enabling overlay right away
            promise.done(function(result) {
                if ( true === result ) {
                    // Clear auto release timeout if set
                    if ( that.autoLockReleaseTimeout ) {
                        clearTimeout(that.autoLockReleaseTimeout);
                    }

                    that.enableOverlayVisuals();

                    episode.set(Voc.isLocked, false);
                    episode.set(Voc.isLockedByUser, false);

                    tracker.info(tracker.RELEASEEDITBUTTON, tracker.ORGANIZEAREA, episode.getSubject(), 'success');
                } else {
                    SystemMessages.addWarningMessage('Episode lock could not be removed. Please try again later.');

                    tracker.info(tracker.RELEASEEDITBUTTON, tracker.ORGANIZEAREA, episode.getSubject(), 'fail');
                }
            }).fail(function(f) {
                SystemMessages.addDangerMessage('Service error occured while trying to release the lock of an episode.');

                tracker.info(tracker.RELEASEEDITBUTTON, tracker.ORGANIZEAREA, episode.getSubject(), 'error');
            });
        },
        removeEpisodeLockIfNeeded: function() {
            if ( this.isLockedByCurrentUser() ) {
                this.enableOverlay();
            }
        },
        remainingTimeChanged: function() {
            var episode = this.getEpisode(),
                remainingTime = episode.get(Voc.remainingTime),
                minutesRemaining = 0,
                secondsRemaining = 0;

            if ( this.isOverlayEnabled ) {
                this.$el.find('.lockTimeRemaining').remove();
                if ( remainingTime && episode.get(Voc.isLocked) ) {
                    minutesRemaining = Math.floor(remainingTime / ( 1000 * 60 ));
                    secondsRemaining = Math.floor(( remainingTime / 1000 ) % 60);
                    this.$el.find('button').append('<span class="lockTimeRemaining"> in ' + ( ( minutesRemaining > 0 ) ? minutesRemaining + ' minutes ' : '') + ( ( secondsRemaining > 0 ) ? secondsRemaining + ' seconds' : '') + '</span>');
                }
            }
            if ( this.isLockedByCurrentUser() ) {
                minutesRemaining = Math.floor(remainingTime / ( 1000 * 60 ));
                secondsRemaining = Math.floor(( remainingTime / 1000 ) % 60);
                var ev = $.Event('bnp:lockTimeRemaining', {
                    minutesRemaining: minutesRemaining,
                    secondsRemaining: secondsRemaining
                });
                this.$el.trigger(ev);

                // Set timeout to enable overlay early in case less or equal to 30 seconds are left
                if ( remainingTime > 0 && remainingTime <= 30000 ) {
                    var that = this;
                    that.autoLockReleaseTimeout = setTimeout(function() {
                        that.enableOverlayVisuals();
                        episode.set(Voc.isLocked, false);
                        episode.set(Voc.isLockedByUser, false);
                    }, remainingTime);
                }
            }
        },
        lockReleasedByOther: function(episode) {
            this.organizeView.clearOrganizeAndViews();
            var that = this;
            var versionsPromise = EpisodeData.fetchVersions(episode);

            versionsPromise.done(function() {
                that.organizeView.reRenderOrganize();
            }).fail(function() {
                that.organizeView.reRenderOrganize();
            });
        }
    });
});
