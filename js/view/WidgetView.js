define(['logger', 'backbone', 'jquery', 'voc', 'tracker',
        'view/sss/EntityView', 
        'view/sss/UserEventView', 
        'view/timeline/TimelineView', 
        'view/organize/OrganizeView',
        'model/organize/OrganizeData'],
    function(Logger, Backbone, $, Voc, tracker, EntityView, UserEventView, TimelineView, OrganizeView, OrganizeData) {
        return Backbone.View.extend({
            LOG: Logger.get("WidgetView"),
            initialize: function() {
                var type = this.model.get('@type').id;
                this.ctype = this.model.vie.namespaces.curie(type);
                this.LOG.debug('el', this.el, this.$el);
                this.listenTo(this.model, 'destroy', this.remove);
                
            },
            remove: function() {
                if( this.view ) { this.view.remove(); }
                Backbone.View.prototype.remove.call(this);
            },
            render: function() {
                this.LOG.debug('render widgetView', this);
                var body;
                if( this.ctype == Voc.TIMELINE ) {
                    this.$el.append('<legend>Browse</legend>');
                    body = $('<div class="timelineFrame"></div>');
                    this.$el.append(body);
                    this.view = this.createTimeline(body);
                } else if (this.ctype == Voc.ORGANIZE ) {
                    this.$el.append('<legend>Organize</legend>');
                    body = $('<div tabindex="1" style="width:100%; height:400px"></div>');                     
                    this.$el.append(body);
                    this.view = this.createOrganize(body);
                } else {
                    this.listenToOnce(this.model, 'change', this.render);
                }
                this.$el.attr('about', this.model.getSubject());
                if( this.model.isNew() ) {
                    this.listenToOnce(this.model, 'change:' + this.model.idAttribute, function(model, value, options) {
                        AppLog.debug('change subject from', model.cid, 'to', value);
                        this.$el.attr('about', value);
                    });
                }
                return this;
            },
            isBrowse: function() {
                return this.ctype == Voc.TIMELINE;
            },
            isOrganize: function() {
                return this.ctype == Voc.ORGANIZE;
            },
            createTimeline: function(timelineBody) {
                this.LOG.debug("adding TimelineView");

                // --- ADD THE TIMELINE VIEW --- //
                var timelineView = new TimelineView({
                    model : this.model,
                    EntityView: UserEventView,
                    //GroupByEntityView: SSS.UserView,
                    el: timelineBody,
                    //groupBy: this.vie.namespaces.uri('sss:user'),
                    timeline: {
                        'width': '100%',
                        'height': '180px',
                        'editable': false, // disable dragging and editing events
                        'axisOnTop': true,
                        'stackEvents': false,
                        //eventMarginAxis: '20', // minimal margin beteen events and the axis
                        'style': 'box'
                    }
                });
                return timelineView.render();
            },
            createOrganize: function(organizeBody) {
                var organizeView = new OrganizeView({
                    model: this.model,
                    EntityView: EntityView,
                    el: organizeBody
                });
                organizeView.render();

                var that = this;
                organizeBody.droppable({
                    drop: function(event, ui) {
                        var id = ui.helper.attr('about');
                        that.LOG.debug("dropped " + id);
                        var offset = $(this).offset();
                        var entity = {//ORGANIZE.Entity({
                            x: ui.offset.left - offset.left,
                            y: ui.offset.top - offset.top,
                            resource: id
                        };
                        tracker.info(tracker.DROPORGANIZEENTITY, id, entity);
                        OrganizeData.createEntity(that.model, entity);
                    }
                });
                return organizeView;
            },
        });
});

