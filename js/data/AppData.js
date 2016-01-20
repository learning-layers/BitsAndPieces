define(['logger', 'voc', 'underscore', 'userParams',
        'data/episode/UserData',
        'data/sss/CategoryData',
        'data/sss/MessageData',
        'data/sss/ActivityData',
        'data/episode/EpisodeData',
        'data/episode/VersionData',
        'data/timeline/TimelineData',
        'data/timeline/UserEventData',
        'data/EntityData',
        'data/organize/OrgaEntityData',
        'data/organize/CircleData',
        'data/organize/OrganizeData' ], 
function(Logger, Voc, _, userParams,
    UserData, 
    CategoryData, 
    MessageData,
    ActivityData,
    EpisodeData, 
    VersionData, 
    TimelineData, 
    UserEventData, 
    EntityData, 
    OrgaEntityData, 
    CircleData, 
    OrganizeData ){
    return {
        LOG : Logger.get('AppData'),
        init : function(vie) {
            this.vie = vie;
            UserData.init(this.vie);
            CategoryData.init(this.vie);
            MessageData.init(this.vie);
            ActivityData.init(this.vie);
            EpisodeData.init(this.vie);
            VersionData.init(this.vie);
            TimelineData.init(this.vie);
            OrganizeData.init(this.vie);
            UserEventData.init(this.vie);
            EntityData.init(this.vie);
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
                var ws = model.get(Voc.hasWidget)||[];
                if( !_.isArray(ws) ) ws = [ws];
                else ws = _.clone(ws);
                this.LOG.debug("widgets = ", ws);
                this.initWidgets(model, ws);
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

            this.vie.entities.addOrUpdate(this.createOrganize(version));
            //this.vie.entities.addOrUpdate(this.createTimeline(version));
        },
        createOrganize : function(version) {
            AppLog.debug("creating default organize widget");
            var newWidget = new this.vie.Entity;
            newWidget.set('@type', Voc.ORGANIZE);
            newWidget.set(Voc.circleType, Voc.CIRCLE);
            newWidget.set(Voc.orgaEntityType, Voc.ORGAENTITY);

            newWidget.set(Voc.belongsToVersion, version.getSubject());
            return newWidget;
        },
        createTimeline : function(user) {
            AppLog.debug("creating default timeline widget");
            var newWidget = new this.vie.Entity;
            newWidget.set('@type', Voc.TIMELINE);
            newWidget.set(Voc.belongsToUser, user.getSubject());
            newWidget.set(Voc.timeAttr, Voc.creationTime);
            newWidget.set(Voc.predicate, Voc.USEREVENT);
            //newWidget.set(Voc.belongsToVersion, version.getSubject());
            return newWidget;
        }

    };
});

