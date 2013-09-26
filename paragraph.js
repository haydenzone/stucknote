function Paragraph() { 
    this.lines = [];
    this.currentLine = 0;
    this.$paragraph = $('<div>').attr('class','paragraph');
    this.createLine();
}

Paragraph.prototype = { 
    destroy: function() { 
        this.$paragraph.remove();
        this.lines = [];
    },
    obliterate: function() { 
        _.each(this.lines, function(line) { 
            line.destory();
        });
        this.destroy();
    },
    createLine: function () { 
        var line = new Line(this);
        this.appendLine(line);
    },
    lineClicked: function(line, index, from) { 
        var line_i = this.lines.indexOf(line);
        this.$paragraph.trigger("lineClicked", [line_i, index, from]);
    },
    lastLine: function() { 
        return this.lines[this.lines.length-1];
    },
    appendLine: function(line) { 
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
    appendText: function(text) { 
        this.lines[this.lines.length-1].text += text;
        this.pushforwardLinesAfter(this.lines.length-1,true);
    },
    rerenderParagraph: function() { 
        var deficit = 0;
        for(var i = 0; i < this.lines.length; i++) {
            deficit = this.lines[i].calculateDeficit();
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
            while(slice != "" || this.lines[line_i+1].text.length == 0) { 
                this.lines[line_i].appendTextAndRerender(slice);
                while(this.lines[line_i].calculateDeficit() > 0 && this.lines[line_i+1].text.length == 0) {
                    var deficit = this.lines[line_i].calculateDeficit();
                    this.removeLine(line_i+1);
                    if(line_i + 1 >= this.lines.length) break;
                    slice = this.lines[line_i+1].sliceFromFront(deficit);
                    this.lines[line_i].appendTextAndRerender(slice);
                }
                if( this.lines.length <= line_i+1) break;
                this.lines[line_i+1].renderText();
                if( this.lines.length <= line_i+2) break;
                deficit = this.lines[line_i+1].calculateDeficit();
                slice = this.lines[line_i+2].sliceFromFront(deficit);
                line_i++;
            }

        }
        return line_i;
    },
    pushforwardLinesAfter: function(line,forwardScan) {
        if(!forwardScan) forwardScan = false;
        var overflow = "";
        do {
            overflow = this.lines[line].spliceOverflow(forwardScan);
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
        this._clearTrailingBlankLines(line);
        
        return { 
            line: line,
            index: index-1
        }
    },
    removeLine: function(line_i) { 
        this.lines[line_i].destory();
        this.lines.splice(line_i,1);
    },
    _clearTrailingBlankLines: function(line) { 
        line_i = this.lines.length-1;
        while(this.lines[line_i].text == "" && line_i > line) {
            this.removeLine(line_i);
            line_i--;
        }
    },
    addChr: function(line,index, chr) {
        if(line >= this.lines.length) {
            throw "Paragraph does not have that line";
        }
        var endOfLine = false;
        if(this.lines[line].text.length <= index) {
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
