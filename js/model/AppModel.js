define(['logger', 'voc', 'underscore', 
        'model/episode/UserModel','model/episode/EpisodeModel',
        'model/episode/VersionModel','model/timeline/TimelineModel',
        'model/organize/OrganizeModel' ], 
function(Logger, Voc, _,
    UserModel, EpisodeModel, VersionModel, TimelineModel, OrganizeModel ){
    return {
        LOG : Logger.get('AppModel'),
        init : function(vie) {
            this.vie = vie;
            UserModel.init(this.vie);
            EpisodeModel.init(this.vie);
            VersionModel.init(this.vie);
            TimelineModel.init(this.vie);
            OrganizeModel.init(this.vie);
            this.LOG.debug("initialize AppModel");
            this.vie.entities.on('add', this.filter, this );
        },
        filter: function(model, collection, options ) {
            if( this.vie.namespaces.curie(model.get('@type').id) === Voc.VERSION ) {
                // only initWidgets if hasWidget is defined
                // otherwise it is unknown whether there are widgets for this version 
                if( model.has(Voc.hasWidget) ) {
                    var ws = model.get(Voc.hasWidget)||[];
                    if( !_.isArray(ws) ) ws = [ws];
                    else ws = _.clone(ws);
                    this.initWidgets(model, ws);
                } 

                // it may be that hasWidgets are loaded later
                model.on('change:'+this.vie.namespaces.uri(Voc.hasWidget), 
                    this.initWidgets, this);
            }
        },
        /**
         * Fills up widget collection of a version with missing widgets.
         */
        initWidgets: function(version, widgets, options) {
            if( options && options.by === this ) return;
            var that = this;
            this.LOG.debug('initWidgets', _.clone(widgets));
            var types = _.map(widgets, function(w){
                if( !w.isEntity ) { 
                    var widget = that.vie.entities.get(w); 
                    if( !widget.isEntity ) {
                        widget = new that.vie.Entity;
                        widget.set(widget.idAttribute, w );
                        that.vie.entities.addOrUpdate(widget);
                        widget.fetch();
                        return;
                    }
                    w = widget;
                } 
                var type = w.get('@type');
                return type.id ? type.id : type;
            });
            this.LOG.debug('types', types);

            if( types.length >= 2 ) return;

            var newWidget, newWidgets = [];
            if( !_.contains(types, this.vie.namespaces.uri(Voc.ORGANIZE))) {
                AppLog.debug("creating default organize widget");
                newWidget = new this.vie.Entity;
                newWidget.set('@type', Voc.ORGANIZE);
                newWidget.set(Voc.circleType, Voc.CIRCLE);
                newWidget.set(Voc.orgaEntityType, Voc.ORGAENTITY);

                VersionModel.createWidget(newWidget, version);
                newWidgets.push(newWidget);
            }
            if( !_.contains(types, this.vie.namespaces.uri(Voc.TIMELINE))) {
                AppLog.debug("creating default timeline widget");
                newWidget = new this.vie.Entity;
                newWidget.set('@type', Voc.TIMELINE);
                newWidget.set(Voc.belongsToUser, userParams.user);
                newWidget.set('timeAttr', Voc.timestamp);
                newWidget.set('predicate', Voc.USEREVENT);
                    //'timelineCollection' : new vie.Collection([], {//new TL.Collection([], { 
                        //'model': Entity,
                        //'vie' : vie
                        //})},
                newWidget.set('start', jSGlobals.getTime() - jSGlobals.dayInMilliSeconds);
                newWidget.set('end', jSGlobals.getTime() + 3600000 );
                VersionModel.createWidget(newWidget, version);
                newWidgets.push(newWidget);
            }
            var ws = _.map(newWidgets, function(w){
                return w.getSubject();
            });
            AppLog.debug('filled up widgets', ws);
            vie.entities.addOrUpdate(newWidgets);
            version.set(Voc.hasWidget, ws, {'by': this});
        }

    };
});

