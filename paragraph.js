function Paragraph() { 
    this.lines = [];
    this.currentLine = 0;
    this.$paragraph = $('<div>');
    this.createLine();
}

Paragraph.prototype = { 
    createLine: function () { 
        var line = new Line();
        this.lines.push(line);
        line.appendTo(this.$paragraph);
    },
    fromTop: function() { 
        return this.$paragraph.position().top;
    },
    appendTo: function ($el) { 
        this.$paragraph.appendTo($el);
    },
    writeToLine: function(line, text) { 
        this.lines[line]._setText(text);
    },
    removeChr: function(line, index) { 
        if(line >= this.lines.length) {
            throw "Paragraph does not have that line";
        }
        if( index == 0 ) {
            line--;
            index = this.lines[line].text.length;
        }
        if(line < 0) { 
            console.log('todo: deal with combining paragraphs');
            return;
        }
        this.lines[line].removeChr(index);
        return { 
            line: line,
            index: index-1
        }
    },
    addChr: function(line,index, chr) {
        if(line >= this.lines.length) {
            throw "Paragraph does not have that line";
        }
        var endOfLine = false;
        if(this.lines[line].text.length == index) {
            endOfLine = true;
        }
        var overflow = chr;
        var pos = {
            index: index+1,
            line: line
        };
        do {
            if(line >= this.lines.length) {
                this.createLine();
            }
            overflow = this.lines[line].addChr(overflow,index);
            if(overflow != "" && endOfLine) {
                pos.index = overflow.length;
                pos.line = line+1;
                endOfLine = false;
            }
            index = 0;
            line++;
        } while(overflow != "");
        return pos;
    }
}
