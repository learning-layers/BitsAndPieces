define(['logger', 'tracker', 'backbone', 'jquery', 'voc','userParams',
        'model/timeline/TimelineModel', 
        'model/organize/OrganizeModel',
        'model/episode/UserModel',
        'model/episode/EpisodeModel',
        'model/episode/VersionModel',
        'view/WidgetView',
        'view/episode/EpisodeManagerView'], 
    function(Logger, tracker, Backbone, $, Voc, userParams, TimelineModel, OrganizeModel, UserModel, EpisodeModel, VersionModel,WidgetView, EpisodeManagerView){
        AppLog = Logger.get('App');
        return Backbone.View.extend({
            initialize: function() {
                this.vie = this.options.vie;

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
                if( this.vie.namespaces.curie(model.get('@type').id) === Voc.VERSION ) {
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

                    // TODO: DataIntegrator shall update hasWidget list of a version X when a widget with belongsToVersion set to version X is added

                    if(!model.isNew()) {
                        this.fetchWidgets(model);
                    } else  {
                        var ws = model.get(Voc.hasWidget)||[];
                        if( !_.isArray(ws) ) ws = [ws];
                        if ( ws.length < 2 ){
                            this.fillupWidgets(ws, model);
                        }
                    }

                    var currentVersion = this.model.get(Voc.currentVersion);

                    // if there is not currentVersion set, take the first one getting into this filter function
                    if( !currentVersion ) {
                        this.model.save(Voc.currentVersion, version.getSubject());
                    // if the version matches the currentVersion, show it
                    } else if( version === currentVersion ) {
                        AppLog.debug('version matches currentVersion');
                        this.episodeMgrView.render();
                        this.show(version);
                    }
                }
            },
            /**
             * Fetches widget entities from server.
             * If no such entities exist, default Timeline and/or Organize are created.
             */
            fetchWidgets: function(version) {
                var vie = this.vie;
                var AppView = this;
                this.vie.load({
                    'version' : version.getSubject(),
                    'type' : Voc.WIDGET
                }).from('sss').execute().success(
                    function(widgets) {
                        AppLog.debug("success of fetching widgets", widgets.length);
                        if( widgets.length < 2 ) 
                            AppView.fillupWidgets(widgets, version);

                        var ws = _.map(widgets, function(w){
                            return w.getSubject();
                        });
                        AppLog.debug('ws', ws);
                        vie.entities.addOrUpdate(widgets);
                        version.set(Voc.hasWidget, ws);
                    }
                );
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
            /**
             * Fills up widget space with missing widgets.
             */
            fillupWidgets: function(widgets, version) {
                var types = widgets.map(function(w){
                    var type = w.get('@type');
                    return type.id ? type.id : type;
                });
                AppLog.debug('types', types);

                var newWidget;
                if( !_.contains(types, this.vie.namespaces.uri('sss:Organize'))) {
                    AppLog.debug("creating default organize widget");
                    newWidget = new this.vie.Entity;
                    newWidget.set('@type', this.vie.namespaces.uri('sss:Organize'));
                    newWidget.set(Voc.circleType, this.vie.namespaces.uri('sss:Circle'));
                    newWidget.set(Voc.orgaEntityType, this.vie.namespaces.uri('sss:OrgaEntity'));

                    VersionModel.createWidget(newWidget, version);
                    widgets.push(newWidget);
                }
                if( !_.contains(types, this.vie.namespaces.uri('sss:Timeline'))) {
                    AppLog.debug("creating default timeline widget");
                    newWidget = new this.vie.Entity;
                    newWidget.set('@type', this.vie.namespaces.uri('sss:Timeline'));
                    newWidget.set(Voc.belongsToUser, userParams.user);
                    newWidget.set('timeAttr', Voc.timestamp);
                    newWidget.set('predicate', this.vie.namespaces.uri('sss:userEvent'));
                        //'timelineCollection' : new vie.Collection([], {//new TL.Collection([], { 
                            //'model': Entity,
                            //'vie' : vie
                            //})},
                    newWidget.set('start', jSGlobals.getTime() - jSGlobals.dayInMilliSeconds);
                    newWidget.set('end', jSGlobals.getTime() + 3600000 );
                    VersionModel.createWidget(newWidget, version);
                    widgets.push(newWidget);
                }
            }
        });
});
