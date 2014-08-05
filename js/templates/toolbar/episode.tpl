<div class="toolbarContent toolbarContentEpisode">

    <h3>Episode</h3>

    <div class="toolbarSection">
        <div>
            <label>Episode Title:</label>
            <input type="text" name="label" value="<%= entity.label %>" />
        </div>

        <div>
            <label>Description</label>
            <textarea name="description"><%= entity.description %></textarea>
        </div>

        <div class="shareEpisode">
            <label>Share Episode:</label>

            <div>
                <input type="radio" id="coediting" name="sharetype" value="coediting" checked="checked" />
                <label for="coediting">For co-editing</label>
                <br />
                <input type="radio" id="separatecopy" name="sharetype" value="separatecopy" />
                <label for="separatecopy">As a separate copy</label>
            </div>

            <div>
                <label>Selected bits only</label>
                <input type="checkbox" name="onlyselected" value="1" disabled="disabled" />
            </div>

            <div>
                <label>Share with:</label>
                <input type="text" name="sharewith" value="" />
            </div>

            <div>
                <label>Sharing notification text:</label>
                <textarea name="notificationtext"></textarea>
            </div>

            <div>
                <label>Share to folder:</label>
                <select name="sharetofolder" disabled="disabled">
                    <option value="None">None</option>
                </select>
            </div>

            <input type="button" name="share" value="Share" class="shareButton" />
        </div>
    </div>

    <div class="toolbarSection toolbarSectionEpisodes">
        <div>
            <label>Open Episode:</label>
            <input type="text" name="search" value="" placeholder="search" />
        </div>

        <div class="myEpisodes">
            <label>My Episodes</label>
            <ul class="episodeListing">
            </ul>
        </div>
    </div>

</div>
