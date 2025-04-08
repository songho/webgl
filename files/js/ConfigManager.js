///////////////////////////////////////////////////////////////////////////////
// ConfigManager.js
// ================
// - store key/value pairs to an associative array of each item.
// - each item has an id
// - the key is always lowercase
//
//  AUTHOR: Song Ho Ahn (song.ahn@gmail.com)
// CREATED: 2012-01-12
// UPDATED: 2020-09-30
//
// Copyright (C) 2012. Song Ho Ahn
///////////////////////////////////////////////////////////////////////////////

let ConfigItem = function()
{
    this.id = null;
    this.args = {}; // associative array (key,value)
};

let ConfigManager = function()
{
    this.items = [];
};

ConfigManager.prototype =
{
    read: function(url, callback)
    {
        let self = this;
        callback = callback || function(){};
        let xhr = new XMLHttpRequest();
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
        let currIndex = -1;
        let line;

        let lines = s.split(/\r\n|\r|\n/);
        for(let i = 0, c = lines.length; i < c; ++i)
        {
            line = lines[i];
            if(line.charAt(0) == "#")
                continue;

            if(line.charAt(0) == "[")
            {
                let item = new ConfigItem();
                item.id = line.substring(1, line.lastIndexOf("]"));
                this.items.push(item);

                currIndex++;
                continue;
            }

            let key = "";
            let value = "";
            let isKey = true;
            let tokens = line.split(" ");
            for(let j = 0, tc = tokens.length; j < tc; ++j)
            {
                if(tokens[j] == "=")
                {
                    isKey = false;
                    continue;   // skip
                }

                // key/value may contain spaces
                if(isKey)   // get key first
                    key += tokens[j] + " ";
                else        // get value
                    value += tokens[j] + " ";
            }

            // remove the last space
            key = key.replace(/\s*$/, "");
            value = value.replace(/\s*$/, "");

            // finally, store key/value pair to container
            if(key != "")
            {
                // convert key to lower case
                key = key.toLowerCase();

                this.items[currIndex].args[key] = value;

                //DEBUG
                //log("ITEM:" + this.items[currIndex].id + ", Key:" + key + ", Value:" + value + ";");
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
