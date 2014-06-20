define(['logger', 'tracker', 'underscore', 'jquery', 'backbone', 'view/sss/UserView', 'chap-timeline', 'data/timeline/TimelineData', 'voc'], 
    function(Logger, tracker, _, $, Backbone, UserView, Timeline, TimelineData, Voc){
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
            this.timeAttr = this.model.get(Voc.timeAttr);
            if( this.timeAttr.isEntity ) this.timeAttr = this.timeAttr.getSubject();
            this.groupBy = this.options.groupBy;
            this.user = this.model.get(Voc.belongsToUser);

            if (!this.options.timeline) {
                throw Error("no timeline configuration provided");
            }

            this.model.on('change:' + this.model.vie.namespaces.uri(Voc.start), this.rearrangeVisibleArea, this);
            // TODO: resolve this hack: only fire on start change to avoid double execution
            this.model.on('change:' + this.model.vie.namespaces.uri(Voc.hasEntity), this.changeEntitySet, this);

            this.LOG.debug('TimelineView initialized');

            
        },
        changeEntitySet: function(model, set, options) {
            this.LOG.debug('changeEntitySet', set);  
            set = set || [];
            if( !_.isArray(set)) set = [set];
            var previous = Backbone.Model.prototype.previous.call(this.model, 
                this.model.vie.namespaces.uri(Voc.hasEntity)) || [];
            if( !_.isArray(previous)) previous = [previous];
            this.LOG.debug('previous', previous);  
            var that = this;
            var added = _.difference(set, previous);
            this.LOG.debug('added', added);
            _.each(added, function(a){
                a = that.model.vie.entities.get(a);
                that.addEntity(a);
            });
            
            var deleted = _.difference(previous, set);
            _.each(deleted, function(a){
                a = that.model.vie.entities.get(a);
                that.removeEntity(a);
            });
        },
        rearrangeVisibleArea: function(model, collection, options ) {
            this.LOG.debug("rearrangeVisibleArea", options && options.by);
            if (options.by && options.by === this ) return;

            var startTime = new Date(this.model.get(Voc.start)); 
            var endTime = new Date(this.model.get(Voc.end));
            if( !startTime || !endTime )  return;
            this.LOG.debug('startTime', startTime);
            this.LOG.debug('endTime', endTime);
            this.timeline.setVisibleChartRange( startTime, endTime);
        },
        addEntity: function(entity, collection, options) {
            this.LOG.debug('addEntity');
            var entityView = this.addEntityView(entity);
            var time = entity.get(this.timeAttr);
            if( !time ) {
                this.LOG.warn("entity " + entity.getSubject() + " has invalid time");
            }
            var entityEl = entityView.render().$el;
            var data = {
                'start' : new Date(time),
                'content' : entityEl.get(0)
            };
            this.timeline.addItem(data);

            this.listenTo(entity, 'change:' + entity.vie.namespaces.uri(this.timeAttr), this.changeEntity);
            return true;
            
        },
        changeEntity: function(entity, options ) {
            this.LOG.debug("coll changeEntity");
            var id = this.getEntityViewIndex(entity);
            this.timeline.changeItem(id, {
                'start': new Date(entity.get(this.timeAttr)),
                'content' : this.entityViews[id].$el.get(0)
            });
        },
        removeEntity: function(entity, collection, options) {
            var id = this.getEntityViewIndex(entity);
            if( id !== undefined ) { // if view was already deleted
                this.timeline.deleteItem(id);
                this.entityViews.splice(id, 1);
            }
        },
        render: function() {
            if( this.timeline ) {
                this.timeline.redraw();
                return this;
            }

            this.$el.empty();

            this.renderUser();
            this.renderTimeline();

            var view = this;
            // add entities which are already contained
            var entities = this.model.get(Voc.hasEntity) || [];
            if( !_.isArray(entities)) entities = [entities];
            _.each(entities, function(entity) {
                view.addEntity(entity);
            });
            return this;
        },
        renderUser: function () {
            if( this.user && this.user.isEntity) {
                var par = $('<div class="user-container">');
                this.userDOM = $('<div class="user">');
                par.append(this.userDOM);
                this.$el.append(par);

                // Instantiate User View
                this.userView = new UserView({
                    model:this.user,
                    el: this.userDOM
                });
                this.userView.render();
            }

            this.LOG.debug('this.user of timeline', this.user.getSubject());

        },
        renderTimeline: function() {
            // Instantiate our timeline object.
            this.timelineDOM = document.createElement('div');
            this.timelineDOM.setAttribute('class', 'timeline');
            this.$el.append(this.timelineDOM);
            this.timeline = new Timeline(this.timelineDOM);
            this.timeline.draw( [{
                    'start' : new Date(), // add a dummy event to force rendering
                    'content' : "x"
                }], _.extend(this.options.timeline, {
                'start' : this.model.get(Voc.start),
                'end' : this.model.get(Voc.end),
                'min' : new Date('2013-01-01'),
                'max' : new Date('2015-01-01'),
                'zoomMin' : 300000, // 5 minute
                'zoomMax' : 4320000000 // 5 days
            }));
            this.timeline.deleteItem(0); // remove dummy node
            this.LOG.debug('timeline', this.timeline);

            var view = this;
            // bind timeline's internal events to model
            links.events.addListener(this.timeline, 'rangechanged', function(range){
                view.LOG.debug('caught rangechanged: '+ range.start + ' - ' + range.end);
                tracker.info(tracker.CHANGETIMELINERANGE, tracker.NULL, range);
                var vals = {};
                vals[Voc.start] = range.start;
                vals[Voc.end] = range.end;
                view.model.save(vals, { 'by' : view });
            });
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
        },
        browseTo: function(entity) {
            this.LOG.debug("browseTo called with entity", entity);
            var diff = this.model.get(Voc.end) - this.model.get(Voc.start),
                vals = {},
                start = new Date(entity.get(Voc.creationTime) - diff / 2),
                end = new Date(entity.get(Voc.creationTime) + diff / 2);

            vals[Voc.start] = start;
            vals[Voc.end] = end;
            this.model.save(vals, { 'by' : this });
            this.timeline.setVisibleChartRange(start, end, true);
        }

    });
});
