define(['vie', 'logger', 'tracker', 'underscore', 'model/timeline/TimelineModel' ], function(VIE, Logger, tracker, _, TimelineModel){
    return VIE.prototype.Entity.extend({
        LOG : Logger.get('TimelineModel'),
        initialize: function(attributes, options ) {
            this.LOG.debug("initialize TL.MOdel");
            if( !options) options = {};
            this.LOG.debug("options",options);
            this.LOG.debug("attributes",attributes);
            // kind of super constructor:
            VIE.prototype.Entity.prototype.initialize.call(this, attributes, options );
            this.timelineCollection = options.timelineCollection || 
                new this.vie.Collection([], {
                    'vie':this.vie,
                    'predicate': this.get('predicate') 
                });
            this.LOG.debug("this.timelineCollection",this.timelineCollection);
            if( !this.timelineCollection.predicate )
                throw Error("timelineCollection has no predicate, ie. the type of entities to render");


        },
        fetchRange: function( start, end ) {
            this.LOG.debug("fetchRange:" + start + ";" + end);
            if( !start ) start = new Date(this.get('start')); 
            if( !end ) end = new Date(this.get('end')); 
            var range = end - start;
            // Fetch entities currently visible
            var forUser = this.get('user');
            if( forUser.isEntity ) forUser = forUser.getSubject();
            this.timelineCollection.fetch({'data': {
              'start' : start - range,
              'end' : end -0 + range,
              'forUser' : forUser
            }, 'remove' : false});
        },
        clone: function(attributes) {
            var newAttr = _.clone(this.attributes);
            newAttr = _.extend(newAttr, attributes);
            delete newAttr['@subject'];
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

    });
});
