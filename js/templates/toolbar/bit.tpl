<div>
    Bit title: <%= entity.label %>
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

<div>
    <label>Amount of edits:</label> <%= entity.edits %>
</div>

<div>
    Thumbnail
</div>

<div class="properties">
    Properties

    <div class="tag-search">
        <label>User's tags:</label>
        <input type="text" value="" placeholder="add new tag" />
    </div>

    <div class="tags">
    <% _.each(entity.tags, function(tag) { %> <div class="tag"><%= tag %><span data-tag="<%= tag %>" class="deleteTag">x</span></div> <% }); %></div>
    </div>    

    <div class="predefined-tags">
        <label>Predefined tags:</label>
        <select disabled>
        <% _.each(entity.predefined, function(predefined) { %>
            <option value="<%= predefined %>"><%= predefined %></option>
        <% }); %>
        </select>
    </div>

    <div class="importance">
        <label>Importance:</label>
        <div class="slider"></div>
    </div>

    <div>
        <label>Associated tasks:</label>
        <input disabled type="button" value="Create new task" />
    </div>

    <div class="deadline">
        <label>Deadline to work with:</label>
        <input type="text" value="" class="datepicker" placeholder="--/--/--" />
    </div>

    <div>
        Annotations:
        <textarea></textarea>
        <input type="button" value="Add new" />
    </div>
</div>