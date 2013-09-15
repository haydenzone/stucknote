function Cursor(note) { 
    this.$cursor = $('<div>').attr('id','cursor');
    this.line = 0;
    this.index = 0;
    this.note = note;
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
    render: function() { 
        var par = this.note.curParagraph();
        var line = par.lines[this.line];
        var pos = { 
            left: line.widthToIndex(this.index),
            top: line.fromTop()+par.fromTop()
        }
        this.$cursor.css(pos);
    },
    move: function(code) {
        switch(code) { 
            case Cursor.UP:
                this.line--;
                //todo: bound check
                break;
            case Cursor.DOWN:
                this.line++;
                break;
            case Cursor.LEFT:
                this.index--;
                break;
            case Cursor.RIGHT:
                this.index++;
                break;
        }

    }
}
