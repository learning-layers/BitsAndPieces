define(['logger'],
function(Logger){
    function EntitiesHelper(timeAttr, viewType) {
        this.timeAttr = timeAttr;
        this.EntityView = viewType;
        this.entityViews = [];
        this.LOG = Logger.get('EntitiesHelper');
    };
    EntitiesHelper.prototype = {
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
        addEntityView: function(entity) {
            var view = this.getEntityView(entity);
            if( view ) return view;

            view = new this.EntityView({ model: entity });
            this.entityViews.push( view );

            var time = entity.get(this.timeAttr);
            if( !time ) {
                this.LOG.warn("entity " + entity.getSubject() + " has invalid time");
            }
            var entityEl = view.render().$el;
            var data = {
                'start' : new Date(time),
                'content' : entityEl.get(0)
            };
            this.timeline.addItem(data);

            return view;
        },
        changeEntityView: function(entity) {
            var id = this.getEntityViewIndex(entity);
            var view = this.getEntityView(entity);
            this.timeline.changeItem(id, {
                'start': new Date(entity.get(this.timeAttr)),
                'content' : view.$el.get(0)
            });
        },
        removeEntityView: function(entity) {
            var id = this.getEntityViewIndex(entity);
            if( id === -1 ) return; // if view was already deleted

            this.timeline.deleteItem(id);
            this.entityViews[id].remove();
            this.entityViews.splice(id, 1);
        },
        setTimeline: function(timeline, dom) {
            this.timeline = timeline;
            this.timelineDOM = dom;
        }
    };
    return EntitiesHelper;
});
