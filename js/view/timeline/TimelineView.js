define(['logger', 'tracker', 'underscore', 'jquery', 'backbone', 'view/sss/UserView', 'chap-timeline', 'data/timeline/TimelineData', 'view/timeline/ClusterHelper', 'voc'], 
    function(Logger, tracker, _, $, Backbone, UserView, Timeline, TimelineData, EntitiesHelper, Voc){
    return Backbone.View.extend({
        LOG: Logger.get('TimelineView'),
        waitingForLastOne : 0,
        events: {
            'bnp:zoomCluster' : 'expand',
            'bnp:expanded' : 'redraw',
            'bnp:unexpanded' : 'redraw'
        },
        initialize: function() {
            var that = this;
            if (!this.model ) {
                throw Error("no timeline model provided");
            }

            this.timeAttr = this.model.get(Voc.timeAttr);
            if( this.timeAttr.isEntity ) this.timeAttr = this.timeAttr.getSubject();
            this.timeAttr = this.model.vie.namespaces.uri(this.timeAttr);
            this.expandMarginPercent = 10;

            this.entitiesHelper = new EntitiesHelper(
                this.timeAttr,
                this.options.EntityView, 
                this.options.ClusterView 
            );

            this.user = this.model.get(Voc.belongsToUser);
            this.waitingForLastOne = 0;

            if (!this.options.timeline) {
                throw Error("no timeline configuration provided");
            }

            // TODO: resolve this hack: only fire on start change to avoid double execution
            this.model.on('change:' + this.model.vie.namespaces.uri(Voc.start), this.rearrangeVisibleArea, this);
            this.user.on('change:' + this.model.vie.namespaces.uri(Voc.hasUserEvent), this.changeEntitySet, this);

            this.LOG.debug('TimelineView initialized');

            // Deal with window resize
            // Redraw timeline when resize ends or pauses
            var timer;
            $(window).on('resize', function() {
                if ( timer ) {
                    clearTimeout(timer);
                }

                timer = setTimeout(function() {
                    that.LOG.debug('Resize timeout called');
                    timer = null;
                    that.redraw();
                }, 500);
            });
        },
        changeEntitySet: function(model, set, options) {
            this.LOG.debug('changeEntitySet', set);  
            set = set || [];
            if( !_.isArray(set)) set = [set];
            var previous = Backbone.Model.prototype.previous.call(this.user, 
                this.model.vie.namespaces.uri(Voc.hasUserEvent)) || [];
            if( !_.isArray(previous)) previous = [previous];
            this.LOG.debug('previous', previous);  
            var that = this;
            var added = _.difference(set, previous);
            this.LOG.debug('added', added);
            this.addEntities(added);
            
            var deleted = _.difference(previous, set);
            _.each(deleted, function(a){
                a = that.model.vie.entities.get(a);
                var entity = a.get(Voc.hasResource);
                // TODO don't remove entity if referenced by another user event
                that.removeEntity(entity);
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
            var range = this.timeline.getVisibleChartRange();
            this.timeline.setVisibleChartRange( startTime, endTime);
            this.reclusterByRangeChange( 
                    new Date(range.start), new Date(range.end),
                    startTime, endTime);
        },
        addEntities: function(entities) {
            var that = this;
            var lastOne;
            var initRange = !this.model.get(Voc.start) && !this.model.get(Voc.end);
            this.LOG.debug("initRange", initRange, this.model.get(Voc.start), this.model.get(Voc.end));
            var readyEntities = [];
            _.each(entities, function(ue) {
                if( !ue.isEntity ) ue = that.model.vie.entities.get(ue);
                var entity = ue.get(Voc.hasResource);
                that.addEntity(entity);
                if( !initRange ) return;

                that.waitingForLastOne++;
                if( !entity.get(that.timeAttr) ) {
                    entity.once("change:"+that.timeAttr, that.checkLastOne, that);
                    return;
                }
                readyEntities.push(entity);
                that.LOG.debug('addEntities', entity, that.waitingForLastOne);
            });
            _.each(readyEntities, function(entity) {
                that.checkLastOne(entity);
            });
        },
        checkLastOne: function(entity) {
            this.waitingForLastOne--;
            this.LOG.debug('checkLastOne', entity, this.waitingForLastOne);
            if( !this.lastOne || this.lastOne.get(this.timeAttr) < entity.get(this.timeAttr) ) {
                this.lastOne = entity;
            }
            if( this.waitingForLastOne == 0 ) {
                this.browseTo(this.lastOne);
            }

        },
        addEntity: function(entity, collection, options) {
            if( this.entitiesHelper.contains(entity) ) {
                return false;
            }
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
            var userevents = this.user.get(Voc.hasUserEvent) || [];
            if( !_.isArray(userevents)) userevents = [userevents];
            this.addEntities(userevents);
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
            this.LOG.debug("draw timeline", this.model.get(Voc.start), this.model.get(Voc.end));
            var start = this.model.get(Voc.start);
            var end = this.model.get(Voc.end);
            if( !start ) {
                start = new Date();
                start.setDate(start.getDate() -1 );
            }
            if( !end ) {
                end = new Date();
                end.setDate(end.getDate() +1);
            }
            this.timeline.draw( [{
                    'start' : new Date(), // add a dummy event to force rendering
                    'content' : "x"
                }], _.extend(this.options.timeline, {
                'start' : start,
                'end' : end,
                'min' : new Date('2013-01-01'),
                'max' : new Date('2016-01-01'),
                'zoomMin' : 21600000, // 6 hours
                'zoomMax' : 31556940000 // 1 year
            }));
            this.timeline.deleteItem(0); // remove dummy node
            this.LOG.debug('timeline', this.timeline);

            this.entitiesHelper.setTimeline(this.timeline, this.timelineDOM);

            var view = this;
            // bind timeline's internal events to model
            links.events.addListener(this.timeline, 'rangechanged', function(range){
                view.LOG.debug('caught rangechanged: '+ range.start + ' - ' + range.end);
                //tracker.info(tracker.CHANGETIMELINERANGE, tracker.NULL, range);
                var vals = {};
                vals[Voc.start] = range.start;
                vals[Voc.end] = range.end;
                view.reclusterByRangeChange(
                    new Date(view.model.get(Voc.start)), new Date(view.model.get(Voc.end)), 
                    new Date(range.start), new Date(range.end));

                view.model.save(vals, { 'by' : view, 'calledBy' : 'renderTimeline' });
            });
        },
        reclusterByRangeChange: function(prev_start, prev_end, start, end) {
            var prev_range = prev_end - prev_start;
            var range = end - start;

            if( prev_range != range ) {
                this.entitiesHelper.clusterByRange(start, end);
            }
        },
        datesEqual: function(item, entity) {
            return new Date(item.start).toUTCString() == 
                new Date(entity.get(this.timeAttr)).toUTCString();
        },
        getSelectedItem: function() {
            return this.timeline.getSelection()[0].row;
        },
        browseTo: function(entity) {
            // wait for the time attribute if not set yet
            if( !entity.get(this.timeAttr) ) {
                entity.once('change:' + this.timeAttr, this.browseTo, this);
                return;
            }
            this.LOG.debug("browseTo called with entity", entity, JSON.stringify(entity.attributes));
            var range = this.timeline.getVisibleChartRange();
            var diff = range.end - range.start;
                vals = {},
                start = new Date(parseInt(entity.get(this.timeAttr) - diff / 2)),
                end = new Date(parseInt(entity.get(this.timeAttr) + diff / 2));

            vals[Voc.start] = start;
            vals[Voc.end] = end;
            this.model.save(vals, { 'by' : this, 'calledBy' : 'browseTo' });
            this.LOG.debug("start", parseInt(entity.get(this.timeAttr) - diff / 2), start, "end", parseInt(entity.get(this.timeAttr) + diff / 2), end);
            this.timeline.setVisibleChartRange(start, end, true);
        },
        expand: function(e) {
            this.LOG.debug('clickCluster event', e);
            var entities = e.cluster.get('entities');
            var minmax = this.minmax(entities);
            this.LOG.debug('minamx', minmax);

            var range = minmax['max'] - minmax['min'];
            var start = minmax['min'] - range/this.expandMarginPercent;
            var end = minmax['max'] + range/this.expandMarginPercent;

            var vals = {};
            vals[Voc.start] = new Date(start);
            vals[Voc.end] = new Date(end);

            this.LOG.debug('expand', 'start', vals[Voc.start], 'end', vals[Voc.end]);

            this.timeline.setVisibleChartRange( start, end);
            this.reclusterByRangeChange(
                    new Date(this.model.get(Voc.start)), new Date(this.model.get(Voc.end)),
                    vals[Voc.start], vals[Voc.end]
                );
            this.model.save(vals, { 'by' : this, 'calledBy' : 'expand' });
        },
        minmax: function(entities) {
            var min, max;
            var that = this;
            _.each(entities, function(entity) {
                var time = entity.get(that.timeAttr);
                if( min === undefined || time < min ) min = time;
                if( max === undefined || time > min ) max = time;
            });
            return {
                'min' : min,
                'max' : max
            };
        },
        redraw: function(e) {
            this.LOG.debug('clickCluster', e);
            this.timeline.redraw();
            if ( e && e.clusterView ) {
                if ( e.type === 'bnp:expanded' ) {
                    e.clusterView.$el.parent().parent().css('z-index', '150');
                } else if ( e.type === 'bnp:unexpanded' ) {
                    e.clusterView.$el.parent().parent().css('z-index', '');
                }
            }
        }

    });
});
