define(['logger', 'voc', 'underscore', 'userParams',
        'data/episode/UserData','data/episode/EpisodeData',
        'data/episode/VersionData','data/timeline/TimelineData',
        'data/timeline/UserEventData',
        'data/organize/OrgaEntityData','data/organize/CircleData',
        'data/organize/OrganizeData' ], 
function(Logger, Voc, _, userParams,
    UserData, EpisodeData, VersionData, TimelineData, UserEventData, OrgaEntityData, CircleData, OrganizeData ){
    return {
        LOG : Logger.get('AppData'),
        init : function(vie) {
            this.vie = vie;
            UserData.init(this.vie);
            EpisodeData.init(this.vie);
            VersionData.init(this.vie);
            TimelineData.init(this.vie);
            OrganizeData.init(this.vie);
            UserEventData.init(this.vie);
            OrgaEntityData.init(this.vie);
            CircleData.init(this.vie);
            this.LOG.debug("initialize AppData");
            this.vie.entities.on('add', this.filter, this );
        },
        filter: function(model, collection, options ) {
            if( model.isof(Voc.VERSION) ) {
                // only initWidgets if hasWidget is defined
                // otherwise it is unknown whether there are widgets for this version 
                this.LOG.debug("Version has hasWidget?", model.has(Voc.hasWidget), model.get(Voc.hasWidget));
                if( model.has(Voc.hasWidget) ) {
                    var ws = model.get(Voc.hasWidget)||[];
                    if( !_.isArray(ws) ) ws = [ws];
                    else ws = _.clone(ws);
                    this.LOG.debug("widgets = ", ws);
                    this.initWidgets(model, ws);
                } 

                // it may be that hasWidgets are loaded later
                model.on('change:'+this.vie.namespaces.uri(Voc.hasWidget), 
                    this.initWidgets, this);
            }
        },
        /**
         * Initialize widget collection of a version with missing widgets.
         * Here it will be initialized with a Timeline and an Organize widget.
         */
        initWidgets: function(version, widgets, options) {
            if( options && options.by === this ) return;
            if( !_.isEmpty(widgets) ) return;

            var that = this;
            this.LOG.debug('initWidgets');
            /*
            var types = _.map(widgets, function(w){
                if( !w.isEntity ) { 
                    var widget = that.vie.entities.get(w); 
                    if( !widget.isEntity ) {
                        widget = new that.vie.Entity;
                        widget.set(widget.idAttribute, w );
                        that.vie.entities.addOrUpdate(widget);
                        widget.fetch();
                    }
                    w = widget;
                } 
                var type = w.get('@type');
                return type.id ? type.id : type;
            });
            this.LOG.debug('types', types);
            */

            var newWidget, newWidgets = [];
            //if( !_.contains(types, this.vie.namespaces.uri(Voc.ORGANIZE))) {
                AppLog.debug("creating default organize widget");
                newWidget = new this.vie.Entity;
                newWidget.set('@type', Voc.ORGANIZE);
                newWidget.set(Voc.circleType, Voc.CIRCLE);
                newWidget.set(Voc.orgaEntityType, Voc.ORGAENTITY);

                newWidget.set(Voc.belongsToVersion, version.getSubject());
                newWidget.save();

                newWidgets.push(newWidget);
            //}
            //if( !_.contains(types, this.vie.namespaces.uri(Voc.TIMELINE))) {
                AppLog.debug("creating default timeline widget");
                newWidget = new this.vie.Entity;
                newWidget.set('@type', Voc.TIMELINE);
                newWidget.set(Voc.belongsToUser, userParams.user);
                newWidget.set(Voc.timeAttr, Voc.timestamp);
                newWidget.set(Voc.predicate, Voc.USEREVENT);
                    //'timelineCollection' : new vie.Collection([], {//new TL.Collection([], { 
                        //'model': Entity,
                        //'vie' : vie
                        //})},
                newWidget.set(Voc.start, jSGlobals.getTime() - jSGlobals.dayInMilliSeconds);
                newWidget.set(Voc.end, jSGlobals.getTime() + 3600000 );
                newWidget.set(Voc.belongsToVersion, version.getSubject());
                newWidget.save();
                newWidgets.push(newWidget);
            //}
        
            this.vie.entities.addOrUpdate(newWidgets);
        }

    };
});

