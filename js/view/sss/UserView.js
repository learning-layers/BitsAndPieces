define(['view/sss/EntityView', 'logger', 'underscore'], function(EntityView, Logger, _){
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
              'resource' : this.model.getSubject()
            });
            this.$el.html(//"<div class=\"entity user\" resource=\""+this.model.getSubject()+"\">"+
                    "<img class=\"icon\" src=\""+this.getIcon()+"\" "+ 
                    "alt=\"User " + this.model.get('sss:label') + "\"/>"+
                    "<div class=\"label\">"+this.model.get('sss:label')+"</div>");

                    //"</div>");
            this.draggable();
            return this;
        },
        _getIcon: function() {
          this.LOG.debug(this.model.getSubject());
          this.LOG.debug(this.model.vie.namespaces.curie(this.model.getSubject()));
          return this.icons[this.model.vie.namespaces.curie(this.model.getSubject())];
        }

    });
});
