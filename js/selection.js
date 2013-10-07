function Selection(args) { 
    this.start = args.start;
    this.end = args.end;
    this.note = args.note;
}

Selection.prototype = { 
    setEnd: function(end) { 
        var r = this.orderBoundaries();
        var prevStart = r[0];
        var prevEnd = r[1];
        this.end = end;
        r = this.orderBoundaries();
        var curStart = r[0];
        var curEnd = r[1];
        if(this.boundaryLessThan(prevStart,curStart)) { 
            this.clearLines(this.linesInRange(false, {
                start: prevStart,
                end: curStart
            })[0].slice(0,-1));
        }
        if(this.boundaryGreaterThan(prevEnd,curEnd)) {
            this.clearLines(this.linesInRange(false,{
                start: curEnd,
                end: prevEnd
            })[0].slice(1));
        }
        this.rerender();
    },
    clearLines: function(lines) { 
        _.each(lines, function(line) { 
            line.clearHighlight();
        });
    },
    boundaryGreaterThan: function(x,y) { 
        if(x.parIndex > y.parIndex || 
                (x.parIndex == y.parIndex && x.line > y.line) ||
                (x.parIndex == y.parIndex && x.line == y.line && x.index > y.index) ) {
            if(x.parIndex == y.parIndex && x.line == y.line && x.index == y.index) {
                return false;
            }
            return true;
        } else {
            return false;
        }
    },
    boundaryLessThan: function(x,y) { 
        if(x.parIndex < y.parIndex || 
                (x.parIndex == y.parIndex && x.line < y.line) ||
                (x.parIndex == y.parIndex && x.line == y.line && x.index < y.index) ) {
            if(x.parIndex == y.parIndex && x.line == y.line && x.index == y.index) {
                return false;
            }
            return true;
        } else {
            return false;
        }
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
                            line.removeRange(start.index, line.textLength());
                        } else if( i == end.line ) { 
                            line.removeRange(0, end.index);
                        } else {
                            line.removeRange(0, line.textLength());
                        }
                        line.renderText();
                    }
                }
            } else if(pIndex == start.parIndex) { 
                for(var i = start.line; i < p.lines.length; i++) { 
                    var line = p.lines[i];
                    if(i == start.line) {
                        line.removeRange(start.index, line.textLength());
                    } else {
                        line.removeRange(0, line.textLength());
                    }
                    line.renderText();
                }
            } else if(pIndex == end.parIndex) { 
                for(var i = 0; i < end.line+1; i++) { 
                    var line = p.lines[i];
                    if(i == end.line) {
                        line.removeRange(0, end.index);
                    } else {
                        line.removeRange(0, line.textLength());
                    }
                    line.renderText();
                }
            } else {
                p.destroy();
            }
            p.rerenderParagraph();
            pIndex++;
        });
        var pIndex = start.parIndex;
        var paragraphsToRemove = _.map(paragraphs, function(p) { 
            pIndex++;
            if(p.lines.length == 0) { 
                return pIndex-1;
            } else {
                return -1;
            }
        });
        console.log(paragraphsToRemove);
        _.each(paragraphsToRemove.reverse(), function(p) { 
            if(p != -1) {
                this.note.paragraphs.splice(p,1);
            }
        }.bind(this));
        if(paragraphs.length > 1) { 
            var firstPar = paragraphs.slice(0,1)[0];
            var lastPar = paragraphs.slice(-1)[0];
            _.each(lastPar.lines, function(line) { 
                firstPar.appendLine(line);
            });
            firstPar.rerenderParagraph();
            this.note.removeParagraph(this.note.paragraphs.indexOf(lastPar));
        }
    },
    getSelection: function() { 
        var r = this.linesInRange(true, {});
        var text = "";
        var i = 0;
        var start = r[1];
        var end = r[2];
        if(r[0].length == 1) {
            text += r[0][0].textSlice(start.index, end.index);
        } else {
            _.each(r[0], function(line) { 
                if(i == 0) { 
                    text += line.textSlice(start.index, line.textLength());
                } else if( i == r[0].length-1) {
                    text += line.textSlice(0, end.index);
                } else {
                    text += line.getText();
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
        var r = this.linesInRange(false,{});
        _.each(r[0], function(line) { 
            line.clearHighlight();
        });
    },
    linesInRange: function(lastFlag, args) {
        var r = this.orderBoundaries();
        var start = args.start || r[0];
        var end = args.end || r[1];
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
        var results = this.linesInRange(false,{});
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
            firstLine.highlightRange(start.index, firstLine.textLength());
            _.each(lines, function(line) { 
                line.highlightRange(0, line.textLength());
            });
            lastLine.highlightRange(0, end.index);
        }
    }
}
