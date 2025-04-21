///////////////////////////////////////////////////////////////////////////////
// ConfigManager.js
// ================
//
//  AUTHOR: Song Ho Ahn (song.ahn@gmail.com)
// CREATED: 2012-01-12
// UPDATED: 2014-10-30
//
// Copyright (C) 2012. Song Ho Ahn
///////////////////////////////////////////////////////////////////////////////

var ConfigItem = function()
{
    this.id = null;
    this.args = []
};

var ConfigManager = function()
{
    this.items = [];
};

ConfigManager.prototype =
{
    read: function(url, callback)
    {
        var self = this;
        callback = callback || function(){};
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.responseType = "text";
        xhr.send();
        xhr.onload = function()
        {
            if(xhr.status == 200) // OK
            {
                self.parse(xhr.response);
                //log("Read " + self.items.length + " config items.");
                callback(self);
            }
            else
            {
                log("[ERROR] Failed to read file(" + xhr.status + "): " + url);
                callback(false);
            }
        };
    },

    parse: function(s)
    {
        this.items.length = 0; // clear
        var currIndex = -1;

        var lines = s.split(/\r\n|\r|\n/);
        for(var i in lines)
        {
            var line = lines[i];

            if(line.charAt(0) == "#")
                continue;

            if(line.charAt(0) == "[")
            {
                var item = new ConfigItem();
                item.id = line.substring(1, line.lastIndexOf("]"));
                this.items.push(item);

                currIndex++;
                continue;
            }

            var key = "";
            var value = "";
            var isKey = true;
            var tokens = line.split(" ");
            for(i in tokens)
            {
                if(tokens[i] == "=")
                {
                    isKey = false;
                    continue;   // skip
                }

                // key/value may contain spaces
                if(isKey)   // get key first
                    key += tokens[i] + " ";
                else        // get value
                    value += tokens[i] + " ";
            }

            // finally, store key/value pair to container
            if(key != "" && value != "")
            {
                // convert key to lower case
                key = key.toLowerCase();

                // remove the last space
                key = key.replace(/\s*$/, "");
                value = value.replace(/\s*$/, "");

                this.items[currIndex].args[key] = value;

                //DEBUG
                //log("ITEM:" + this.items[currIndex].id + ", Key:" + key + ", Value:" + value);
            }
        }
    },

    getItemCount: function()
    {
        return this.items.length;
    },

    getValue: function(index, key)
    {
        return this.items[index].args[key];
    }
};
