define(['logger', 'tracker', 'underscore', 'jquery', 'backbone', 'view/sss/UserView', 'chap-timeline', 'data/timeline/TimelineData', 'view/timeline/ClusterHelper', 'voc'], 
    function(Logger, tracker, _, $, Backbone, UserView, Timeline, TimelineData, EntitiesHelper, Voc){
    return Backbone.View.extend({
        LOG: Logger.get('TimelineView'),
        initialize: function() {
            if (!this.model ) {
                throw Error("no timeline model provided");
            }

            this.timeAttr = this.model.get(Voc.timeAttr);
            if( this.timeAttr.isEntity ) this.timeAttr = this.timeAttr.getSubject();
            this.timeAttr = this.model.vie.namespaces.uri(this.timeAttr);

            this.entitiesHelper = new EntitiesHelper(
                this.timeAttr,
                this.options.EntityView, 
                this.options.ClusterView 
            );

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
            this.entitiesHelper.addEntityView(entity, this.timeAttr);
            this.listenTo(entity, 'change:' + entity.vie.namespaces.uri(this.timeAttr), this.changeEntity);
            return true;
            
        },
        changeEntity: function(entity, options ) {
            this.LOG.debug("coll changeEntity");
            this.entitiesHelper.changeEntityView(entity, this.timeAttr);
        },
        removeEntity: function(entity, collection, options) {
            this.entitiesHelper.removeEntityView(entity, this.timeAttr);
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

            this.entitiesHelper.setTimeline(this.timeline, this.timelineDOM);

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
