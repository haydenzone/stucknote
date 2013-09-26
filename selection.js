function Selection(args) { 
    this.start = args.start;
    this.end = args.end;
    this.note = args.note;
}

Selection.prototype = { 
    setEnd: function(end) { 
        this.end = end;
        this.rerender();
    },
    orderBoundaries: function() {
        var start = this.start;
        var end = this.end;
        if(end.parIndex < start.parIndex || 
                (end.parIndex == start.parIndex && end.line < start.line) ||
                (end.parIndex == start.parIndex && end.line == start.line && end.index < start.index) ) {
            var temp = start;
            start = end;
            end = temp;
        }
        return [start, end]
    },
    deleteSelection: function() { 
        var r = this.orderBoundaries();
        var start = r[0];
        var end = r[1];

        var paragraphs = this.note.sliceParagraphs(start.parIndex, end.parIndex+1);
        var pIndex = start.parIndex;
        _.each(paragraphs, function(p) { 
            if(pIndex == start.parIndex && pIndex == end.parIndex) {
                if(start.line == end.line) {
                    p.lines[start.line].removeRange(start.index, end.index);
                    p.lines[start.line].renderText();
                } else { 
                    for(var i = start.line; i < end.line+1; i++) { 
                        var line = p.lines[i];
                        if(i == start.line) {
                            line.removeRange(start.index, line.text.length);
                        } else if( i == end.line ) { 
                            line.removeRange(0, end.index);
                        } else {
                            line.removeRange(0, line.text.length);
                        }
                        line.renderText();
                    }
                }
            } else if(pIndex == start.parIndex) { 
                //lines = lines.concat(p.lines.slice(start.line,p.lines.length));
            } else if(pIndex == end.parIndex) { 
                //lines = lines.concat(p.lines.slice(0,end.line+1));
            } else {
                //lines = lines.concat(p.lines);
            }
            p.rerenderParagraph();
            pIndex++;
        });
    },
    getSelection: function() { 
        var r = this.linesInRange(true);
        var text = "";
        var i = 0;
        var start = r[1];
        var end = r[2];
        if(r[0].length == 1) {
            text += r[0][0].text.slice(start.index, end.index);
        } else {
            _.each(r[0], function(line) { 
                if(i == 0) { 
                    text += line.text.slice(start.index, line.text.length);
                } else if( i == r[0].length-1) {
                    text += line.text.slice(0, end.index);
                } else {
                    text += line.text;
                }
                if(line.hasOwnProperty('last')) {
                    if(i < r[0].length-1) {
                        text += "\n";
                    }
                    delete line.last;
                }
                i++;
            });
        }

        return text;

    },
    clearSelection: function() { 
        var r = this.linesInRange(false);
        _.each(r[0], function(line) { 
            line.clearHighlight();
        });
    },
    linesInRange: function(lastFlag) {
        var r = this.orderBoundaries();
        var start = r[0];
        var end = r[1];
        var paragraphs = this.note.sliceParagraphs(start.parIndex, end.parIndex+1);
        var pIndex = start.parIndex;
        var lines = [];
        _.each(paragraphs, function(p) { 
            if(pIndex == start.parIndex && pIndex == end.parIndex) {
                lines = lines.concat(p.lines.slice(start.line,end.line+1));
            } else if(pIndex == start.parIndex) { 
                lines = lines.concat(p.lines.slice(start.line,p.lines.length));
            } else if(pIndex == end.parIndex) { 
                lines = lines.concat(p.lines.slice(0,end.line+1));
            } else {
                lines = lines.concat(p.lines);
            }
            if(lastFlag) { 
                lines[lines.length-1].last = true;
            }
            pIndex++;
        });
        return [lines, start, end];
    },
    rerender: function() {
        var results = this.linesInRange(false);
        var lines = results[0];
        var start = results[1];
        var end = results[2]
        if(lines.length == 1) { 
            lines[0].highlightRange(start.index, end.index);
        } else { 
            var firstLine = lines[0];
            var lastLine = lines[lines.length-1];
            lines.splice(0,1);
            lines.splice(lines.length-1,1);
            firstLine.highlightRange(start.index, firstLine.text.length);
            _.each(lines, function(line) { 
                line.highlightRange(0, line.text.length);
            });
            lastLine.highlightRange(0, end.index);
        }
    }
}
