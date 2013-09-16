function Cursor(note) { 
    this.$cursor = $('<div>').attr('id','cursor');
    this.line = 0;
    this.index = 0;
    this.note = note;
    this.absolutePosition = 0;
}
Cursor.UP = 0;
Cursor.DOWN = 1;
Cursor.LEFT = 2;
Cursor.RIGHT = 3;
Cursor.prototype = { 
    setPosition: function(pos) {
        this.line = pos.line;
        this.index = pos.index;
        return this;
    },
    appendTo: function($el) {
        this.$cursor.appendTo($el);
    },
    reloadFromAbsolutePosition: function () {
        var line = 0;
        var index = 0;
        var par = this.note.curParagraph();
        for( var i = 0; i < par.lines.length; i++ ) {
            if ( this.absolutePosition - par.lines[i].text.length >= 0) {
                this.absolutePosition -= par.lines[i].text.length;
            } else { 
                index = this.absolutePosition;
                line = i;
                break;
            }
        }
        this.line = line;
        this.index = index;
        return this;
    },
    saveAbsolutePosition: function () { 
        this.absolutePosition = 0;
        var par = this.note.curParagraph();
        for( var i = 0; i < this.line; i++) {
            this.absolutePosition += par.lines[i].text.length;
        }
        this.absolutePosition += this.index;
    },
    render: function() { 
        var par = this.note.curParagraph();
        var line = par.lines[this.line];
        var pos = { 
            left: line.widthToIndex(this.index),
            top: line.fromTop()
        }
        this.$cursor.css(pos);
    },
    move: function(code) {
        switch(code) { 
            case 'up':
                this.line--;
                //todo: bound check
                break;
            case 'down':
                this.line++;
                break;
            case 'left':
                this.index--;
                break;
            case 'right':
                this.index++;
                break;
        }
        return this;

    }
}
