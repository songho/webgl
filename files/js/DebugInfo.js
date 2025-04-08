///////////////////////////////////////////////////////////////////////////////
// DebugInfo.js
// ============
// It stores debugging info of WebGL.
// NOTE:
// It requires to call tick() every frame to accumulate frame count.
// You can change the update interval with setUpdateInterval().
//
//  AUTHOR: Song Ho Ahn (song.ahn@gmail.com)
// CREATED: 2013-09-17
// UPDATED: 2013-09-17
///////////////////////////////////////////////////////////////////////////////

var DebugInfo = function(outputNodeId)
{
    var element = document.getElementById(outputNodeId);
    if(element)
        this.textNode = element.childNodes[0];
    else 
        this.textNode = null;

    this.polygonCount = 0;
    this.vertexCount = 0;
    this.frameCount = 0;
    this.startTime = Date.now();

    // start time event with default interval
    // remember interval ID to stop this time event
    var self = this;
    this.intervalId = setInterval(function(){self.print();}, 1000);
};
FrameRate.prototype =
{
    ///////////////////////////////////////////////////////////////////////////
    // print fps text
    print: function()
    {
        if(!this.textNode) return;
        var fps = this.frameCount * 1000 / (Date.now() - this.startTime);
        this.textNode.nodeValue = "Polygon Count: " + this.polygonCount + "<br />" +
                                  "vertex Count: " + this.vertexCount + "< br />" +
                                  "FPS: " + fps.toFixed(1);
        // reset
        this.startTime = Date.now();
        this.frameCount = 0;
    },
    ///////////////////////////////////////////////////////////////////////////
    // should be called every frame to compute accurate frame rate
    tick: function()
    {
        this.frameCount++;
    },
    ///////////////////////////////////////////////////////////////////////////
    // set update interval
    setUpdateInterval: function(interval)
    {
        clearInterval(this.intervalId); // stop prev interval
        // restart interval with new interval
        var self = this;
        this.intervalId = setInterval(function(){self.print();}, interval);
    }
};
