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
