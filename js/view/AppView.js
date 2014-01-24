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
                this.currentVersion = this.model.get('currentVersion');

                this.vie.entities.on('add', this.filter, this );
            },
            filter: function(model, collection, options) {
                if( this.vie.namespaces.curie(model.get('@type').id) === Voc.VERSION ) {
                    var version = model;
                    var AppView = this;
                    AppLog.debug('version added', model);
                    this.fetchWidgets(model);
                    // append listener to the version that its widget are drawn as soon as they are added to the version (or created)
                    version.on('change:' + this.vie.namespaces.uri(Voc.hasWidget), function(model, widgets, options) {

                        AppLog.debug('Version hasWidget changed', widgets);
                        AppView.drawWidgets(widgets);
                    });
                    var currentVersion = this.model.get('currentVersion');
                    // if there is not currentVersion set, take the first one getting into this filter function
                    if( !currentVersion ) {
                        this.model.save('currentVersion', version.getSubject());
                    // if the version matches the currentVersion, draw it
                    } else if( version === this.model.get('currentVersion') ) {
                        AppLog.debug('version matches currentVersion');
                        this.draw(version);
                    }
                }
            },
            /**
             * Fetches widget entities from server.
             * If no such entities exist, default Timeline and Organize are created.
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
                        version.set(Voc.hasWidgets, ws);
                        vie.entities.addOrUpdate(widgets);
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
                if( !widget.isEntity )
                    widget =  this.vie.entities.get(widget);

                var type = widget.get('@type').id;
                var ctype = this.vie.namespaces.curie(type);

                if( ctype == 'Timeline' ) {
                    this.widgetFrame.prepend(this.createTimeline(widget));
                } else if (ctype == 'Organize' ) {
                    this.widgetFrame.append(this.createOrganize(widget));
                } else {
                    widget.once('change', this.drawWidget );
                }
            },

            drawWidgets: function(widgets) {
                var children = this.widgetFrame.children();
                var toDraw = _.clone(widgets);
                children.each(function(index, element) {
                    element = $(element);
                    if( _.contains(widgets, element.attr('about')) ) {
                        if( element.is(':hidden') ) element.show(); /* show widget if it already exists in the dom */
                        toDraw = _.without(toDraw, element.attr('about')); /* remove widget from the list of those to be drawn */
                    } else {
                        if( !element.is(':hidden') ) element.hide(); /* hide widget if it is visible and not in the list of changed ones */
                    }
                });
                _.each(toDraw, this.drawWidget, this);
            },

            draw: function(version) {
                AppLog.debug('drawing ', version.getSubject());
                this.drawWidgets(version.get(Voc.hasWidget));

            },
            createTimeline: function(widget) {
                AppLog.debug("adding TimelineView");
                var timelineBody = $('<div id="myTimeline1"></div>');

                // --- ADD THE TIMELINE VIEW --- //
                var timelineView = new TimelineView({
                    model : widget,
                    EntityView: UserEventView,
                    //GroupByEntityView: SSS.UserView,
                    el: timelineBody,
                    //groupBy: this.vie.namespaces.uri('sss:user'),
                    timeline: {
                        'width': '100%',
                        //'height': '300px',
                        'height': '100%',
                        'editable': false, // disable dragging and editing events
                        'axisOnTop': true,
                        'stackEvents': false,
                        //eventMarginAxis: '20', // minimal margin beteen events and the axis
                        'style': 'box'
                    }
                });
                var widgetBody = $('<fieldset about="'+widget.getSubject()+'">'+
                            '<legend>Browse</legend>'+
                         '</fieldset>');
                widgetBody.append(timelineBody);
                return widgetBody;
            },
            createOrganize: function(widget) {
                var organizeBody = $('<div tabindex="1" style="width:100%; height:100%"></div>'); 
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
                var widgetBody = $('<fieldset style="height:400px" about="'+widget.getSubject()+'">'+
                            '<legend>Organize</legend>'+
                         '</fieldset>');
                widgetBody.append(organizeBody);
                return widgetBody;
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
