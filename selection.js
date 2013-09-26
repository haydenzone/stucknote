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
    clearSelection: function() { 
        var r = this.linesInRange(this.start,this.end);
        _.each(r[0], function(line) { 
            line.clearHighlight();
        });
    },
    linesInRange: function(start, end) {
        if(end.parIndex < start.parIndex || 
                (end.parIndex == start.parIndex && end.line < start.line) ||
                (end.parIndex == start.parIndex && end.line == start.line && end.index < start.index) ) {
            var temp = start;
            start = end;
            end = temp;
        }
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
            pIndex++;
        });
        return [lines, start, end];
    },
    rerender: function() {
        var results = this.linesInRange(this.start,this.end);
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
