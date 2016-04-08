define(['underscore', 'jquery', 'text!../data/help.json', 'text!../js/templates/navbar.tpl', 'text!../js/templates/overview_and_structure.tpl', 'colorbox', 'bootstrap'],
function(_, $, help, NavbarTemplate, OverviewAndStructureTemplate) {
    $(document).ready(function(){
        var helpData = JSON.parse(help),
            appContainerElement = $(document).find('#bnp-help-app'),
            helpText = '',
            navbar = _.template(NavbarTemplate, {}),
            overviewAndStructure = _.template(OverviewAndStructureTemplate, {});

        _.each(helpData.apps, function(app) {
            helpText += '<h2>' + app.title + '</h2>';

            if ( app.alerts && _.isArray(app.alerts) && app.alerts.length > 0 ) {
                _.each(app.alerts, function(single) {
                    helpText += '<div class="alert alert-' + single.type + '">' + single.text + '</div>';
                });
            }

            _.each(app.chapters, function(chapter) {
                helpText += '<h3>' + chapter.title + '</h3>';

                if ( chapter.template && chapter.template === 'overview_and_structure' ) {
                    helpText += overviewAndStructure;
                }

                if ( chapter.videos && _.isArray(chapter.videos) && chapter.videos.length > 0 ) {
                    helpText += '<ul class="list-group">';
                    _.each(chapter.videos, function(video) {
                        var listClasses = ['list-group-item'];

                        if ( video.url === 'NONE' ) {
                            listClasses.push('disabled');
                        }
                        helpText += '<li class="' + listClasses.join(' ') + '">';
                        helpText += '<a href="' + video.url + '" class="youtube">';
                        helpText += '<i class="fa fa-youtube"></i>';
                        helpText += video.title;
                        helpText += '</a>';
                        helpText += '<span class="badge">' + video.duration + '</span>';
                        helpText += '</li>';
                    });
                    helpText += '</ul>';
                }
            });
        });

        appContainerElement.find('.bnp-help-loading').hide();
        appContainerElement.parent().prepend(navbar);
        appContainerElement.append(helpText);

        $('.youtube').colorbox({
            iframe:true,
            innerWidth:560,
            innerHeight:315
        });
    });

    return null;
});
