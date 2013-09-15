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
    },
    rerenderLinesAfter: function(line) {
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
        var deficit = this.lines[line].removeChr(index);
        if(this.lines.length > line + 1) {
            var line_i = line;
            var slice = this.lines[line_i+1].sliceFromFront(deficit);
            while(slice != "") { 
                this.lines[line_i].appendTextAndRerender(slice);
                this.lines[line_i+1].renderText();
                if( this.lines.length <= line_i+2) break;
                deficit = this.lines[line_i+1].calculateDeficit();
                slice = this.lines[line_i+2].sliceFromFront(deficit);
                line_i++;
            }

            //Clear out any empty lines at end
            this.clearTrailingBlankLines();
        }
        
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
