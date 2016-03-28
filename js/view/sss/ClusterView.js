define(['tracker', 'underscore', 'backbone', 'logger', 'jquery', 'voc', 'view/sss/EntityView'], function(tracker, _, Backbone, Logger, $, Voc, EntityView) {
    return Backbone.View.extend({
        LOG: Logger.get('ClusterView'),
        events: {
            'click .expandable' : 'expand',
            // NB! mouseover/leave don't work in junction with dragndrop of bits from the preview box
            //'mouseover .expandable' : 'expand', 
            //'mouseleave .expanded' : 'close',
            'click .expanded .closeCluster' : 'close',
            'click .expanded .zoomCluster' : 'zoom' //@unused UI removed
        },
        initialize: function(options) {
            this.model.on('change:entities', this.render, this);
            this.timeAttr = options.timeAttr;
        },
        contains: function(entity) {
            return _.contains(this.model.get('entities'), entity);
        },
        render: function() {
            var that = this;

            this.$el.empty();
            this.$el.attr({
                'class' : 'cluster labelable'
            });
            // TODO: rendering by template
            var entities = _.sortBy(this.model.get('entities'), function(entity) {
                return entity.get(that.timeAttr);
            });
            var that = this;
            var contents = $('<div>');
            this.$el.append(contents);
            if( this.expanded ) {
                var tmpWidth = 0;
                contents.addClass("expanded");
                contents.append("<div class=\"buttons\"></div>")
                    .find('.buttons')
                    .append("<button class=\"closeCluster\" title=\"Close\">X</button>");
                    //@unused .append("<button class=\"zoomCluster\" title=\"Fit to Timeline\">&lt;&gt;</button>");
                tmpWidth += contents.find('.buttons').outerWidth(true) + 5;
                _.each(entities, function(entity) {
                    var tmpView =  new EntityView({
                        'model': entity
                    }).render(),
                        tmpViewWidth = tmpView.$el.outerWidth(true);

                    tmpView.toolContext = tracker.TIMELINEAREA;
                    tmpView.trackerEvtContent = entity.get(Voc.creationTime);

                    contents.append(tmpView.$el);
                    tmpWidth += (tmpViewWidth >= 50) ? tmpViewWidth : 50;
                });
                contents.css('width', tmpWidth + 'px');
            } else {
                contents.addClass("expandable");
                var label = entities.length + " bits";
                contents.html("<img class=\"icon\" src=\"img/sss/stack.png\" "+ 
                    "alt=\"" + label + "\"/>"+
                    "<label class=\"withlabel\">" +
                    "<strong>"+label+"</strong>"+
                    "</label>");
            }
            return this;
        },
        expand: function() {
            this.expanded = true;
            this.render();
            this.$el.trigger($.Event('bnp:expanded', {
                clusterView: this
            }));
        },
        close: function() {
            this.expanded = false;
            this.render();
            this.$el.trigger($.Event('bnp:unexpanded', {
                clusterView: this
            }));

        },
        //@unused UI removed
        zoom: function(e) {
            this.$el.trigger($.Event('bnp:zoomCluster', {
                originalEvent : e,
                cluster : this.model
            }));
        }

    });
});
