define(['logger', 'tracker', 'underscore', 'jquery', 'backbone', 'view/sss/UserView', 'chap-timeline', 'model/timeline/TimelineModel', 'voc'], 
    function(Logger, tracker, _, $, Backbone, UserView, Timeline, TimelineModel, Voc){
    return Backbone.View.extend({
        LOG: Logger.get('TimelineView'),
        initialize: function() {
            if (!this.model ) {
                throw Error("no timeline model provided");
            }
            this.entityViews = [];
            this.groupByEntityViews = [];
            this.EntityView = this.options.EntityView;
            this.GroupByEntityView = this.options.GroupByEntityView;
            this.timeAttr = this.model.get('timeAttr');
            if( this.timeAttr.isEntity ) this.timeAttr = this.timeAttr.getSubject();
            this.groupBy = this.options.groupBy;
            this.user = this.model.get('user');

            $(this.el).empty();

            if (!this.options.timeline) {
                throw Error("no timeline configuration provided");
            }

            //this.model.timelineCollection.on('add', this.addEntity, this);
            //this.model.timelineCollection.on('change', this.changeEntity, this);
            //this.model.timelineCollection.on('remove', this.removeEntity, this);
            //this.model.timelineCollection.on('reset', this.refreshEntities, this);
            this.model.on('change:' + this.model.vie.namespaces.uri(Voc.start), this.rearrangeVisibleArea, this);
            this.model.on('change:' + this.model.vie.namespaces.uri(Voc.end), this.rearrangeVisibleArea, this);
            this.model.on('change:' + this.model.vie.namespaces.uri(Voc.hasEntity), this.changeEntitySet, this);

            var data = [];

            if( this.user && (typeof this.user) === 'object') {
                var parent = $('<div class="user-container">');
                this.userDOM = $('<div class="user">');
                parent.append(this.userDOM);
                this.$el.append(parent);

                // Instantiate User View
                this.userView = new UserView({
                    model:this.user,
                    el: this.userDOM
                });
                this.userView.render();
            }

            // Instantiate our timeline object.
            this.timelineDOM = document.createElement('div');
            this.timelineDOM.setAttribute('class', 'timeline');
            this.$el.append(this.timelineDOM);
            this.timeline = new Timeline(this.timelineDOM);
            this.timeline.draw( data, _.extend(this.options.timeline, {
                'start' : this.model.get('start'),
                'end' : this.model.get('end'),
                'min' : new Date('2013-01-01'),
                'max' : new Date('2014-01-01'),
                'zoomMin' : 300000, // 5 minute
                'zoomMax' : 4320000000 // 5 days

            }));

            // Make the view aware of existing entities in collection
            var view = this;
            _.each(this.model.get(Voc.hasEntity), function(entity) {
                view.addEntity(entity);
            }, this);
            
            // bind timeline's internal events to model
            links.events.addListener(this.timeline, 'rangechanged', function(range){
                view.LOG.debug('caught rangechanged: '+ range.start + ' - ' + range.end);
                tracker.info(tracker.CHANGETIMELINERANGE, tracker.NULL, range);
                view.model.save({
                    'start' : range.start,
                    'end' : range.end
                }, { 'by' : view });
                //view.fetchRange(range.start,range.end);
            });
            
        },
        changeEntitySet: function(model, set, options) {
            this.LOG.debug('changeEntitySet', set);  
            var current = Backbone.Model.prototype.get.call(this.model, Voc.hasEntity);
            var that = this;
            var added = _.difference(set, current);
            _.each(added, function(a){
                a = that.model.vie.entities.get(a);
                that.addEntity(a);
            });
            
            var deleted = _.difference(current, set);
            _.each(deleted, function(a){
                a = that.model.vie.entities.get(a);
                that.removeEntity(a);
            });
        },
        fetchRange: function(startTime, endTime){
            // Fetch entities currently visible
            TimelineModel.fetchRange( this.model, startTime, endTime );
        },
        rearrangeVisibleArea: function(model, collection, options ) {
            this.LOG.debug("rearrangeVisibleArea");
            if (this.options.by && this.options.by === this ) return;

            var startTime = this.model.get('start'); 
            var endTime = this.model.get('end');
            if( !startTime || !endTime )  return;

            TimelineModel.fetchRange(this.model, startTime, endTime );
            this.timeline.setVisibleChartRange( startTime, endTime);
        },
        addEntity: function(entity, collection, options) {
            var entityView = this.addEntityView(entity);
            var time = entity.get(this.timeAttr);
            if( !time ) this.LOG.warn("entity " + entity.getSubject() + " has invalid time");
            var entityEl = entityView.render().$el;
            var data = {
                'start' : new Date(time),
                'content' : entityEl.get(0)
            };
            if( this.groupBy ) {
                if( this.GroupByEntityView )  {
                    var groupByView = this.addGroupByEntityView(entity.get(this.groupBy));
                    data['group'] = groupByView.render().$el.html();
                } else 
                    data['group'] = entity.get(this.groupBy);
            }
            this.LOG.debug("data['group']", data['group']);
            this.timeline.addItem(data);
            return true;
            
        },
        changeEntity: function(entity, options ) {
            this.LOG.debug("coll changeEntity");
            var id = this.getEntityViewIndex(entity);
            //if( this.datesEqual(
                  //this.timeline.getItem(id), this.entityViews[id].model) ) return;
            this.timeline.changeItem(id, {
                'start': new Date(entity.get(this.timeAttr)),
                'content' : this.entityViews[id].$el.html()
            });
        },
        removeEntity: function(entity, collection, options) {
            var id = this.getEntityViewIndex(entity);
            if( id !== undefined ) { // if view was already deleted
                this.timeline.deleteItem(id);
                this.entityViews.splice(id, 1);
            }
        },
        refreshEntities: function(collection, options) {

        },
        render: function() {
            this.tl.redraw();
        },
        getEntityViewIndex: function (entity) {
            for( var i = 0; i < this.entityViews.length; i++ ) {
                if( this.entityViews[i].model.cid == entity.cid )
                    return i;
            }
            return -1;
        },
        getEntityView: function(entity)  {
            return _.find(this.entityViews, function(entityView){
                return entityView.model.cid == entity.cid;
            });
        },
        getGroupByEntityView: function(entity)  {
            return _.find(this.groupByEntityViews, function(entityView){
                return entityView.model.cid == entity.cid;
            });
        },
        addEntityView: function(entity) {
            var view = this.getEntityView(entity);
            if( view ) return view;

            view = new this.EntityView({ model: entity });
            this.entityViews.push( view );
            return view;
        },
        addGroupByEntityView: function(entity) {
            var view = this.getGroupByEntityView(entity);
            if( view ) return view;

            view = new this.GroupByEntityView({ model: entity });
            this.groupByEntityViews.push( view );
            return view;
        },
        datesEqual: function(item, entity) {
            return new Date(item.start).toUTCString() == 
                new Date(entity.get(this.timeAttr)).toUTCString();
        },
        getSelectedItem: function() {
            return this.timeline.getSelection()[0].row;
        }

    });
});
