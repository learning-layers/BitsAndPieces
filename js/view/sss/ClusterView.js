define(['underscore', 'backbone', 'logger', 'jquery'], function(_, Backbone, Logger, $) {
    return Backbone.View.extend({
        LOG: Logger.get('ClusterView'),
        initialize: function(options) {
            this.model.on('change:entities', this.render, this);
        },
        addEntity: function(entity) {
            if( _.contains(this.entities,entity) ) return;
            this.entities.push(entity);
            this.render();
        },
        contains: function(entity) {
            return _.contains(this.model.get('entities'), entity);
        },
        render: function() {
            var entities = this.model.get('entities');
            var label = "cluster of " + entities.length + " bits";
            this.$el.html(
                    "<div class=\"cluster\">"+
                    "<img class=\"icon\" src=\"img/sss/stack.png\" "+ 
                    "alt=\"" + label + "\"/>"+
                    "<label class=\"withlabel\">" +
                    "<strong>"+label+"</strong>"+
                    "</label>"+
                    "</div>");
            return this;
        }
    });
});
