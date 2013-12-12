define(['logger', 'types', 'underscore' ], function(Logger, Types, _){
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
            if( this.vie.namespaces.curie(model.get('type').id) === Types.TIMELINE ) {
                this.fetchRange(model);
            }
        },
        fetchRange: function( timeline, start, end ) {
            this.LOG.debug("fetchRange:" + start + ";" + end);
            if( !start ) start = new Date(timeline.get(Types.start)); 
            if( !end ) end = new Date(timeline.get(Types.end)); 
            var range = end - start;
            // Fetch entities currently visible
            var forUser = timeline.get(Types.belongsToUser);
            if( forUser.isEntity ) forUser = forUser.getSubject();
            this.timelineCollection.fetch({'data': {
              'start' : start - range,
              'end' : end -0 + range,
              'forUser' : forUser
            }, 'remove' : false});
            this.vie.load({
                'type' : Types.TIMELINE,

            }).from('sss').execute().success(
                function(circles) {
                    this.vie.entities.addOrUpdate(circles);
                }
            );
        },
        clone: function(attributes) {
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
                    
        }

    };
    return TimelineModel;
});
