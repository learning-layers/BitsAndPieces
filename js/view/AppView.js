define(['logger', 'tracker', 'backbone', 'jquery',
        'model/timeline/TimelineModel', 
        'model/organize/OrganizeModel',
        'view/timeline/TimelineView', 
        'view/organize/OrganizeView',
        'view/sss/UserEventView', 
        'view/sss/EntityView', 
        'view/episode/EpisodeManagerView'], 
    function(Logger, tracker, Backbone, $, TimelineModel, OrganizeModel, TimelineView, OrganizeView, UserEventView, EntityView, EpisodeManagerView){
        AppLog = Logger.get('App');
        return Backbone.View.extend({
            currentVersion: null,
            initialize: function() {
                this.vie = this.options.vie;
                // manages switching between versions
                this.model.on('change:' + this.vie.namespaces.uri('sss:currentVersion'), function(model, value, options) {
                    // catch change:currentVersion event and trigger redraw of organize and timeline
                    // probably make organize unclickable
                    AppLog.debug("app changeCurrentVersion ", model, value);
                    var prev = model.previous('currentVersion');
                    if( prev ) {
                        AppLog.debug("prev =" +prev);
                        prev = this.vie.entities.get(prev);
                        prev.widgetCollection.off('add', this.redraw);
                    }
                    var version = this.vie.entities.get(value);

                    if( version && version.isEntity ) {
                        this.draw(version);
                    }

                }, this);

                this.model.episodeCollection.on('addVersion', function(version, versionCollection, versionOptions ){
                    AppLog.debug("version added", JSON.stringify(version));
                    if( !this.model.get('currentVersion')) {
                        this.model.save('currentVersion', version.getSubject());
                        this.model.trigger('change:' + this.vie.namespaces.uri('sss:currentVersion'), version, version.getSubject());
                        this.draw(version);
                    } else if( version === this.model.get('currentVersion')) {
                        AppLog.debug('version and currentVersion equals');
                        this.draw(version);
                        this.model.trigger('change:' + this.vie.namespaces.uri('sss:currentVersion'), version, version.getSubject());
                    }
                }, this);
            },
            render: function() {
                this.$el.append(
                    '<div id="myEpisodes1"></div>'+
                    '<fieldset id="timeline">'+
                        '<legend>Browse</legend>'+
                    '</fieldset>'+
                    '<fieldset style="height:400px" id="organize">'+
                        '<legend>Organize</legend>'+
                    '</fieldset>');
                this.episodeMgrView = new EpisodeManagerView({
                    model: this.model,
                    el: '#myEpisodes1'
                });
            },
            redraw: function(model, collection, options ) {
                var type = model.get('@type');
                AppLog.debug("redraw");

                if( type.id == this.vie.namespaces.uri('sss:Organize')) {
                    AppLog.debug('got Model', model.cid);
                    //model = new ORGANIZE.OrganizeModel(model);
                    AppLog.debug("adding OrganizeView");
                    // --- ADD THE ORGANIZE VIEW --- //
                    if( this.organizeView ) {
                        this.organizeView.remove();
                    }

                    $('fieldset#organize').append('<div id="myOrganize1" tabindex="1" style="width:100%; height:100%"></div>'); 

                    this.organizeView = new OrganizeView({
                        model: model,
                        EntityView: EntityView,
                        el: '#myOrganize1'
                    });
                    this.organizeView.render();
                    model.fetchStuff();

                    var AppView = this;
                    this.organizeView.$el.droppable({
                        drop: function(event, ui) {
                            var id = ui.helper.attr('resource');
                            AppLog.debug("dropped " + id);
                            var offset = $(this).offset();
                            var entity = {//ORGANIZE.Entity({
                                x: ui.offset.left - offset.left,
                                y: ui.offset.top - offset.top,
                                resource: id
                            };
                            tracker.info(tracker.DROPORGANIZEENTITY, id, entity);
                            AppView.organizeView.model.createEntity(entity);
                        }
                    });

                } else if (type.id == this.vie.namespaces.uri('sss:Timeline')){
                    AppLog.debug("adding TimelineView");
                    //model = new TL.TimelineModel(model);
                    if( this.timelineView )
                        this.timelineView.remove();
                    $('fieldset#timeline').append('<div id="myTimeline1"></div>');

                    // --- ADD THE TIMELINE VIEW --- //
                    this.timelineView = new TimelineView({
                        model : model,
                        EntityView: UserEventView,
                        //GroupByEntityView: SSS.UserView,
                        el: "#myTimeline1",
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
                    // fetch initial data
                    model.fetchRange();
                    //model.fetchRange(0, new Date().getTime());

                }

            },

            draw: function(version) {
                if( !version || version === this.currentVersion ) return;
                if( this.currentVersion) {
                    this.currentVersion.widgetCollection.off('add');
                    this.currentVersion.off('somethingChanged');
                }
                if( !version.isVersion ) return; // not a version
                this.currentVersion = version;
                // create new version on change
                version.once('somethingChanged', function(model, collection, options ){
                    AppLog.debug('somethingChanged', model, collection, options); 
                });
                AppLog.debug('drawing ', this.currentVersion.getSubject());
                version.widgetCollection.each(function(widget){
                    AppLog.debug("preparing widgets from collection");
                    this.redraw(widget, version.widgetCollection );
                }, this);
                AppLog.error('setting add event handler');

                // THAT's A HACK! don't fetch widgets again when already there:
                if( version.widgetCollection.length > 0 ) return;

                version.widgetCollection.on('add', function(model, collection, options) {
                    if( collection && version.widgetCollection !== collection ) return;
                    AppLog.debug("adding a widget to collection, length =", model, JSON.stringify(model),collection.length);
                    this.redraw(model, collection, options) ;
                }, this);

                // set up widgetsCollection
                var AppView = this;
                version.fetchWidgets({'success' : function(collection, response, options ) {

                    AppLog.debug("success of fetching widgets", collection);
                    var types = collection.pluck('@type');
                    types = types.map(function(type){return type.id? type.id: type;});
                    AppLog.debug('types', types);
                    if( !_.contains(types, AppView.vie.namespaces.uri('sss:Organize'))) {
                        AppLog.debug("creating default organize widget");
                        version.createWidget(new OrganizeModel({
                            '@type' : AppView.vie.namespaces.uri('sss:Organize'),
                            'circleType' : AppView.vie.namespaces.uri('sss:Circle'),
                            'entityType' : AppView.vie.namespaces.uri('sss:OrgaEntity')
                        }));
                    }
                    if( !_.contains(types, AppView.vie.namespaces.uri('sss:Timeline'))) {
                        AppLog.debug("creating default timeline widget");
                        version.createWidget(new TimelineModel({
                            '@type' : AppView.vie.namespaces.uri('sss:Timeline'),
                            'user' : AppView.model.getSubject(),
                            'timeAttr': AppView.vie.namespaces.uri('sss:timestamp'),
                            'predicate' : AppView.vie.namespaces.uri('sss:userEvent'),
                            //'timelineCollection' : new AppView.vie.Collection([], {//new TL.Collection([], { 
                                //'model': Entity,
                                //'vie' : AppView.vie
                                //})},
                            'start': jSGlobals.getTime() - jSGlobals.dayInMilliSeconds,
                            'end': jSGlobals.getTime() + 3600000 
                        }));
                    }
                }});
            }
        });
});
