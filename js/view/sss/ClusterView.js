define(['underscore', 'backbone', 'logger', 'jquery', 'view/sss/EntityView'], function(_, Backbone, Logger, $, EntityView) {
    return Backbone.View.extend({
        LOG: Logger.get('ClusterView'),
        events: {
            'click .expandable' : 'click',
            'click .expanded .close' : 'close',
            'click .expanded .zoom' : 'zoom'
        },
        initialize: function(options) {
            this.model.on('change:entities', this.render, this);
        },
        contains: function(entity) {
            return _.contains(this.model.get('entities'), entity);
        },
        render: function() {
            this.$el.empty();
            this.$el.attr({
                'class' : 'cluster labelable'
            });
            // TODO: rendering by template
            var entities = this.model.get('entities');
            var that = this;
            var contents = $('<div>');
            this.$el.append(contents);
            if( this.expanded ) {
                contents.addClass("expanded");
                contents.append("<div class=\"buttons\"><button class=\"close\">X</button><button class=\"zoom\">&lt;&gt;</button></div>");
                _.each(entities, function(entity) {
                    contents.append(new EntityView({
                        'model': entity
                    }).render().$el);
                            
                });
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
        click: function(e) {
            this.expand();
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
        zoom: function(e) {
            this.$el.trigger($.Event('bnp:zoomCluster', {
                originalEvent : e,
                cluster : this.model
            }));
        }

    });
});
