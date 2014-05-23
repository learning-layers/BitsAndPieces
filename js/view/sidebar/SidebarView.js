define(['logger', 'tracker', 'underscore', 'jquery', 'backbone', 'voc', 
        'view/sidebar/BitSidebarView', 'view/sidebar/SearchSidebarView',
        'text!templates/sidebar/sidebar.tpl'], function(Logger, tracker, _, $, Backbone, Voc, BitSidebarView, SearchSidebarView, SidebarTemplate){
    return Backbone.View.extend({
        subViews: {},
        tabMap : {
            'notification' : 0,
            'search' : 1,
            'bit' : 2,
            'episode' : 3
        },
        events: {
            'click .sidebar-handle': 'showHide'
        },
        LOG: Logger.get('SidebarView'),
        initialize: function() {
            this.is_hidden = true;
            this.$el.addClass('sidebarHidden');
        },
        showBit: function(entity) {
            this.subViews['bit'].setEntity(entity);
            this.$el.find('#tabs').tabs("option", "active", this.tabMap['bit']);
            if( this.isHidden() ) this.showHide();
        },
        render: function() {
            var tabs = _.template(SidebarTemplate, {});
            this.$el.html(tabs);
            this.$el.find('#tabs').tabs();

            this.subViews['search'] = new SearchSidebarView({
                el : this.getTabId('search')
            });
            this.subViews['search'].render();

            this.subViews['bit'] = new BitSidebarView({
                el : this.getTabId('bit')
            });
            this.subViews['bit'].render();
        },
        showHide: function(e) {
            var sidebar = this;
            if (this.isHidden()) {
                this.$el.switchClass('sidebarHidden', 'sidebarShown', function() {
                    sidebar.is_hidden = false;
                });
            } else {
                this.$el.switchClass('sidebarShown', 'sidebarHidden', function() {
                    sidebar.is_hidden = true;
                });
            }
        },
        isHidden: function() {
            return this.is_hidden;
        },
        getTabId: function(key) {
            return '#tab-' + this.tabMap[key];
        },
    });
});
