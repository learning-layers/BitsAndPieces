define(['underscore', 'backbone', 'logger', 'jquery', 'voc',
        'text!templates/sss/activity.tpl',
        'view/sss/EntityView'], function(_, Backbone, Logger, $, Voc, ActivityTemplate, EntityView) {
    return Backbone.View.extend({
        LOG: Logger.get('ActivityView'),
        events: {
        },
        initialize: function(options) {
            this.listenTo(this.model, 'change', this.render);
            this.owner = this.model.get(Voc.author);
            this.listenTo(this.owner, 'change:'+this.model.vie.namespaces.uri(Voc.label), this.render);
        },
        render: function() {
            this.$el.attr({
              'class' : 'activity singleActivity',
              'about' : this.model.getSubject()
            });

            // TODO Need to check author and logged in user
            // And display different text in case current user is the actor
            this.$el.html(_.template(ActivityTemplate, {
                iconClass: 'glyphicon-bell',
                date : $.datepicker.formatDate('dd.mm.yy', new Date(this.model.get(Voc.creationTime))),
                author : this.getOwnerName(),
                episodeLabel : this.getEntityLabel()
            }));
            return this;
        },
        getOwnerName: function() {
            if ( this.owner && this.owner.isEntity ) {
                return this.owner.get(Voc.label);
            }
            return this.owner;
        },
        getEntityLabel: function() {
            // XXX This could fail miserably
            // 1. Entities is an array, so array as a response is possible
            // 2. Entities might not be loaded yet (thus it might create problems)
            // 3. Thre are different activity types
            var entities = this.model.get(Voc.hasEntities);
            if ( entities && entities.isEntity ) {
                return entities.get(Voc.label);
            }
            return entities;
        }
    });
});
