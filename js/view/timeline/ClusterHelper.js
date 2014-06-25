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

            this.clusterByEntity(entity);
        },
        clusterByEntity: function(ec) {
            this.LOG.debug("clusterByEntity, ec = ", ec );
            var s = this.sortedEntities.indexOf(ec, true);

            var eacs = [];
            if( s > 0 ) {
                eacs.push(this.sortedEntities.at(s-1));
            }
            eacs.push(ec);
            if( s < this.sortedEntities.size() -1 ) {
                eacs.push(this.sortedEntities.at(s+1));
            }

            this.LOG.debug('clusterByEntity, eacs', eacs);
            var new_eacs = this.recluster(eacs);
            this.LOG.debug('clusterByEntity, new_eacs', new_eacs);
            this.removeAll(eacs);
            this.addAll(new_eacs);
        },
        clusterByRange: function(start, end) {
            start = new Date(start);
            end = new Date(end);
            var that = this;
            var eacs = this.sortedEntities.filter(function(ec) {
                var time = new Date(ec.get(that.timeAttr));
                return time >= start && time < end;
            });
            
            var entities = [];
            _.each(eacs, function(ec) {
                if( ec.isCluster ) {
                    var es = ec.get('entities')
                    _.each(es, function(e){
                        entities.push(e);
                    });
                } else {
                    entities.push(ec);
                }
            });

            this.LOG.debug('clusterByRange', 'start', start, 'end', end, 'entities', entities);
            var new_eacs = this.recluster(entities);
            this.LOG.debug('clusterByRange, new_eacs', new_eacs);
            this.removeAll(eacs);
            this.addAll(new_eacs);
        },
        removeAll: function(eacs) {
            var that = this;
            _.each(eacs, function(e) {
                that.LOG.debug('remove', e);
                EntitiesHelper.prototype.removeEntityView.call(that, e);
                that.sortedEntities.remove(e);
            });
        },
        addAll: function(eacs) {
            var that = this;
            _.each(eacs, function(e) {
                that.LOG.debug('add', e);
                that.sortedEntities.add(e);
                if( e.isCluster ) {
                    that.LOG.debug('isCluster', e);
                    that.addClusterView(e);
                } else {
                    EntitiesHelper.prototype.addEntityView.call(that, e);
                }
            });
        },
        recluster: function(entities) {
            var result = [];
            if( entities.length == 0 ) {
                return result;
            }
            var c = entities[0];
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
                this.LOG.debug('entity is in cluster', cluster);
                this.setCluster(entity, null);

                var entities = _.without(cluster.get('entities'), entity);
                this.LOG.debug('entities without entity', entities);
                if( entities.length == 1 ) {
                    entity = entities[0];
                    EntitiesHelper.prototype.removeEntityView.call(this, cluster);
                    this.sortedEntities.remove(cluster);
                    this.setCluster(entity, null);

                } else {
                    cluster.set('entities', entities);
                    entity = cluster;
                }
                this.clusterByEntity(entity);
            } else {
                EntitiesHelper.prototype.removeEntityView.call(this, entity);
                this.sortedEntities.remove(entity);
            }
        },
        addClusterView: function(cluster) {
            var view = new this.ClusterView({
                'model': cluster
            });
            this.entityViews.push(view);
            var data = {
                'start' : new Date(cluster.get(this.timeAttr)),
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
            var that = this;
            _.each(entities, function(e){
                that.setCluster(e, cluster);
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
