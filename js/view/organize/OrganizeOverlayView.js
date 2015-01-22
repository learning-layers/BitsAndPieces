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
        initialize: function() {
            // Organize Model is provided
            var that = this,
                episode = this.getEpisode();

            if ( _.isEmpty(episode) ) {
                // XXX ight need to retry until model loaded
                setTimeout(function () {
                    if ( that.isOverlayNeeded() ) {
                        that.enableOverlayVisuals();
                    }
                }, 1000);
            }

            this.$el.hide();
            if ( this.isOverlayNeeded() ) {
                this.enableOverlayVisuals();
            }
        },
        render: function() {
            this.LOG.debug('Rendering OrganizeOverlayView', this.el, this.$el);

            this.$el.append('<button type="button" class="btn btn-default">Request Editing Lock</button>');

            return this;
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
        getEpisode: function() {
            return this.model.get(Voc.belongsToVersion).get(Voc.belongsToEpisode);
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
        enableOverlayVisuals: function() {
            this.$el.show();
            var ev = $.Event('bnp:disableOrganize', {});
            this.$el.trigger(ev);
        },
        enableOverlay: function(e) {
            var promise = EpisodeData.removeEpisodeLock(this.getEpisode());

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