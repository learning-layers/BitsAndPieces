define(['logger', 'voc', 'underscore', 'data/Data', 'data/episode/UserData' ], function(Logger, Voc, _, Data, UserData){
    var m = Object.create(Data);
    m.init = function(vie) {
        this.LOG.debug("initialize TimelineData");
        this.vie = vie;
        this.vie.entities.on('add', this.filter, this);
        this.setIntegrityCheck(Voc.belongsToVersion, Voc.VERSION, Voc.hasWidget);
        this.setIntegrityCheck(Voc.belongsToUser, Voc.USER);
    };
    m.LOG = Logger.get('TimelineData');
    /** 
     * Filters entities from added entities to vie.entities
     */
    m.filter= function(model, collection, options) {
        if(model.isof(Voc.TIMELINE)){
            this.checkIntegrity(model, options);
            var user = model.get(Voc.belongsToUser);
            if( !model.isNew()) {
                UserData.fetchRange(user, model.get(Voc.start), model.get(Voc.end));
            }
            // TODO resolve this hack: only fire on start change to avoid double execution
            model.on('change:' + this.vie.namespaces.uri(Voc.start),
                function(model, value, options){
                    UserData.fetchRange(user, value, model.get(Voc.end));
                }
            );
        }
    };
    m.copy= function(timeline, overrideAttributes) {
        var newAttr = _.clone(timeline.attributes);
        delete newAttr[timeline.idAttribute];
        newAttr = _.extend(newAttr, overrideAttributes || {});
        var newTimeline = new this.vie.Entity(newAttr);
        this.vie.entities.addOrUpdate(newTimeline);
        newTimeline.save();
        return newTimeline;
    };
    return m;

});
