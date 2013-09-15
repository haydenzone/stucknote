function Paragraph() { 
    this.lines = [];
    this.currentLine = 0;
    this.$paragraph = $('<div>').attr('class','paragraph');
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
    rerenderParagraph: function() { 
        var deficit = 0;
        for(var i = 0; i < this.lines.length; i++) {
            deficit = this.lines[i].calculateDeficit();
            debugger;
            if(deficit > 0) { 
                i = this.pullbackLinesAfter(i);
            } else if (deficit < 0) {
                i = this.pushforwardLinesAfter(i);
            }
        }
    },
    pullbackLinesAfter: function(line) {
        var deficit = this.lines[line].calculateDeficit();
        var line_i = line;
        if(this.lines.length > line + 1) {
            var slice = this.lines[line_i+1].sliceFromFront(deficit);
            while(slice != "") { 
                this.lines[line_i].appendTextAndRerender(slice);
                this.lines[line_i+1].renderText();
                if( this.lines.length <= line_i+2) break;
                deficit = this.lines[line_i+1].calculateDeficit();
                slice = this.lines[line_i+2].sliceFromFront(deficit);
                line_i++;
            }

        }
        return line_i;
    },
    pushforwardLinesAfter: function(line) {
        var overflow = "";
        do {
            overflow = this.lines[line].spliceOverflow();
            line++;
            if(overflow != "") {
                if(line >= this.lines.length) {
                    this.createLine();
                }
                this.lines[line].addChr(overflow,0 /*index*/);
            }
        } while(overflow != "");
        return line;
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
        this.pullbackLinesAfter(line);
        //Clear out any empty lines at end
        this.clearTrailingBlankLines();
        
        return { 
            line: line,
            index: index-1
        }
    },
    clearTrailingBlankLines: function() { 
        line_i = this.lines.length-1;
        while(this.lines[line_i].text == "") {
            this.lines[line_i].destory();
            this.lines.splice(this.lines.length-1,1);
            line_i--;
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
        this.lines[line].addChr(chr,index);
        var pos = {
            index: index+1,
            line: line
        };
        var overflow = this.lines[line].getOverflow();
        if (endOfLine && overflow.length > 0) { 
            pos.index = overflow.length;
            pos.line = line+1;
        }
        this.pushforwardLinesAfter(line);
        return pos;
    }
}
