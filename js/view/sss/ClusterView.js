define(['underscore', 'backbone', 'logger', 'jquery'], function(_, Backbone, Logger, $) {
    return Backbone.View.extend({
        LOG: Logger.get('ClusterView'),
        events: {
            'click' : 'click'
        },
        initialize: function(options) {
            this.model.on('change:entities', this.render, this);
        },
        contains: function(entity) {
            return _.contains(this.model.get('entities'), entity);
        },
        render: function() {
            var entities = this.model.get('entities');
            var label = entities.length + " bits";
            this.$el.html(
                    "<div class=\"cluster labelable\">"+
                    "<img class=\"icon\" src=\"img/sss/stack.png\" "+ 
                    "alt=\"" + label + "\"/>"+
                    "<label class=\"withlabel\">" +
                    "<strong>"+label+"</strong>"+
                    "</label>"+
                    "</div>");
            return this;
        },
        click: function(e) {
            var ev = $.Event('bnp:clickCluster', {
                originalEvent : e,
                cluster : this.model
            });
            this.$el.trigger(ev);
        }
    });
});
