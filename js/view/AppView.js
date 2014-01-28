define(['logger', 'tracker', 'backbone', 'jquery', 'voc','userParams',
        'model/timeline/TimelineModel', 
        'model/organize/OrganizeModel',
        'model/episode/UserModel',
        'model/episode/EpisodeModel',
        'model/episode/VersionModel',
        'view/timeline/TimelineView', 
        'view/organize/OrganizeView',
        'view/sss/UserEventView', 
        'view/sss/EntityView', 
        'view/episode/EpisodeManagerView'], 
    function(Logger, tracker, Backbone, $, Voc, userParams, TimelineModel, OrganizeModel, UserModel, EpisodeModel, VersionModel,TimelineView, OrganizeView, UserEventView, EntityView, EpisodeManagerView){
        AppLog = Logger.get('App');
        return Backbone.View.extend({
            currentVersion: null,
            initialize: function() {
                this.vie = this.options.vie;
                this.currentVersion = this.model.get(Voc.currentVersion);

                this.vie.entities.on('add', this.filter, this );
                this.model.on('change:' 
                    + this.vie.namespaces.uri(Voc.currentVersion), 
                    function(model, value, options) {
                        var version = model.get(Voc.currentVersion);
                        if( version.isEntity) this.show(version);
                    }, this);
            },
            filter: function(model, collection, options) {
                if( this.vie.namespaces.curie(model.get('@type').id) === Voc.VERSION ) {
                    var version = model;
                    var AppView = this;
                    AppLog.debug('version added', model);

                    if(!model.isNew()) {
                        this.fetchWidgets(model);
                    }

                    // append listener to the version that its widget are drawn as soon as they are added to the version (or created)
                    version.on('change:' + this.vie.namespaces.uri(Voc.hasWidget), function(model, widgets, options) {

                        AppLog.debug('Version hasWidget changed', widgets);
                        AppView.drawWidgets(widgets);
                        if( model === AppView.currentVersion) {
                            AppView.showWidgets(widgets);
                        }
                    });

                    // if there is not currentVersion set, take the first one getting into this filter function
                    if( !this.currentVersion ) {
                        this.model.save(Voc.currentVersion, version.getSubject());
                        this.currentVersion = version;
                    // if the version matches the currentVersion, show it
                    } else if( version === this.currentVersion ) {
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
            drawWidget: function(widget) {
                AppLog.debug('drawWidget', widget);
                if( !widget.isEntity )
                    widget =  this.vie.entities.get(widget);

                var type = widget.get('@type').id;
                var ctype = this.vie.namespaces.curie(type);

                var widgetBody = $('<fieldset about="'+widget.getSubject()+'"></fieldset>');
                var newWidget, body;
                if( ctype == 'Timeline' ) {
                    widgetBody.append('<legend>Browse</legend>');
                    body = $('<div class="timelineFrame"></div>');
                    widgetBody.append(body);
                    this.widgetFrame.append(widgetBody);
                    this.createTimeline(widget, body);
                } else if (ctype == 'Organize' ) {
                    widgetBody.append('<legend>Organize</legend>');
                    body = $('<div tabindex="1" style="width:100%; height:400px"></div>');                     
                    widgetBody.append(body);
                    this.widgetFrame.append(widgetBody);
                    this.createOrganize(widget, body);
                } else {
                    widget.once('change', this.drawWidget, this );
                }
                if( body ) {
                    widget.on('change:' + widget.idAttribute, function(model, value, options) {
                        AppLog.debug('change subject from', model.cid, 'to', value);
                        widgetBody.attr('about', value);
                    });
                    widgetBody.css('visibility', 'hidden');
                }
            },

            drawWidgets: function(widgets) {
                AppLog.debug('drawWidgets, widgets', widgets);
                var abouts = this.widgetFrame.children().map(function(i, c){
                    return c.getAttribute('about');
                });
                var that = this;
                _.each(widgets, function(widget_uri){
                    if( !_.contains(abouts, widget_uri))
                        that.drawWidget(widget_uri);
                });
            },
            showWidgets: function(widgets) {
                if( !widgets) return;
                var that= this;
                this.widgetFrame.children().css('visibility', 'hidden');
                AppLog.debug('hide' , this.widgetFrame.children());
                var selector = "fieldset[about=\"" + widgets.join("\"],fieldset[about=\"") + "\"]";
                AppLog.debug('selector', selector);
                AppLog.debug('fount' , this.widgetFrame.find(selector));
                var elements = this.widgetFrame.find(selector);
                elements.css('visibility', 'visible');
                elements.detach();
                this.widgetFrame.prepend(elements);
            },
            draw: function(version) {
                AppLog.debug('drawing ', version.getSubject());
                var widgets = version.get(Voc.hasWidget);
                if( !widgets ) return;
                widgets = widgets.map(function(w){
                    return w.getSubject();
                });
                this.drawWidgets(widgets);
            },
            show: function(version) {
                AppLog.debug('showing', version.getSubject());
                var widgets = version.get(Voc.hasWidget);
                if( !widgets ) return;
                widgets = widgets.map(function(w){
                    return w.getSubject();
                });
                this.drawWidgets(widgets);
                this.showWidgets(widgets);

            },
            createTimeline: function(widget, timelineBody) {
                AppLog.debug("adding TimelineView");

                // --- ADD THE TIMELINE VIEW --- //
                var timelineView = new TimelineView({
                    model : widget,
                    EntityView: UserEventView,
                    //GroupByEntityView: SSS.UserView,
                    el: timelineBody,
                    //groupBy: this.vie.namespaces.uri('sss:user'),
                    timeline: {
                        'width': '100%',
                        'height': '180px',
                        'editable': false, // disable dragging and editing events
                        'axisOnTop': true,
                        'stackEvents': false,
                        //eventMarginAxis: '20', // minimal margin beteen events and the axis
                        'style': 'box'
                    }
                });
            },
            createOrganize: function(widget, organizeBody) {
                var organizeView = new OrganizeView({
                    model: widget,
                    EntityView: EntityView,
                    el: organizeBody
                });
                organizeView.render();

                var AppView = this;
                organizeBody.droppable({
                    drop: function(event, ui) {
                        var id = ui.helper.attr('about');
                        AppLog.debug("dropped " + id);
                        var offset = $(this).offset();
                        var entity = {//ORGANIZE.Entity({
                            x: ui.offset.left - offset.left,
                            y: ui.offset.top - offset.top,
                            resource: id
                        };
                        tracker.info(tracker.DROPORGANIZEENTITY, id, entity);
                        OrganizeModel.createEntity(widget, entity);
                    }
                });
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
