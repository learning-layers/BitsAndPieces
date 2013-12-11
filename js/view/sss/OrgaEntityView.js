define(['view/sss/EntityView', 'logger', 'jquery'], function(EntityView, Logger, $ ){
    return EntityView.extend({
        LOG: Logger.get('OrgaEntityView'),
        events: {
            'contextmenu' : 'detailView' // detailView comes from EntityView
        },
        initialize: function() {
            var resource = this.model.get('sss:resource');
            this.LOG.debug('initialize orgaentitzview', this.model);
            resource.fetch();
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
            this.LOG.debug('render', this.$el.attr('href'), this.getIcon());
            this.$el.attr('href', this.getIcon());
            return this;
        },
        setSvgId: function(id) {
            this.LOG.debug('setSvgId', id);
            this.svgId = id;
            this.$el = $('#' + this.svgId);
            this.LOG.debug('setSvgId', this.$el);
        }
    });
});
