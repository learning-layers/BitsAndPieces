define(['underscore', 'backbone', 'view/timeline/EntitiesHelper'],
function(_, Backbone, EntitiesHelper){
    function ClusterHelper(timeAttr, viewType, clusterViewType) {
        EntitiesHelper.call(this, timeAttr, viewType);
        this.ClusterView = clusterViewType;
        this.LOG.debug('timeAttr', this.timeAttr);
        this.sortedEntities = new Backbone.Collection([], {
            'comparator' : this.timeAttr
        });
        this.clusters = {};
        this.LOG.debug('ClusterHelper init', this);
    };
    ClusterHelper.prototype = Object.create(EntitiesHelper.prototype);//new EntitiesHelper;
    _.extend(ClusterHelper.prototype, {
        addEntityView: function(entity) {
            // entity already displayed?
            if( this.getEntityView(entity) ) return;
            
            this.LOG.debug('addEntityView', entity);
            this.sortedEntities.add(entity); 

            this.clusterByTime(entity);
        },
        clusterByTime: function(ec) {
            var s = this.sortedEntities.indexOf(ec, true);

            var eacs = [];
            if( s > 0 ) {
                eacs.push(this.sortedEntities.at(s-1));
            }
            eacs.push(ec);
            if( s < this.sortedEntities.size() -1 ) {
                eacs.push(this.sortedEntities.at(s+1));
            }

            this.LOG.debug('clusterByTime, eacs', eacs);
            var new_eacs = this.recluster(eacs);
            this.LOG.debug('clusterByTime, new_eacs', new_eacs);
            var that = this;
            _.each(eacs, function(e) {
                EntitiesHelper.prototype.removeEntityView.call(that, e);
                that.sortedEntities.remove(e);
            });
            _.each(new_eacs, function(e) {
                that.sortedEntities.add(e);
                if( e.isCluster ) {
                    that.addClusterView(e);
                } else {
                    EntitiesHelper.prototype.addEntityView.call(that, e);
                }
            });
        },
        recluster: function(entities) {
            var c = entities[0];
            var result = [];
            var secsPerEntity = this.calcSecsPerEntity();
            for( var i = 0; i < entities.length-1; i++ ) {
                if( this.checkCluster(c, entities[i+1], secsPerEntity) ) {
                    c = this.createCluster([c, entities[i+1]]);
                } else {
                    result.push(c);
                    c = entities[i+1];
                }
            }
            result.push(c);
            this.LOG.debug('recluster', secsPerEntity, result);
            return result;
        },
        getCluster: function(entity) {
            return this.clusters[entity.cid];
        },
        setCluster: function(entity, cluster) {
            this.clusters[entity.cid] = cluster;
        },
        changeEntityView: function(entity) {
            var id = this.getEntityViewIndex(entity);
            if( id === undefined ) return;

            if( !entity.hasChanged(this.timeAttr) ) return;

            this.LOG.debug('changeEntityView', entity);

            this.removeEntityView(entity);
            this.sortedEntities.sort(); 
            this.addEntityView(entity);
        },
        removeEntityView: function(entity) {
            var id = this.getEntityViewIndex(entity);
            if( id === undefined ) return; // if view was already deleted

            var cluster;

            this.LOG.debug('removeEntityView', entity);
            if( cluster = this.getCluster(entity) ) {
                this.setCluster(entity, null);

                var entities = _.without(cluster.get('entities'), entity);
                if( entities.length == 1 ) {
                    entity = entities[0];
                } else {
                    cluster.set('entities', entities);
                    entity = cluster;
                }
                this.clusterByTime(entity);
            } else {
                EntitiesHelper.prototype.removeEntityView.call(this, entity);
            }
        },
        ____getEntityViewIndex: function (entity) {
            for( var i = 0; i < this.entityViews.length; i++ ) {
                if( this.entityViews[i].model && this.entityViews[i].model === entity ||
                    this.entityViews[i].entities && this.entityViews[i].contains(entity))
                    return i;
            }
            return -1;
        },
        ____getEntityView: function(entity)  {
            return _.find(this.entityViews, function(entityView){
                return entityView.model && entityView.model === entity ||
                    entityView.entities && entityView.contains(entity);
            });
        },
        addClusterView: function(cluster) {
            this.sortedEntities.add(cluster);
            var view = new this.ClusterView({
                'model': cluster
            });
            this.entityViews.push(view);
            var data = {
                'start' : new Date(custer.get(this.timeAttr)),
                'content' : view.render().$el.get(0)
            };
            this.LOG.debug('addClusterView', cluster, view, data);
            this.timeline.addItem(data);
            return view;
        },
        createCluster: function(eacs) {
            var entities = this.resolveClusters(eacs);
            var avg_time = new Date(this.getAverageTime(entities));
            var cluster = new Backbone.Model({
                    'entities' : entities,
                });
            _.each(entities, function(e){
                this.setCluster(e, cluster);
            });
            cluster.set(this.timeAttr, avg_time);
            this.LOG.debug('createCluster', cluster);
            cluster.isCluster = true;
            return cluster;
        },
        resolveClusters: function(eacs) {
            var entities = [];
            _.each(eacs, function(ec) {
                if( ec.isCluster ) {
                    _.each(ec.get('entities'), function(e){
                        entities.push(e);
                    });
                } else {
                    entities.push(ec);
                }
            });
            return entities;
        },
        getAverageTime: function(entities) {
            var that = this;
            var times = _.map(entities, function(e){ 
                return new Date(e.get(that.timeAttr)).getTime();
            });
            var sum = 0;
            var d = "";
            for( var t = 0; t < times.length; t ++ ){
                sum += times[t];
                d += times[t] + "+";
            }
            this.LOG.debug("getAverageTime", d, "/", times.length, "=",  sum / times.length );
            return sum / times.length;
        },
        calcSecsPerEntity: function() {
            var range = this.timeline.getVisibleChartRange();
            var entityWidth = this.EntityView.prototype.getWidth();
            var width = $(this.timelineDOM).width();
            var start = new Date(range.start);
            var end = new Date(range.end);
            var span = range.end - range.start;
            var secsPerPixel = span / width;
            this.LOG.debug('calcSecsPerEntity', 
                    'range',range, 
                    'span', span,
                    'entityWidth', entityWidth, 
                    'width', width,
                    'secsPerPixel', secsPerPixel
                    );
            return secsPerPixel * entityWidth;
        },
        checkCluster: function(entity1, entity2, distance) {
            var time1 = new Date(entity1.get(this.timeAttr));
            var time2 = new Date(entity2.get(this.timeAttr));
            var dist = time2.getTime() - time1.getTime();
            this.LOG.debug('checkCluster', entity1, entity2, time1, time2, dist);
            if( dist < 0 ) dist *= -1;
            return dist < distance;
        },
    });
    return ClusterHelper;
});
