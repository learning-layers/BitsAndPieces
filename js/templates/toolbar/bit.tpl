<div class="toolbarContent toolbarContentBit">

    <h3>Bit</h3>

    <div class="toolbarSection">
        <div class="bitTitle">
            <label>Bit Title:</label>
            <span contenteditable="true"><%= entity.label %></span>
        </div>

        <div>
            <label>Author:</label> <%= entity.author %>
        </div>

        <div>
            <label>Date:</label> <%= entity.creationTime %>
        </div>

        <div>
            <label>Amount of views:</label> <%= entity.views %>
        </div>

        <div style="display:none;">
            <label>Amount of edits:</label> <%= entity.edits %>
        </div>

        <% if ( entity.thumb ) { %>
        <div class="thumbnail">
            <label class="subsectionLabelSmall">Thumbnail</label>
            <img src="<%= entity.thumb %>" alt="thumbnail" />
        </div>
        <% } %>
    </div>

    <div class="toolbarSection">
        <label class="sectionLabel">Properties</label>

        <div class="importance">
            <label class="subsectionLabel">Importance:</label>
            <div class="slider"></div>
            <div class="indicators">
                <img src="img/sss/indicator/importance-low.png"  class="importanceLow" alt="importance-low" />
                <img src="img/sss/indicator/importance-medium.png" class="importanceMedium" alt="importance-medium" />
                <img src="img/sss/indicator/importance-high.png" class="importanceHigh" alt="importance-high" />
                <img src="img/sss/indicator/importance-favourite.png" class="importanceFavourite" alt="importance-favourite" />
            </div>
        </div>

        <div class="tagSearch">
            <label class="subsectionLabel">User's tags:</label>
            <input type="text" value="" placeholder="add new tag" />
        </div>

        <div class="tags">
            <% _.each(entity.tags, function(tag) { %> <div class="tag"><%= tag %><span data-tag="<%= tag %>" class="deleteTag">x</span></div> <% }); %></div>
        </div>

        <div class="predefinedTags">
            <label class="subsectionLabel">Predefined tags:</label>
            <select disabled>
            <% _.each(entity.predefined, function(predefined) { %>
                <option value="<%= predefined %>"><%= predefined %></option>
            <% }); %>
            </select>
        </div>

        <div class="recommendedTags">
            <label>Recommended tags (click to add):</label>
            <div class="tagcloud">
            </div>
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

</div>
