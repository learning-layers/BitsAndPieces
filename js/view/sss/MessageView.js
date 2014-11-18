define(['underscore', 'backbone', 'logger', 'jquery', 'voc',
        'text!templates/sss/message.tpl',
        'view/sss/EntityView'], function(_, Backbone, Logger, $, Voc, MessageTemplate, EntityView) {
    return Backbone.View.extend({
        LOG: Logger.get('MessageView'),
        events: {
        },
        initialize: function(options) {
            this.listenTo(this.model, 'change', this.render);
            this.owner = this.model.get(Voc.belongsToUser);
            this.listenTo(this.owner, 'change:'+this.model.vie.namespaces.uri(Voc.label), this.render);
        },
        render: function() {
            this.$el.attr({
              'class' : 'message singleMessage',
              'about' : this.model.getSubject()
            });

            this.$el.html(_.template(MessageTemplate, {
                date : $.datepicker.formatDate('dd.mm.yy', new Date(this.model.get(Voc.creationTime))),
                author : this.getOwnerName(),
                message : this.model.get(Voc.content)
            }));
            return this;
        },
        getOwnerName: function() {
            if ( this.owner && this.owner.isEntity ) {
                return this.owner.get(Voc.label);
            }
            return this.owner;
        }
    });
});
