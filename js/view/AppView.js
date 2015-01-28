define(['logger', 'tracker', 'backbone', 'jquery', 'voc','underscore',
        'data/timeline/TimelineData', 
        'data/organize/OrganizeData',
        'data/episode/UserData',
        'data/episode/EpisodeData',
        'data/episode/VersionData',
        'view/WidgetView',
        'view/episode/EpisodeManagerView',
        'view/toolbar/ToolbarView',
        'view/CircleRenameModalView',
        'utils/SystemMessages',
        'text!templates/navbar.tpl'],
    function(Logger, tracker, Backbone, $, Voc, _, TimelineData, OrganizeData, UserData, EpisodeData, VersionData,WidgetView, EpisodeManagerView, ToolbarView, CircleRenameModalView, SystemMessages, NavbarTemplate){
        AppLog = Logger.get('App');
        return Backbone.View.extend({
            events : {
                'bnp:clickEntity' : 'clickEntity',
                'bnp:showHideToolbar' : 'handleShowHideToolbar'
            },
            initialize: function() {
                this.vie = this.options.vie;
                this.widgetViews = [];

                this.vie.entities.on('add', this.filter, this );
                var that = this;
                this.model.on('change:' 
                    + this.vie.namespaces.uri(Voc.currentVersion), 
                    function(model, value, options) {
                        version = model.get(Voc.currentVersion);
                        if( version.isEntity) that.show(version);
                    }, this);
                this.model.on('change:'
                    + this.vie.namespaces.uri(Voc.label),
                    function(model, value, options) {
                        that.$el.parent().find('.currentUserLabel > .userLabel').html(model.get(Voc.label));
                    },this);
                this.model.on('change:'
                    + this.vie.namespaces.uri(Voc.hasEpisode),
                    function(model, value, options) {
                        if ( false === value ) {
                            SystemMessages.addWarningMessage('You have no episodes. Please open the <strong>Menu</strong> and choose <strong>Create New Episode</strong>!');
                        }
                    },this);
                this.setUpEpisodeLockHoldInternal();

            },
            filter: function(model, collection, options) {
                if(model.isof(Voc.VERSION)){
                    var version = model;
                    var AppView = this;
                    AppLog.debug('version added', model);

                    // draw already existing widgets
                    this.draw(version);
                    
                    // draw widgets as soon as they are added to the version
                    version.on('change:' + this.vie.namespaces.uri(Voc.hasWidget), function(model, widgets, options) {

                        AppLog.debug('Version hasWidget changed', widgets);
                        AppView.draw(model);
                    });

                }
            },
            render: function() {
                var navbar = _.template(NavbarTemplate, {
                    userLabel: this.model.get(Voc.label)
                });
                // Prepend navbar to body
                this.$el.parent().prepend(navbar);

                this.widgetFrame = $('<div id="myWidgets"></div>');
                this.$el.append( this.widgetFrame );
                this.episodeMgrView = new EpisodeManagerView({
                    model: this.model,
                    el: 'nav',
                    vie : this.vie
                });
                this.episodeMgrView.render();

                var toolbar = $('<div id="myToolbar"></div>');
                this.$el.append( toolbar );
                this.toolbarView = new ToolbarView({
                    model: this.model,
                    el : toolbar
                });
                this.toolbarView.render();

                // Initialize and place the CircleRenameMoval view
                this.circleRenameModalView = new CircleRenameModalView().render();
                this.$el.parent().prepend(this.circleRenameModalView.$el);
            },
            drawWidget: function(versionElem, widget) {
                AppLog.debug('drawWidget', widget);
                if( !widget.isEntity )
                    widget =  this.vie.entities.get(widget);
                if( !widget ) {
                    AppLog.debug("drawWidget of inexistent widget called");
                    return;
                }

                var widgetView = new WidgetView({
                    model: widget,
                    tagName: 'fieldset',
                    circleRenameModalView: this.circleRenameModalView
                });
                if( widgetView.isBrowse() ) {
                    versionElem.prepend(widgetView.$el);
                }else if( widgetView.isOrganize() ) {
                    versionElem.append(widgetView.$el);
                }
                widgetView.render();
                this.widgetViews.push(widgetView);
            },
            draw: function(version) {
                if( !version ) return;
                if( !version.isEntity )  {
                    if(!(version = this.vie.entities.get(version)))
                        return;
                }
                AppLog.debug('drawing ', version.getSubject());
                var versionElem = this.widgetFrame.children('*[about="'+version.getSubject()+'"]').first();
                AppLog.debug('versionElem', versionElem);
                if( versionElem.length === 0) {
                    versionElem = $('<div about="'+version.getSubject()+'" rel="'+this.vie.namespaces.uri(Voc.hasWidget)+'"></div>');
                    this.widgetFrame.append(versionElem);
                    version.once('change:' + version.idAttribute, function(model, value, options) {
                        AppLog.debug('change subject from', model.cid, 'to', value);
                        versionElem.attr('about', value);
                    });
                }
                var widgets = version.get(Voc.hasWidget) || [];
                if( !_.isArray(widgets)) widgets = [widgets];
                if( !widgets || widgets.length === 0 ) return;

                var abouts = versionElem.children().map(function(i, c){
                    return c.getAttribute('about');
                });
                var that = this;
                _.each(widgets, function(widget){
                    if( !_.contains(abouts, widget.getSubject()))
                        that.drawWidget(versionElem, widget);
                });
                if( version === this.model.get(Voc.currentVersion)) {
                    this.show(version);
                } else {
                    versionElem.addClass('widgetHidden');
                }
            },
            show: function(version) {
                if( !version ) return;
                if( !version.isEntity )  {
                    if(!(version = this.vie.entities.get(version)))
                        return;
                }

                AppLog.debug('showing', version.getSubject());

                var that= this;
                this.widgetFrame.children().addClass('widgetHidden');
                AppLog.debug('hide' , this.widgetFrame.children());
                var element = this.widgetFrame.children('*[about="'+version.getSubject()+'"]');
                element.removeClass('widgetHidden');
                element.detach();
                this.widgetFrame.prepend(element);

                var previousVersion = this.model.previous(Voc.currentVersion);
                // This force redraws current timeline element.
                // This happends due to elements being hidden initially.
                _.each(this.widgetViews, function(widget) {
                    if ( widget.model.get(Voc.belongsToVersion) === version ) {
                        if ( widget.isBrowse() && widget.view.timeline ) {
                            widget.view.timeline.redraw();
                        } else if ( widget.isOrganize() ) {
                            var episode = version.get(Voc.belongsToEpisode);

                            if ( episode && episode.isEntity ) {
                                // TODO See if we need to use the promise to handel success/fail
                                EpisodeData.learnEpLockHold(episode);
                            } else {
                                AppLog.debug("Episode Missing From Version, could not check locks", widget.model, version);
                            }
                        }
                    } else if ( widget.model.get(Voc.belongsToVersion) === previousVersion ) {
                        if ( widget.isOrganize() ) {
                            widget.removeEpisodeLockIfNeeded();
                        }
                    }
                });

            },
            browseCurrentBrowseWidget: function(entity) {
                var version = this.model.get(Voc.currentVersion);

                _.each(this.widgetViews, function(widget) {
                    if ( widget.isBrowse() && widget.model.get(Voc.belongsToVersion) === version ) {
                        // Call browseTo on current widget view attribute
                        // filled with real widget view
                        widget.view.browseTo(entity);
                    }
                });
            },
            clickEntity: function(e) {
                this.toolbarView.setBit(e.entity);

                if ( e.viewContext && e.viewContext === this.toolbarView ) {
                    AppLog.debug("clickEntity called within ToolbarView context");
                    this.browseCurrentBrowseWidget(e.entity);
                }
            },
            handleShowHideToolbar: function(e) {
                var systemMessages = $(document).find('#systemMessages');

                if ( 'shown' === e.customType ) {
                    systemMessages.toggleClass('systemMessagesToolbarOpen', true, function() {});
                } else {
                    systemMessages.toggleClass('systemMessagesToolbarOpen', false);
                }
            },
            setUpEpisodeLockHoldInternal: function() {
                var that = this;

                setInterval(function() {
                    var version = that.model.get(Voc.currentVersion);

                    if ( version && version.isEntity ) {
                        var episode = version.get(Voc.belongsToEpisode);

                        if ( episode && episode.isEntity ) {
                            var promise = EpisodeData.learnEpLockHold(episode);

                            promise.done(function(result, passThrough) {
                                AppLog.debug('learnEpLockHold Succeeded', result, passThrough);
                            }).fail(function(f) {
                                AppLog.debug('learnEpLockHold Failed', f);
                            });
                        } else {
                            AppLog.debug('learnEpLockHold No Episoe For Version', version);
                        }
                    } else {
                        AppLog.debug('learnEpLockHold No Current Version For User', that.model);
                    }
                }, 30000);
            }
        });
});
