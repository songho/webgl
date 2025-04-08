///////////////////////////////////////////////////////////////////////////////
// Tokenizer.js
// ============
// General purpose string tokenizer
//
// The default delimiters are space(" "), tab(\t, \v), newline(\n),
// carriage return(\r), and form feed(\f).
// If you want to use different delimiters, then use setDelimiter() to override
// the delimiters. Note that the delimiter string can hold multiple characters.
//
//  AUTHOR: Song Ho Ahn (song.ahn@gmail.com)
// CREATED: 2011-12-18
// UPDATED: 2020-09-30
///////////////////////////////////////////////////////////////////////////////

let Tokenizer = function()
{
    this.buffer = "";
    this.token = "";
    this.delimiter = Tokenizer.DEFAULT_DELIMITER;
    this.currPos = 0;
};

///////////////////////////////////////////////////////////////////////////////
// constants
///////////////////////////////////////////////////////////////////////////////
// default delimiter string (space, tab, newline, carriage return, form feed)
Tokenizer.DEFAULT_DELIMITER = " \t\v\n\r\f";


Tokenizer.prototype =
{
    set: function(str, delimiter)
    {
        this.buffer = str;
        this.delimiter = delimiter;
        this.currPos = 0;
        return this;
    },
    setString: function(str)
    {
        this.buffer = str;
        this.currPos = 0;
        return this;
    },
    setDelimiter: function(delimiter)
    {
        this.delimiter = delimiter;
        return this;
    },
    next: function()
    {
        let bufferLength = this.buffer.length;
        if(bufferLength <= 0) return "";   // skip if buffer is empty

        token = "";                         // reset token string

        // skip delimiters
        while(this.currPos != bufferLength
    this->skipDelimiter();                      // skip leading delimiters
    while(currPos != buffer.end() && isDelimiter(*currPos))
        ++currPos;

    // append each char to token string until it meets delimiter
    while(currPos != buffer.end() && !isDelimiter(*currPos))
    {
        token += *currPos;
        ++currPos;
    }
    return token;

    }
};

