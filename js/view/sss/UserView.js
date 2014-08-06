define(['view/sss/EntityView', 'logger', 'underscore', 'jquery', 'voc'], function(EntityView, Logger, _, $, Voc){
    return EntityView.extend({
        LOG: Logger.get('UserView'),
        initialize: function() {
            //this.template = _.template("<span><%= sss:name %></span>");
            this.listenTo(this.model, 'change', this.change);
        },
        change: function(model, options) {
            if( this.model !== model ) return;
            this.LOG.debug("changeUser");
            this.render();
        },
        render: function() {
            this.$el.attr({
              'class' : 'entity user',
              'about' : this.model.getSubject()
            });
            this.$el.html(//"<div class=\"entity user\" about=\""+this.model.getSubject()+"\">"+
                    "<img class=\"icon\" src=\""+this.getIcon()+"\" "+ 
                    "alt=\"User " + this.model.get(Voc.label) + "\"/>"+
                    "<div class=\"userLabel\">"+this.model.get(Voc.label)+"</div>");

                    //"</div>");
            // Prevent user dragging and dropping
            //this.draggable();
            return this;
        },
        _getIcon: function() {
          this.LOG.debug(this.model.getSubject());
          this.LOG.debug(this.model.vie.namespaces.curie(this.model.getSubject()));
          return this.icons[this.model.vie.namespaces.curie(this.model.getSubject())];
        },
        _click: function(e) {
            // This currently prevents user from using entity click event
            return false;
        }

    });
});
