define(['logger', 'underscore', 'jquery', 'backbone', 'voc',
        'spin',
        'data/episode/EpisodeData',
        'utils/SystemMessages', 'utils/EntityHelpers'],
    function(Logger, _, $, Backbone, Voc, Spinner, EpisodeData, SystemMessages, EntityHelpers){
    return Backbone.View.extend({
        LOG: Logger.get('OrganizeOverlayView'),
        tagName: 'div',
        className: 'organizeOverlay',
        events:{
            'click button' : 'disableOverlay'
        },
        _hackEpisodeModelLoadedTimeout: function() {
            var that = this;

            setTimeout(function() {
                if ( _.isEmpty(that.getEpisode()) ) {
                    that._hackEpisodeModelLoadedTimeout();
                    return;
                }

                // XXX This one would have to check
                // if model loaded and add one ore timeout if not
                if ( that.isOverlayNeeded() ) {
                    that.enableOverlayVisuals();
                } else if ( that.isLockedByCurrentUser() ) {
                    that.enableReleaseLockButton();
                }
                that.setEpisodeModelAndListeners();
            }, 1000);
        },
        initialize: function() {
            this.isOverlayEnabled = false;
            // Organize Model is provided
            var that = this,
                episode = this.getEpisode();

            if ( _.isEmpty(episode) ) {
                var version = this.getVersion();

                // XXX Looks like this one is not working, no idea why
                // version.once('change:'+this.model.vie.namespaces.uri(Voc.belongsToEpisode), this.setEpisodeModelAndUpdateVisuals, this);
                // XXX This is pure evil
                this._hackEpisodeModelLoadedTimeout();
            } else {
                this.setEpisodeModelAndListeners();
            }

            this.$el.hide();
            if ( this.isOverlayNeeded() ) {
                this.enableOverlayVisuals();
            } else if ( this.isLockedByCurrentUser() ) {
                this.enableReleaseLockButton();
            }
        },
        render: function() {
            this.LOG.debug('Rendering OrganizeOverlayView', this.el, this.$el);

            this.$el.append('<button type="button" class="btn btn-default">Request Editing Lock</button>');

            return this;
        },
        setEpisodeModelAndListeners: function() {
            this.episodeModel = this.getEpisode();
            this.episodeModel.on('change:'+this.model.vie.namespaces.uri(Voc.circleTypes), this.episodeModelChanged, this);
            this.episodeModel.on('change:'+this.model.vie.namespaces.uri(Voc.isLocked), this.episodeModelChanged, this);
            this.episodeModel.on('change:'+this.model.vie.namespaces.uri(Voc.isLockedByUser), this.episodeModelChanged, this);
        },
        episodeModelChanged: function() {
            if ( this.isOverlayNeeded() ) {
                if ( false === this.isOverlayEnabled ) {
                    this.enableOverlayVisuals();
                }
            } else {
                if ( true === this.isOverlayEnabled ) {
                    this.disableOverlayVisuals();
                } else if ( this.isLockedByCurrentUser() ) {
                    // TODO Check if this one is needed
                    this.enableReleaseLockButton();
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
                that.removeAjaxLoader(that.$el);

                if ( result === true ) {
                    episode.set(Voc.isLocked, true);
                    episode.set(Voc.isLockedByUser, true);

                    that.disableOverlayVisuals();
                } else {
                    SystemMessages.addWarningMessage('Episode could not be locked for editing. Please try again later.');
                }
            }).fail(function(f) {
                SystemMessages.addDangerMessage('Service error occured while trying to lock an episode.');
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
                    episode.set(Voc.isLocked, false);
                    episode.set(Voc.isLockedByUser, false);

                    that.enableOverlayVisuals();
                } else {
                    SystemMessages.addWarningMessage('Episode lock could not be removed. Please try again later.');
                }
            }).fail(function(f) {
                SystemMessages.addDangerMessage('Service error occured while trying to release the lock of an episode.');
            });
        }
    });
});
