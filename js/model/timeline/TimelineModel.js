define(['logger', 'voc', 'underscore' ], function(Logger, Voc, _){
    var TimelineModel = function(vie) {
        this.LOG.debug("initialize TimelineModel");
        this.vie = vie;
        this.vie.entities.on('add', this.filter);
    };
    TimelineModel.prototype = {
        LOG : Logger.get('TimelineModel'),
        /** 
         * Filters entities from added entities to vie.entities
         */
        filter: function(model, collection, options) {
            if( this.vie.namespaces.curie(model.get('type').id) === Voc.TIMELINE ) {
                this.fetchRange(model);
                var tl = this;
                model.on('change:' + this.vie.namespaces.uri(Voc.start) + ' ' + 
                         'change:' + this.vie.namespaces.uri(Voc.end),
                    function(model, value, options){
                        /* TODO performance issue: 
                           this will be triggered twice because on rangechange of 
                           the timeline, start and end are changed at the same time
                           */
                        tl.fetchRange(model);
                    }
                );
            }
        },
        fetchRange: function( timeline, start, end ) {
            this.LOG.debug("fetchRange:" + start + ";" + end);
            if( !start ) start = new Date(timeline.get(Voc.start)); 
            if( !end ) end = new Date(timeline.get(Voc.end)); 
            var range = end - start;
            // Fetch entities currently visible
            var forUser = timeline.get(Voc.belongsToUser);
            if( forUser.isEntity ) forUser = forUser.getSubject();
            this.vie.load({
                'type' : timeline.get('predicate'), //TODO check that property
                'start' : start - range,
                'end' : end -0 + range,
                'forUser' : forUser
            }).from('sss').execute().success(
                function(entities) {
                    this.vie.entities.addOrUpdate(entities);
                }
            );
        },
        clone: function(attributes) {
            //TODO to be done in vie.Entity
            //
            return;
            /*
            var newAttr = _.clone(this.attributes);
            newAttr = _.extend(newAttr, attributes);
            delete newAttr['@subject'];
            var TimelineModel = require('./TimelineModel');
            var newTimeline = new TimelineModel(newAttr);
            newTimeline.timelineCollection = 
                new this.vie.Collection([], {
                    'vie':this.vie,
                    'predicate': this.timelineCollection.predicate
                });
            this.timelineCollection.each(function(item){
                newTimeline.timelineCollection.add(item);
            });
            this.LOG.debug('timeline cloned');
            return newTimeline;
             */       
        }

    };
    return TimelineModel;
});
