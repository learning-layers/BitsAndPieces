define(['logger', 'backbone', 'jquery', 'voc', 'tracker', 'underscore', 'jquery',
        'view/sss/EntityView', 
        'view/sss/ClusterView', 
        'view/timeline/TimelineView', 
        'view/organize/OrganizeView',
        'view/organize/OrganizeOverlayView',
        'data/organize/OrganizeData'],
    function(Logger, Backbone, $, Voc, tracker, _, $, EntityView, ClusterView, TimelineView, OrganizeView, OrganizeOverlayView, OrganizeData) {
        return Backbone.View.extend({
            LOG: Logger.get("WidgetView"),
            events: {
                'bnp:enableOrganize' : 'enableOrganize',
                'bnp:disableOrganize' : 'disableOrganize',
                'bnp:addReleaseLockButton' : 'addReleaseLockButton',
                'bnp:lockTimeRemaining' : 'setLockTimeRemaining'
            },
            initialize: function() {
                this.LOG.debug('el', this.el, this.$el);
                this.listenTo(this.model, 'destroy', this.remove);

                this.circleRenameModalView = this.options.circleRenameModalView;
                
            },
            remove: function() {
                if( this.view ) { this.view.remove(); }
                Backbone.View.prototype.remove.call(this);
            },
            render: function() {
                this.LOG.debug('render widgetView', this);
                var body;
                if( this.model.isof( Voc.TIMELINE )) {
                    this.$el.append('<legend>Browse</legend>');
                    body = $('<div class="timelineFrame"></div>');
                    this.$el.append(body);
                    this.view = this.createTimeline(body);
                } else if (this.model.isof( Voc.ORGANIZE )) {
                    this.$el.append('<legend>Organize</legend>');
                    body = $('<div tabindex="1" style="width:100%; height:400px"></div>');
                    this.$el.append(body);
                    this.$el.addClass('organizeWidget');
                    this.view = this.createOrganize(body);

                    this.organizeOverlayView = new OrganizeOverlayView({
                        'model' : this.model,
                        'organizeView' : this.view
                    }).render();
                    this.$el.append(this.organizeOverlayView.$el);

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
                return this.model.isof(Voc.BROWSING_WIDGET);
            },
            isOrganize: function() {
                return this.model.isof(Voc.ORGANIZING_WIDGET);
            },
            createTimeline: function(timelineBody) {
                this.LOG.debug("adding TimelineView");

                // --- ADD THE TIMELINE VIEW --- //
                var timelineView = new TimelineView({
                    model : this.model,
                    EntityView: EntityView,
                    ClusterView: ClusterView,
                    //GroupByEntityView: SSS.UserView,
                    el: timelineBody,
                    //groupBy: this.vie.namespaces.uri('sss:user'),
                    timeline: {
                        'width': '100%',
                        'height': '200px',
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
                    el: organizeBody,
                    circleRenameModalView: this.circleRenameModalView
                });
                organizeView.render();

                var that = this;
                organizeBody.droppable({
                    drop: function(event, ui) {
                        var id = ui.helper.attr('about');
                        that.LOG.debug("dropped " + id);
                        var offset = $(this).offset();
                        var entity = {};
                        entity[Voc.x] = ui.offset.left - offset.left;
                        entity[Voc.y] = ui.offset.top - offset.top;
                        entity[Voc.hasResource] = id;
                        tracker.info(tracker.DROPORGANIZEENTITY, id, entity);
                        OrganizeData.createEntity(that.model, entity);
                    }
                });
                return organizeView;
            },
            enableOrganizeDroppable: function() {
                if ( this.isOrganize() ) {
                    this.view.$el.droppable('enable');
                }
            },
            disableOrganizeDroppable: function() {
                if ( this.isOrganize() ) {
                    this.view.$el.droppable('disable');
                }
            },
            enableOrganize: function(e) {
                if ( this.isOrganize() ) {
                    var that = this;

                    this.enableOrganizeDroppable();
                    this.addReleaseLockButton();
                }
            },
            disableOrganize: function(e) {
                if (this.isOrganize() ) {
                    this.disableOrganizeDroppable();
                    this.$el.find('button[name="releaseEditingLock"]').off('click').remove();
                }
            },
            addReleaseLockButton: function() {
                if ( this.isOrganize() ) {
                    var that = this;

                    this.$el.prepend('<button type="button" class="btn btn-info" name="releaseEditingLock">Release Editing Lock</button>');
                    this.$el.find('button[name="releaseEditingLock"]').on('click', function(e) {
                        that.organizeOverlayView.enableOverlay(e);
                    });
                }
            },
            removeEpisodeLockIfNeeded: function() {
                if ( this.isOrganize() ) {
                    this.organizeOverlayView.removeEpisodeLockIfNeeded();
                }
            },
            setLockTimeRemaining: function(e) {
                if ( this.isOrganize() ) {
                    this.$el.find('.lockTimeRemaining').remove();
                    this.$el.find('button[name="releaseEditingLock"]').append('<span class="lockTimeRemaining"> (' + ( ( e.minutesRemaining > 0 ) ? e.minutesRemaining + ' minutes ' : '') + ( ( e.secondsRemaining > 0 ) ? e.secondsRemaining + ' seconds' : '') + ' left to edit)</span>');
                }
            }
        });
});

