define(['view/sss/EntityView', 'logger', 'jquery', 'voc'], function(EntityView, Logger, $, Voc ){
    return EntityView.extend({
        LOG: Logger.get('OrgaEntityView'),
        events: {
            'contextmenu' : 'detailView' // detailView comes from EntityView
        },
        initialize: function() {
            var resource = this.model.get(Voc.hasResource);
            this.LOG.debug('initialize orgaentitzview', this.model, resource);
            this.resourceView = new EntityView({
                'model': resource
            });
            this.listenTo(resource, 'change', this.render);
            this.resourceView.render();
        },
        getIcon: function() {
            return this.resourceView.getIcon(); 
        },
        render: function() {
            // XXX this function is indirectly coupled to createEntity of organize.js
            this.LOG.debug('render', this.$el.attr('href'), this.getIcon());
            var label = this.resourceView.model.get(Voc.label) || "";
            this.$el.attr('label', label);
            this.$el.find('image').attr('href', this.getIcon());
            this.$el.find('tspan').text(
                    label.length > 15
                    ? label.substring(0,15) + " ..."
                    : label);
            return this;
        },
        setSvgId: function(id) {
            this.LOG.debug('setSvgId', id);
            this.svgId = id;
            this.$el = $('#' + this.svgId);
            //this.resourceView.$el = this.$el;
            this.LOG.debug('setSvgId', this.$el);
        },
        getSvgData: function() {
            return {
                'x' : this.model.get(Voc.x),
                'y' : this.model.get(Voc.y),
                'imageURL' : this.getIcon(),
                'label' : this.resourceView.model.get(Voc.label)
            };
        }
    });
});
