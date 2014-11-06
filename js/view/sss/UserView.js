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
            this.$el.html(
                    "<span class=\"glyphicon glyphicon-user\" style=\"font-size:50px;\"></span>"+
                    "<div class=\"userLabel\">"+this.model.get(Voc.label)+"</div>"
                    );

            // Prevent user dragging and dropping
            //this.draggable();
            return this;
        },
        _click: function(e) {
            // This currently prevents user from using entity click event
            return false;
        }

    });
});
