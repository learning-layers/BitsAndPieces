define(['logger', 'voc', 'underscore', 'data/Data' ], function(Logger, Voc, _, Data){
    var m = Object.create(Data);
    m.init = function(vie) {
        this.LOG.debug("initialize TimelineData");
        this.vie = vie;
        this.vie.entities.on('add', this.filter, this);
        this.setIntegrityCheck(Voc.belongsToVersion, Voc.VERSION, Voc.hasWidget);
        this.setIntegrityCheck(Voc.belongsToUser, Voc.USER);
        this.setIntegrityCheck(Voc.hasEntity, Voc.ENTITY);
    };
    m.LOG = Logger.get('TimelineData');
    /** 
     * Filters entities from added entities to vie.entities
     */
    m.filter= function(model, collection, options) {
        if(model.isof(Voc.TIMELINE)){
            this.checkIntegrity(model, options);
            if( !model.isNew()) {
                this.fetchRange(model);
            }
            var tl = this;
            // TODO resolve this hack: only fire on start change to avoid double execution
            model.on('change:' + this.vie.namespaces.uri(Voc.start),
                function(model, value, options){
                    tl.fetchRange(model);
                }
            );
        }
    };
    m.fetchRange= function( timeline, start, end ) {
        if( !start ) start = new Date(timeline.get(Voc.start)); 
        if( !end ) end = new Date(timeline.get(Voc.end)); 
        this.LOG.debug("fetchRange:" + start + ";" + end);
        var range = end - start;
        // Fetch entities currently visible
        var forUser = timeline.get(Voc.belongsToUser);
        if( forUser.isEntity ) forUser = forUser.getSubject();
        var that = this;
        this.vie.load({
            'type' : this.vie.types.get(timeline.get(Voc.predicate)), //TODO check that property
            'start' : start - range,
            'end' : end -0 + range,
            'forUser' : forUser
        }).from('sss').execute().success(
            function(entities) {
                that.LOG.debug('success fetchRange: ', _.clone(entities), 'timeline: ', timeline);
                entities = that.vie.entities.addOrUpdate(entities, {'overrideAttributes': true});
                _.each(entities, function(userEvent){
                    var entity = userEvent.get(Voc.hasResource);
                    entity.set(Voc.belongsToTimeline, timeline.getSubject());
                });
                /*
                var current = timeline.get(Voc.hasEntity) || [];
                if( !_.isArray(current)) current = [current];
                var added = _.difference(entities, current);
                added = added.map(function(e){
                    var resource = e.get(Voc.hasResource);
                    if( !resource.isEntity ) {
                        var newEntity = new that.vie.Entity;
                        newEntity.set(newEntity.idAttribute, resource ); 
                        that.vie.entities.addOrUpdate(newEntity);
                        newEntity.fetch();
                    }
                    return e.getSubject();
                });
                current = current.map(function(c){
                    return c.getSubject();
                });
                current = _.union(current, added);
                that.LOG.debug('current', current);
                timeline.set(Voc.hasEntity, current);
                */
            }
        );
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
