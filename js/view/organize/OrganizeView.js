define(['vie', 'logger', 'tracker', 'underscore', 'jquery', 'backbone',
        'view/sss/EntityView','view/sss/OrgaEntityView', 'organize', 'data/organize/OrganizeData', 'voc', 'utils/SystemMessages' ],
    function(VIE, Logger, tracker, _, $, Backbone, EntityView, OrgaEntityView, Organize, OrganizeData, Voc, SystemMessages){
    return Backbone.View.extend({
        LOG: Logger.get('OrganizeView'),
        events:{
            'AddCircle': 'AddCircle',
            'ChangeCircle': 'ChangeCircle',
            'ChangeCircleLabel': 'ChangeCircleLabel',
            'RemoveCircle': 'RemoveCircle',
            //'AddEntity': 'AddEntity',
            'ChangeEntity': 'ChangeEntity',
            'RemoveEntity': 'RemoveEntity',
            'ClickEntity': 'ClickEntity'
        },
        initialize: function() {
            this.canvasWidth = 2000;
            this.canvasHeight = 1500;

            this.EntityView = this.options.EntityView;
            var version = this.model.get(Voc.belongsToVersion);
            this.listenTo(version, 'change', this.changeStuff);
            this.views = {};

            this.$el = $(this.el);
            this.$el.empty();

            this.LOG.debug("initialize Organize component");
            this.organize = new Organize();
            // Set drag constraints as needed
            this.organize.DRAG_CONSTRAINTS = {
                minX: 0,
                minY: 0,
                maxX: 2000,
                maxY: 1500
            };

            this.circleRenameModalView = this.options.circleRenameModalView;
            version.on('destroy', function(model, collection, options) {
                this.remove();
            }, this);
        },
        changeStuff: function(model, options) {
            if ( true === this.clearAndUpdateProcedureInProcess ) return;
            this.LOG.debug('options', options);
            if( options && options.by === this ) return;
            this.LOG.debug('filter change of ' + model.getSubject());
            var changed = model.changedAttributes();
            this.LOG.debug('changed: ', JSON.stringify(changed));
            var OrganizeView = this;
            for( var key in changed ) {
                this.LOG.debug('key : ' + key );
                if( key === model.vie.namespaces.uri(Voc.hasCircle)) {
                    kind = 'Circle';
                } else if( key === model.vie.namespaces.uri(Voc.hasEntity)){
                    kind = 'Entity';
                } else continue;;

                var previous = model.previous(Voc['has'+kind]) || [];
                if( !_.isArray(previous)) previous = [previous];
                this.LOG.debug('previous', JSON.stringify(previous));

                var current = model.get(Voc['has'+kind]) || [];
                if( !_.isArray(current)) current = [current];
                this.LOG.debug('current', JSON.stringify(current));

                var added = _.difference(current, previous);
                this.LOG.debug('added', JSON.stringify(added));
                _.each(added, function(a){
                    a = model.vie.entities.get(a);
                    //OrganizeView.listenTo(a, 'change', OrganizeView['change'+kind]);
                    //OrganizeView.listenTo(a, 'destroy', OrganizeView.['remove' + kind]);
                    OrganizeView['add'+ kind](a, model.vie.entities, options);
                });
            }
        },
        render: function() {
            this.LOG.debug('el = ', this.el);
            this.organize.loadOrganizeCanvas(this.el);
            // Set height and width of SVG element
            this.$el.find('svg').attr('width', this.canvasWidth + 'px').attr('height', this.canvasHeight + 'px');
            // Make the view aware of existing entities in collection
            var view = this;
            var version = this.model.get(Voc.belongsToVersion);
            var entities = version.get(Voc.hasEntity) || [];
            if( !_.isArray(entities)) entities = [entities];
            _.each(entities, function(entity) {
                view.addEntity(entity);
            }, this);

            var circles = version.get(Voc.hasCircle) || [];
            if( !_.isArray(circles)) circles = [circles];
            _.each(circles, function(circle) {
                view.addCircle(circle);
            }, this);
            this.stealthContainer = $("<div style=\"display:none\">");
            this.$el.append(this.stealthContainer);
        },
        clearOrganizeAndViews: function() {
            // This will prevent adding anything to the Organize
            this.clearAndUpdateProcedureInProcess = true;

            if ( !_.isEmpty(this.views) ) {
                this.organize.clearCanvas();
                _.each(this.views, function(single) {
                    if ( single.resourceView ) {
                        single.resourceView.remove();
                    }
                    single.remove();
                });
                this.views = {};
            }
        },
        reRenderOrganize: function() {
            var view = this;
            var version = this.model.get(Voc.belongsToVersion);
            var entities = version.get(Voc.hasEntity) || [];
            if( !_.isArray(entities)) entities = [entities];
            _.each(entities, function(entity) {
                view.addEntity(entity);
            }, this);

            var circles = version.get(Voc.hasCircle) || [];
            if( !_.isArray(circles)) circles = [circles];
            _.each(circles, function(circle) {
                view.addCircle(circle);
            }, this);

            // This will enable adding elements to Organize
            this.clearAndUpdateProcedureInProcess = false;
        },
        remove: function() {
            this.clearOrganizeAndViews();
            this.organize.clearCanvas();
            this.undelegateEvents();
            this.stopListening();
            Backbone.View.prototype.remove.call(this);
        },
        mapAttributes : function(item) {
            if( item.cx ) {
                item.xC = item.cx;
                delete item.cx;
            }
            if( item.cy ) {
                item.yC = item.cy;
                delete item.cy;
            }
            if( item.rx ) {
                item.xR = item.rx;
                delete item.rx;
            }
            if( item.ry ) {
                item.yR = item.ry;
                delete item.ry;
            }
            if( item.Label ) {
                item.label = item.Label;
                delete item.Label;
            }
            if ( item.Description ) {
                item.description = item.Description;
                delete item.Description;
            }
            if( item.LabelX ) {
                item.xLabel = item.LabelX;
                delete item.LabelX;
            }
            if( item.LabelY ) {
                item.yLabel = item.LabelY;
                delete item.LabelY;
            }

            for( var prop in item ) {
                item['sss:'+prop] = item[prop];
                delete item[prop];
            }
            this.LOG.debug('mapAttributes > item', _.clone(item));
            return item;
        },
        AddCircle: function(event){
            this.LOG.debug("event", event);
            if( !event || !event.detail ) return;
            var circle = _.clone(event.detail);
            this.LOG.debug("AddCircle caught ", circle);
            //circle['_organizeId'] = circle['id'];
            // FIXME: check that:
            var id = circle['id'];
            delete circle['id'];
            var model = OrganizeData.createCircle(this.model, this.mapAttributes(circle), {'by':this});
            this.views[id] = new EntityView({'model' : model});

            var version = this.model.get(Voc.belongsToVersion);
            var episode = version.get(Voc.belongsToEpisode);
            model.once('change:'+model.idAttribute, function(model, value, options) {
                // TODO Clean-up needed
                //tracker.info(tracker.ADDCIRCLETOLEARNEPVERSION, tracker.ORGANIZEAREA, model.getSubject(), null, [episode.getSubject()]);
            }, this);
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
            //var cEntity = view.circleCollection.findWhere({'_organizeId' : circle.id });
            //circle['_organizeId'] = circle['id'];
            delete circle['id'];
            view.model.save(this.mapAttributes(circle), {'by': this});
        },

        ChangeCircleLabel: function(event){
            this.LOG.debug('event', event);
            if( !event || !event.detail ) return;
            var that = this,
                circle = event.detail;
            this.LOG.debug("ChangeCircle caught");
            this.LOG.debug("circle", circle);
            var view = this.views[circle.id];
            this.LOG.debug("view", view);
            if( !view ) {
              this.LOG.warn("Organize.CollectionView didn't know of this circle!");
              return;
            }

            // Set title, reset autocomplete (make sure that loaded info is used),
            // set save action handler (will close the modal), open modal
            this.circleRenameModalView.setRenamedCircleLabel(view.model.get(Voc.label));
            this.circleRenameModalView.setRenamedCircleDescription(view.model.get(Voc.description));
            this.circleRenameModalView.setAuthor(view.model.get(Voc.author).get(Voc.label));
            this.circleRenameModalView.resetAutocompleteSource();
            this.circleRenameModalView.setSaveActionHandler(function(e){
                e.preventDefault();
                var newCircleLabel = that.circleRenameModalView.getRenamedCircleLabel();
                circle.Label = newCircleLabel;
                var newCircleDescription = that.circleRenameModalView.getRenamedCircleDescription();
                circle.Description = newCircleDescription;

                //var cEntity = view.circleCollection.findWhere({'_organizeId' : circle.id });
                //circle['_organizeId'] = circle['id'];
                delete circle['id'];
                that.organize.currentLabel.text(circle.Label);
                // Need to use currentLabel before hide is fired as the callback removes the currentLabel as such
                that.circleRenameModalView.hideModal();
                view.model.save(that.mapAttributes(circle), {'by': that});

                var version = that.model.get(Voc.belongsToVersion);
                var episode = version.get(Voc.belongsToEpisode);
                // TODO Check if version and episode are needed any more
                //tracker.info(tracker.CHANGELABEL, tracker.ORGANIZEAREA, view.model.getSubject(), newCircleLabel, [episode.getSubject()]);
            });
            this.circleRenameModalView.setSelectActionHandler(function(event, ui) {
                var version = that.model.get(Voc.belongsToVersion);
                var episode = version.get(Voc.belongsToEpisode);
                tracker.info(tracker.CLICKLABELRECOMMENDATION, tracker.ORGANIZEAREA, view.model.getSubject(), ui.item.value, [episode.getSubject()]);
            });
            this.circleRenameModalView.setHideActionHandler(function() {
                that.organize.quietUnselectLabelAndInside();
            });
            this.circleRenameModalView.showModal();
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
            
            var version = this.model.get(Voc.belongsToVersion);
            var episode = version.get(Voc.belongsToEpisode);
            // TODO Clean-up needed
            //tracker.info(tracker.REMOVELEARNEPVERSIONCIRCLE, tracker.ORGANIZEAREA, view.model.getSubject(), null, [episode.getSubject()]);

            //var cEntity = view.circleCollection.findWhere({'_organizeId' : circle.id });
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
            //var eEntity = view.orgaEntityCollection.findWhere({'_organizeId' : entity.id });
            //entity['_organizeId'] = entity['id'];
            delete entity['id'];
            this.LOG.debug("view", view);
            view.model.save(this.mapAttributes(entity), {'by': this});
        }, 

        RemoveEntity: function(event){
            if ( true === this.clearAndUpdateProcedureInProcess ) return;
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
            var that = this;
            var orgaentities = that.model.vie.entities.filter(function(entity) {
                return entity.attributes['@type'] === Voc.ORGAENTITY && entity.get(that.model.vie.namespaces.uri(Voc.ENTITY)) === view.resourceView.model;
            });
            if ( orgaentities.length <= 1 ) {
                view.resourceView.model.set(Voc.isUsed, false);
            }

            var version = this.model.get(Voc.belongsToVersion);
            var episode = version.get(Voc.belongsToEpisode);
            // TODO Clean-up needed
            //tracker.info(tracker.REMOVELEARNEPVERSIONENTITY, tracker.ORGANIZEAREA, view.resourceView.model.getSubject(), null, [episode.getSubject()]);
            SystemMessages.addSuccessMessage(view.resourceView.model.get(Voc.label) + ' was removed from episode ' + episode.get(Voc.label), true, 5000);

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
            return false;
        },

        addCircle: function(entity, collection, options ) {
            options = options || {};
            if( options.by && options.by === this ) return;
            this.LOG.debug("addCircle", options);
            var data = {
                'cx' : entity.get(Voc.xC),
                'cy' : entity.get(Voc.yC),
                'rx' : entity.get(Voc.xR),
                'ry' : entity.get(Voc.yR),
                'Label' : entity.get(Voc.label),
                'LabelX' : entity.get(Voc.xLabel),
                'LabelY' : entity.get(Voc.yLabel)
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
            this.stealthContainer.append(view.resourceView.$el);
            var id = this.organize.createAndDropSvgEntity(view.getSvgData());
            view.setSvgId(id);
            this.LOG.debug("id in organize = " + id);
            //entity.set('_organizeId', id);
            this.views[id] = view;

            // Setting entity as used
            view.resourceView.model.set(Voc.isUsed, true);
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
