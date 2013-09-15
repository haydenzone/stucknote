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
