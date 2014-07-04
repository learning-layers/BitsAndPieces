define(['logger', 'tracker', 'backbone', 'jquery', 'voc','underscore',
        'data/timeline/TimelineData', 
        'data/organize/OrganizeData',
        'data/episode/UserData',
        'data/episode/EpisodeData',
        'data/episode/VersionData',
        'view/WidgetView',
        'view/episode/EpisodeManagerView',
        'view/toolbar/ToolbarView'],
    function(Logger, tracker, Backbone, $, Voc, _, TimelineData, OrganizeData, UserData, EpisodeData, VersionData,WidgetView, EpisodeManagerView, ToolbarView){
        AppLog = Logger.get('App');
        return Backbone.View.extend({
            events : {
                'bnp:clickEntity' : 'clickEntity',
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
                var episodes = $('<div id="myEpisodes1"></div>');
                this.widgetFrame = $('<div id="myWidgets"></div>');
                this.$el.append( episodes );
                this.$el.append( this.widgetFrame );
                this.episodeMgrView = new EpisodeManagerView({
                    model: this.model,
                    el: episodes,
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
            },
            drawWidget: function(versionElem, widget) {
                AppLog.debug('drawWidget', widget);
                if( !widget.isEntity )
                    widget =  this.vie.entities.get(widget);
                if( !widget ) {
                    console.error("drawWidget of inexistent widget called");
                    return;
                }

                var widgetView = new WidgetView({
                    model: widget,
                    tagName: 'fieldset'
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
                    versionElem.css('visibility', 'hidden');
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
                this.widgetFrame.children().css('visibility', 'hidden');
                AppLog.debug('hide' , this.widgetFrame.children());
                var element = this.widgetFrame.children('*[about="'+version.getSubject()+'"]');
                element.css('visibility', 'visible');
                element.detach();
                this.widgetFrame.prepend(element);

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
            }
        });
});
