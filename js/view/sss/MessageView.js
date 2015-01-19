define(['underscore', 'backbone', 'logger', 'jquery', 'voc',
        'utils/DateHelpers',
        'data/sss/MessageData',
        'text!templates/sss/message.tpl',
        'view/sss/EntityView'], function(_, Backbone, Logger, $, Voc, DateHelpers, MessageData, MessageTemplate, EntityView) {
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
            var that = this;
            this.$el.attr({
              'class' : 'message singleEntry singleMessage',
              'about' : this.model.getSubject()
            });

            if ( !this.model.get(Voc.isRead) ) {
                this.$el.addClass('unreadMessage');
            }

            this.$el.html(_.template(MessageTemplate, {
                date : DateHelpers.formatTimestampDateDMYHM(this.model.get(Voc.creationTime)),
                author : this.getOwnerName(),
                message : this.model.get(Voc.content)
            }));

            if ( !this.model.get(Voc.isRead) ) {
                this.$el.addClass('unreadMessage');
                this.$el.find('.messageIcon span').on('click', function(e) {
                    var promise = MessageData.markAsRead(that.model);

                    promise.done(function() {
                        var ev = $.Event('bnp:markMessageAsRead', {
                            entity: that.model
                        });
                        that.$el.trigger(ev);
                        // View updates automatically when model attribute value changes
                    });
                });
            }

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
