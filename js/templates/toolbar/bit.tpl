<div class="panel panel-default toolbarContent toolbarContentBit">

<div class="panel panel-default">

    <div class="panel-heading">
        <h3 class="panel-title">Bit</h3>
    </div>

    <div class="panel-body">

        <div class="toolbarSection">
            <div class="form-group bitTitle">
                <label>Bit Title:</label>
                <input type="text" class="form-control" name="title" value="<%= entity.label %>" />
            </div>

            <table>
                <tbody>
                    <tr>
                        <td><label>Author:</label></td>
                        <td class="withPadding"><%= entity.author %></td>
                    </tr>
                    <tr>
                        <td><label>Date:</label></td>
                        <td class="withPadding"><%= entity.creationTime %></td>
                    </tr>
                    <tr>
                        <td><label>Amount of views:</label></td>
                        <td class="withPadding"><%= entity.views %></td>
                    </tr>
                </tbody>
            </table>

            <% if ( entity.thumb ) { %>
            <div>
                <label class="subsectionLabelSmall">Thumbnail</label>
                <div class="thumbnail">
                    <img src="<%= entity.thumb %>" alt="thumbnail" />
                </div>
            </div>
            <% } %>
        </div>
    </div><!-- .panel-body -->
</div><!-- .panel -->

<div class="panel panel-default">

    <div class="panel-heading">
        <h3 class="panel-title">Properties</h3>
    </div>

    <div class="panel-body">

        <div class="toolbarSection">
        <div class="importance">
            <label class="subsectionLabel">Importance:</label>
            <div class="slider"></div>
            <div class="indicators">
                <span class="importanceLow">!</span>
                <span class="importanceMedium">!!</span>
                <span class="importanceHigh">!!!</span>
                <span class="glyphicon glyphicon-star-empty importanceFavourite"></span>
            </div>
        </div>

        <br />

        <div class="form-group tagSearch">
            <label>User's tags:</label>
            <input class="form-control" type="text" value="" placeholder="add new tag" />
        </div>

        <div class="tags">
            <% _.each(entity.tags, function(tag) { %> <div class="badge tag"><%= tag %> <span data-tag="<%= tag %>" class="glyphicon glyphicon-remove-circle deleteTag"></span></div> <% }); %></div>
        </div>

        <br />

        <div class="recommendedTags">
            <label>Recommended tags (click to add):</label>
            <div class="tagcloud">
            </div>
        </div>

        <br />

        <div class="form-group predefinedTags">
            <label class="subsectionLabel">Predefined tags:</label>
            <select class="form-control" disabled>
            <% _.each(entity.predefined, function(predefined) { %>
                <option value="<%= predefined %>"><%= predefined %></option>
            <% }); %>
            </select>
        </div>

    </div>

    <!--div class="toolbarSection">
        <div>
            <label class="subsectionLabel">Associated tasks:</label>
            <input disabled type="button" value="Create new task" />
        </div>

        <div class="deadline">
            <label class="subsectionLabel">Deadline to work with:</label>
            <input type="text" value="" class="datepicker" placeholder="Select a date" disabled="disabled" />
            <a href="#" class="clearDatepicker">[X]</a>
        </div>

        <div class="annotations">
            <label class="subsectionLabelSmall">Annotations:</label>
            <textarea disabled="disabled"></textarea>
            <input type="button" value="Add new" disabled="disabled" />
        </div>
    </div-->

    </div><!-- .panel-body -->

</div><!-- .panel -->

</div>
