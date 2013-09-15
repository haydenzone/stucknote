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
        var overflow = chr;
        do {
            if(line >= this.lines.length) {
                this.createLine();
            }
            overflow = this.lines[line].addChr(overflow,index);
            index = 0;
            line++;
        } while(overflow != "");
    }
}
