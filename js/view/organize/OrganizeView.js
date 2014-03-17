define(['vie', 'logger', 'tracker', 'underscore', 'jquery', 'backbone',
        'view/sss/EntityView','view/sss/OrgaEntityView', 'organize', 'model/organize/OrganizeData', 'voc' ], 
    function(VIE, Logger, tracker, _, $, Backbone, EntityView, OrgaEntityView, Organize, OrganizeData, Voc){
    return Backbone.View.extend({
        LOG: Logger.get('OrganizeView'),
        events:{
            'AddCircle': 'AddCircle',
            'ChangeCircle': 'ChangeCircle',
            'RemoveCircle': 'RemoveCircle',
            //'AddEntity': 'AddEntity',
            'ChangeEntity': 'ChangeEntity',
            'RemoveEntity': 'RemoveEntity',
            'ClickEntity': 'ClickEntity'
        },
        initialize: function() {

            this.EntityView = this.options.EntityView;
            this.listenTo(this.model, 'change', this.changeStuff);
            this.views = {};

            this.$el = $(this.el);
            this.$el.empty();

            this.LOG.debug("initialize Organize component");
            this.organize = new Organize();

        },
        changeStuff: function(model, options) {
            this.LOG.debug('options', options);
            if( options && options.by === this ) return;
            this.LOG.debug('filter change of ' + model.getSubject());
            var changed = model.changedAttributes();
            this.LOG.debug('changed: ', JSON.stringify(changed));
            var OrganizeView = this;
            for( var key in changed ) {
                this.LOG.debug('key : ' + key );
                if( key === this.model.vie.namespaces.uri(Voc.hasCircle)) {
                    kind = 'Circle';
                } else if( key === this.model.vie.namespaces.uri(Voc.hasEntity)){
                    kind = 'Entity';
                } else continue;;

                var previous = this.model.previous(Voc['has'+kind]) || [];
                if( !_.isArray(previous)) previous = [previous];
                this.LOG.debug('previous', JSON.stringify(previous));

                var current = this.model.get(Voc['has'+kind]) || [];
                if( !_.isArray(current)) current = [current];
                this.LOG.debug('current', JSON.stringify(current));

                var added = _.difference(current, previous);
                this.LOG.debug('added', JSON.stringify(added));
                _.each(added, function(a){
                    a = OrganizeView.model.vie.entities.get(a);
                    //OrganizeView.listenTo(a, 'change', OrganizeView['change'+kind]);
                    //OrganizeView.listenTo(a, 'destroy', OrganizeView.['remove' + kind]);
                    OrganizeView['add'+ kind](a, OrganizeView.model.vie.entities, options);
                });
            }
        },
        render: function() {
            this.LOG.debug('el = ', this.el);
            this.organize.loadOrganizeCanvas(this.el);
            // Make the view aware of existing entities in collection
            var view = this;
            var entities = this.model.get(Voc.hasEntity) || [];
            if( !_.isArray(entities)) entities = [entities];
            _.each(entities, function(entity) {
                view.addEntity(entity);
            }, this);

            var circles = this.model.get(Voc.hasCircle) || [];
            if( !_.isArray(circles)) circles = [circles];
            _.each(circles, function(circle) {
                view.addCircle(circle);
            }, this);
            //this.delegateEvents();
        },
        remove: function() {
            this.organize.clearCanvas();
            this.undelegateEvents();
            this.stopListening();
            Backbone.View.prototype.remove.call(this);
        },
        AddCircle: function(event){
            this.LOG.debug("event", event);
            if( !event || !event.detail ) return;
            var circle = _.clone(event.detail);
            this.LOG.debug("AddCircle caught ", circle);
            //circle['_organizeId'] = circle['id'];
            // FIXME: check that:
            var id = circle['id'];
            tracker.info(tracker.CREATEORGANIZECIRCLE, tracker.NULL, circle);
            delete circle['id'];
            var model = OrganizeData.createCircle(this.model, circle, {'by':this});
            this.views[id] = new EntityView({'model' : model});
        },

        ChangeCircle: function(event){
            this.LOG.debug('event', event);
            if( !event || !event.detail ) return;
            var circle = event.detail;
            this.LOG.debug("ChangeCircle caught");
            this.LOG.debug("circle", circle);
            var view = this.views[circle.id];
            this.LOG.debug("view", view);
            if( !view ) {
              this.LOG.warn("Organize.CollectionView didn't know of this circle!");
              return;
            }
            tracker.info(tracker.CHANGEORGANIZECIRCLE, view.model.getSubject(), circle);
            //var cEntity = view.circleCollection.findWhere({'_organizeId' : circle.id });
            //circle['_organizeId'] = circle['id'];
            delete circle['id'];
            view.model.save(circle, {'by': this});
        },

        RemoveCircle: function(event){
            this.LOG.debug('event', event);
            if( !event || !event.detail ) return;
            var circle = event.detail;
            this.LOG.debug("RemoveCircle caught");
            var view = this.views[circle.id];
            if( !view ) {
              this.LOG.warn("Organize.CollectionView didn't know of this circle!");
              return;
            }
            //var cEntity = view.circleCollection.findWhere({'_organizeId' : circle.id });
            tracker.info(tracker.DELETEORGANIZECIRCLE, view.model.getSubject(), circle);
            view.model.destroy({'by':this});
        },

        AddEntity: function(event){
            this.LOG.debug('event', event);
            if( !event || !event.detail ) return;
            var entity = event.detail;
            this.LOG.debug("AddEntity caught");
            this.LOG.debug("entity", entity);
            //this.orgaEntityCollection.add(entity, {'by':this});
        },
        ChangeEntity: function(event){
            this.LOG.debug('event', event);
            if( !event || !event.detail ) return;
            var entity = event.detail;
            this.LOG.debug("ChangeEntity caught");
            var view = this.views[entity.id];
            if( !view ) {
              this.LOG.warn("Organize.CollectionView didn't know of this orgaEntity!");
              return;
            }
            tracker.info(tracker.MOVEORGANIZEENTITY, view.model.getSubject(), entity);
            //var eEntity = view.orgaEntityCollection.findWhere({'_organizeId' : entity.id });
            //entity['_organizeId'] = entity['id'];
            delete entity['id'];
            this.LOG.debug("view", view);
            view.model.save(entity, {'by': this});
        }, 

        RemoveEntity: function(event){
            this.LOG.debug('event', event);
            if( !event || !event.detail ) return;
            var entity = event.detail;
            this.LOG.debug("RemoveEntity caught");
            this.LOG.debug("entity", entity);
            var view = this.views[entity.id];
            if( !view ) {
              this.LOG.warn("Organize.CollectionView didn't know of this orgaEntity!");
              return;
            }
            tracker.info(tracker.DELETEORGANIZEENTITY, view.model.getSubject(), entity);
            //var eEntity = view.orgaEntityCollection.findWhere({'_organizeId' : entity.id });
            view.model.destroy({'by':this});
        }, 

        ClickEntity: function(event){
            this.LOG.debug('event', event);
            if( !event || !event.detail ) return;
            this.LOG.debug('caught ClickEntity');
            var entity = event.detail;
            var view = this.views[entity.id];
            if( !view ) {
              this.LOG.warn("Organize.CollectionView didn't know of this orgaEntity!");
              return;
            }
            var offset = this.$el.offset();
            var ev = $.Event('click', {
              //currentTarget: view.resourceView.el,
              pageX : offset.left + entity.x + 20 ,
              pageY : offset.top + entity.y + 20
            });
            view.resourceView.$el.trigger(ev);
                
        },

        addCircle: function(entity, collection, options ) {
            options = options || {};
            if( options.by && options.by === this ) return;
            this.LOG.debug("addCircle", options);
            var data = {
                'cx' : entity.get('cx'),
                'cy' : entity.get('cy'),
                'rx' : entity.get('rx'),
                'ry' : entity.get('ry'),
                'Label' : entity.get('Label'),
                'LabelX' : entity.get('LabelX'),
                'LabelY' : entity.get('LabelY')
            };
            this.LOG.debug("data", data);
            var id = this.organize.drawCircle(null, data);
            var view = new EntityView({'model':entity});
            //entity.set('_organizeId', id);
            this.views[id] = view;
        },
        changeCircle: function(circle, collection, options) {
            options = options || {};
            if( options.by && options.by === this ) return;
            //this.organize.removeEntity(id);
            this.LOG.warn("organize:changeCircle not implemented");
        },
        removeCircle: function(circle, collection, options) {
            options = options || {};
            if( options.by && options.by === this ) return;
            //this.organize.removeEntity(id);
            this.LOG.warn("organize:removeCircle not implemented");
        },
        addEntity: function(entity, collection, options) {
            options = options || {};
            if( options.by && options.by === this ) return;
            this.LOG.debug("ORGANIZE.CollectionVIEW.addEntity: " + entity.getSubject());
            /*
            var resource = entity.get('resource');
            var type = resource.get('sss:type') // FIXME: HARD CODED! 
            if( !type ) {
                this.LOG.warn("no type defined of " + resource.getSubject() );
                return;
            }
            */

            var view = new OrgaEntityView({model:entity});
            var data = {
                'x' : entity.get('x'),
                'y' : entity.get('y'),
                'imageURL' : view.getIcon()
            };
            this.LOG.debug("data", data);
            var id = this.organize.createAndDropSvgEntity(data);
            view.setSvgId(id);
            this.LOG.debug("id in organize = " + id);
            //entity.set('_organizeId', id);
            this.views[id] = view;
            
        },
        changeEntity: function(entity, collection, options) {
            options = options || {};
            if( options.by && options.by === this ) return;
            //this.organize.removeEntity(id);
            this.LOG.warn("organize:changeEntity not implemented");
        },
        removeEntity: function(entity, collection, options) {
            options = options || {};
            if( options.by && options.by === this ) return;
            this.LOG.warn("organize:removeEntity not implemented");
        }

    });
});
