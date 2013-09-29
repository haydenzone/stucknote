function Cursor(note) { 
    this.$cursor = $('<div>').attr('id','cursor');
    this.line = 0;
    this.index = 0;
    this.note = note;
    this.absolutePosition = 0;
    var lastIndex = this.index;
    var lastLine = this.line;
    setInterval(function() { 
        if(this.index == lastIndex && this.line == lastLine ) { 
            this.$cursor.toggle(); 
        } else {
            this.$cursor.show();
        }
        lastIndex =this.index;
        lastLine =this.line;
    }.bind(this),700);
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
    getPosition: function() { 
        return { 
            parIndex: this.note.paragraphs.indexOf(this.note.curParagraph()),
            line: this.line,
            index: this.index,
            par: this.note.curParagraph()
        };
    },
    appendTo: function($el) {
        this.$cursor.appendTo($el);
    },
    reloadFromAbsolutePosition: function () {
        var line = 0;
        var index = 0;
        var par = this.note.curParagraph();
        for( var i = 0; i < par.lines.length; i++ ) {
            if ( this.absolutePosition - par.lines[i].text.length > 0) {
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
    endOfLine: function() { 
        var par = this.note.curParagraph();
        var line = par.lines[this.line];
        return this.index == line.text.length;
    },
    cutTextAfter: function() { 
        var par = this.note.curParagraph();
        var line = par.lines[this.line];
        var end = line.text.slice(this.index, line.text.length);
        line.text = line.text.slice(0,this.index); 
        line.renderText();
        return end;
    },
    render: function() { 
        var par = this.note.curParagraph();
        var line = par.lines[this.line];
        if(_.isUndefined(line)) debugger;
        var pos = { 
            left: line.widthToIndex(this.index)+line.$line.position().left,
            top: line.fromTop()
        }
        this.$cursor.css(pos).show();
    },
    moveCursorToLine: function(endLine_i, endPar) { 
        var par = this.note.curParagraph();
        if(!endPar) endPar = par;
        var startLine = par.lines[this.line];
        var endLine = endPar.lines[endLine_i];
        var width = startLine.widthToIndex(this.index);
        this.index = endLine.closestIndex(width);
        this.line = endLine_i;
    },
    moveUp: function() { 
        if(this.line == 0) {
            var parAbove = this.note.parAbove();
            if(parAbove) {
                this.moveCursorToLine(parAbove.lines.length-1, parAbove);
                this.note.setCurParagraph(this.note.currentParagraph-1);
            }
        } else {
            this.moveCursorToLine(this.line-1);
        }
    },
    moveDown: function() {
        var curPar = this.note.curParagraph();
        if(this.line == curPar.lines.length-1) {
            var parBelow = this.note.parBelow();
            if(parBelow) {
                this.moveCursorToLine(0, parBelow);
                this.note.setCurParagraph(this.note.currentParagraph+1);
            }
        } else {
            this.moveCursorToLine(this.line+1);
        }
    },
    move: function(code) {
        switch(code) { 
            case 'up':
                this.moveUp();
                break;
            case 'down':
                this.moveDown();
                break;
            case 'left':
                if(this.index != 0) {
                    this.index--;
                } else if(this.line > 0) {
                    var par = this.note.curParagraph();
                    var line = par.lines[this.line-1];
                    this.index = line.text.length;
                    this.line--;
                } else if(!this.note.isFirstParagraph()) {
                    var tempindex = this.note.parAbove().lastLine().text.length-1;
                    tempindex++;
                    this.moveUp();
                    this.index = tempindex;
                }
                break;
            case 'right':
                var par = this.note.curParagraph();
                var line = par.lines[this.line];
                if(this.index < line.text.length) {
                    this.index++;
                } else if(!this.note.isLastParagraph() ||
                    this.line < par.lines.length-1) {
                    this.index = 0;
                    this.moveDown();
                }
                break;
        }
        return this;

    }
}
