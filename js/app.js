define(['vie', 'logger', 'tracker', 'userParams', 'service/SocialSemanticService', 'extender', 
        'model/episode/UserModel', 
        'model/timeline/TimelineModel', 
        'model/organize/OrganizeModel',
        'view/episode/EpisodeManagerView', 
        'view/timeline/TimelineView', 
        'view/organize/OrganizeView', 
        'view/sss/EntityView', 
        'view/sss/UserEventView' ], 
function(VIE, Logger, tracker, userParams, SocialSemanticService, extender,
        UserModel, TimelineModel, OrganizeModel, 
        EpisodeManagerView, TimelineView, OrganizeView, EntityView, UserEventView){
    VIE.Util.useRealUri = true;
    Logger.useDefaults();
    var AppLog = Logger.get('App');
    var AddLog = Logger.get('Add');
    Logger.get('UserModel').setLevel(Logger.OFF);
    Logger.get('OrganizeModel').setLevel(Logger.OFF);
    Logger.get('VersionModel').setLevel(Logger.OFF);
    Logger.get('EpisodeModel').setLevel(Logger.OFF);
    Logger.get('TimelineModel').setLevel(Logger.OFF);
    Logger.get('TimelineView').setLevel(Logger.OFF);
    Logger.get('OrganizeView').setLevel(Logger.DEBUG);
    Logger.get('DetailView').setLevel(Logger.OFF);
    Logger.get('EpisodeManagerView').setLevel(Logger.OFF);
    Logger.get('EpisodeView').setLevel(Logger.OFF);
    Logger.get('EntityView').setLevel(Logger.OFF);
    Logger.get('OrgaEntityView').setLevel(Logger.OFF);
    Logger.get('UserEventView').setLevel(Logger.OFF);
    Logger.get('UserView').setLevel(Logger.OFF);
    Logger.get('App').setLevel(Logger.OFF);
    Logger.get('Add').setLevel(Logger.OFF);
    Logger.get('SocialSemanticService').setLevel(Logger.OFF);
    Logger.get('Mockup').setLevel(Logger.OFF);

    var v = new VIE();

    var timelineView;
    var organizeView;

    var username = window.location.search.substring(1);
    if( !username) return alert('no username given!');

    var namespace = "http://eval.bp/" ;
    userParams.init(username, namespace);

    var sss = new SocialSemanticService(_.extend({
        'namespaces': {
            'sss': namespace
        }
    }, userParams));
    v.namespaces.base(namespace);
    v.use(sss, 'sss');

    extender.syncByVIE(v);
    extender.autoResolveReferences(v);

    var user = new UserModel({
        '@subject':userParams.user,
    });

    v.entities.addOrUpdate(user);

    var redraw = function(model, collection, options ) {
        var type = model.get('@type');
        AppLog.debug("redraw");

        if( type.id == v.namespaces.uri('sss:Organize')) {
            AppLog.debug('got Model', model.cid);
            //model = new ORGANIZE.OrganizeModel(model);
            AppLog.debug("adding OrganizeView");
            // --- ADD THE ORGANIZE VIEW --- //
            if( organizeView ) {
                organizeView.remove();
            }

            $('fieldset#organize').append('<div id="myOrganize1" tabindex="1" style="width:100%; height:100%"></div>'); 

            organizeView = new OrganizeView({
                model: model,
                EntityView: EntityView,
                el: '#myOrganize1'
            });
            organizeView.render();
            model.fetchStuff();

            organizeView.$el.droppable({
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
                    organizeView.model.createEntity(entity);
                }
            });

        } else if (type.id == v.namespaces.uri('sss:Timeline')){
            AppLog.debug("adding TimelineView");
            //model = new TL.TimelineModel(model);
            if( timelineView )
                timelineView.remove();
            $('fieldset#timeline').append('<div id="myTimeline1"></div>');

            // --- ADD THE TIMELINE VIEW --- //
            timelineView = new TimelineView({
                model : model,
                EntityView: UserEventView,
                //GroupByEntityView: SSS.UserView,
                el: "#myTimeline1",
                //groupBy: v.namespaces.uri('sss:user'),
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

    };

    currentVersion = null;
    var draw = function(version) {
        if( !version || version === currentVersion ) return;
        if( currentVersion) {
            currentVersion.widgetCollection.off('add');
            currentVersion.off('somethingChanged');
        }
        if( !version.isVersion ) return; // not a version
        currentVersion = version;
        // create new version on change
        version.once('somethingChanged', function(model, collection, options ){
            AppLog.debug('somethingChanged', model, collection, options);
            
        });
        AppLog.debug('drawing ', currentVersion.getSubject());
        version.widgetCollection.each(function(widget){
            AppLog.debug("preparing widgets from collection");
            redraw(widget, version.widgetCollection );
        });
        AppLog.error('setting add event handler');

        // THAT's A HACK! don't fetch widgets again when already there:
        if( version.widgetCollection.length > 0 ) return;

        version.widgetCollection.on('add', function(model, collection, options) {
            if( collection && version.widgetCollection !== collection ) return;
            AppLog.debug("adding a widget to collection, length =", model, JSON.stringify(model),collection.length);
            redraw(model, collection, options) ;
        });

        // set up widgetsCollection
        version.fetchWidgets({'success' : function(collection, response, options ) {

            AppLog.debug("success of fetching widgets", collection);
            var types = collection.pluck('@type');
            types = types.map(function(type){return type.id? type.id: type});
            AppLog.debug('types', types);
            if( !_.contains(types, v.namespaces.uri('sss:Organize'))) {
                AppLog.debug("creating default organize widget");
                version.createWidget(new OrganizeModel({
                    '@type' : v.namespaces.uri('sss:Organize'),
                    'circleType' : v.namespaces.uri('sss:Circle'),
                    'entityType' : v.namespaces.uri('sss:OrgaEntity')
                }));
            }
            if( !_.contains(types, v.namespaces.uri('sss:Timeline'))) {
                AppLog.debug("creating default timeline widget");
                version.createWidget(new TimelineModel({
                    '@type' : v.namespaces.uri('sss:Timeline'),
                    'user' : user.getSubject(),
                    'timeAttr': v.namespaces.uri('sss:timestamp'),
                    'predicate' : v.namespaces.uri('sss:userEvent'),
                    //'timelineCollection' : new v.Collection([], {//new TL.Collection([], { 
                        //'model': Entity,
                        //'vie' : v
                        //})},
                    'start': jSGlobals.getTime() - jSGlobals.dayInMilliSeconds,
                    'end': jSGlobals.getTime() + 3600000 
                }));
            }
        }});
    }

    // manages switching between versions
    user.on('change:' + v.namespaces.uri('sss:currentVersion'), function(model, value, options) {
        // catch change:currentVersion event and trigger redraw of organize and timeline
        // probably make organize unclickable
        AppLog.debug("app changeCurrentVersion ", model, value);
        var prev = model.previous('currentVersion');
        if( prev ) {
            AppLog.debug("prev =" +prev);
            prev = v.entities.get(prev);
            prev.widgetCollection.off('add', redraw);
        }
        var version = v.entities.get(value);

        if( version && version.isEntity ) {
            draw(version);
        }

    });

    user.episodeCollection.on('addVersion', function(version, versionCollection, versionOptions ){
        AppLog.debug("version added", JSON.stringify(version));
        if( !user.get('currentVersion')) {
            user.save('currentVersion', version.getSubject());
            user.trigger('change:' + user.vie.namespaces.uri('sss:currentVersion'), version, version.getSubject());
            draw(version);
        } else if( version === user.get('currentVersion')) {
            AppLog.debug('version and currentVersion equals');
            draw(version);
            user.trigger('change:' + user.vie.namespaces.uri('sss:currentVersion'), version, version.getSubject());
        }
    });

    $(document).ready(function(){
        episodeMgr = new EpisodeManagerView({
            model: user,
            el: '#myEpisodes1'
        });

        user.fetch({'success' : function(model, response, options) {
            model.fetchEpisodes(); //model === user
        }});
    });

});
