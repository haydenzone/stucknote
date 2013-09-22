function Note($root) { 
    this.$note = $('<div>').appendTo($root);
    this.$note.attr({
        'class': 'note'
    });
    this.$copyHack = $('<input>').attr({
        'type':'input',
        'value':'blah'
    }).css({
        'height': 1,
        'width': 1,
        'position':'absolute',
        'left': -20
    }).appendTo($('body'));
    this.cursor = new Cursor(this);
    this.cursor.appendTo(this.$note);
    this.$note.css('position', 'relative');
    this.paragraphs = [];
    this.createParagraph();
    this.currentParagraph = 0;
    this.registerKeyboardListeners();
    this.registerListeners();
    this.selection = {};
    this.clickStart = {}
}

Note.prototype = {
    registerListeners: function() { 
        this.$copyHack.bind('cut', function(e) {
            console.log('cut');
            e = e.originalEvent;
            e.clipboardData.setData('Text', 'fuck yeah cutting');
            
            return false
        });
        this.$copyHack.bind('copy', function(e) {
            e = e.originalEvent;
            e.clipboardData.setData('Text', 'fuck yeah copying');
            console.log('copy');
            
            return false
        });
        this.$copyHack.bind('paste', function(e) {
            console.log('paste');
            e = e.originalEvent;
            var pastedText = undefined;
            if (window.clipboardData && window.clipboardData.getData) { // IE
                pastedText = window.clipboardData.getData('Text');
            } else if (e.clipboardData && e.clipboardData.getData) {
                pastedText = e.clipboardData.getData('text/plain');
            }
            console.log(pastedText); // Process and handle text...
            console.log(this.selecting());
            return false;
        }.bind(this));
        $(document).mousedown(function() { 
            this.selection = {};
        }.bind(this));

    },
    selecting: function() { 
        return this.selection.hasOwnProperty('start');
    },
    createParagraph: function() { 
        var par = new Paragraph();
        if(this.hasOwnProperty('currentParagraph')) {
            var i = this.currentParagraph+1;
        } else {
            var i = 0
        }
        this.paragraphs.splice(i, 0, par);
        if(i == 0) {
            par.appendTo(this.$note);
        } else {
            this.paragraphs[i-1].$paragraph.after(par.$paragraph)
        }
        par.$paragraph.on("lineClicked", function(e, line, index,from) { 
            if(from == "down") {
                console.log('down');
                this.clickStart = {
                    line: line,
                    index: index,
                    par: par
                };
            } else if(from == "move") { 
                if( !$.isEmptyObject(this.clickStart) &&(this.clickStart.line != line || this.clickStart.index != index || this.clickStart.par != par)) {
                    console.log('selecting stuff!');

                }
            } else if(from == "up") { 
                console.log('up');
                console.log(this.clickStart);
                if(this.clickStart.line == line && this.clickStart.index == index) {
                    console.log('setting cursor position');
                    this.setCurParagraph(this.paragraphs.indexOf(par));
                    console.log(line,index);
                    this.cursor.setPosition({
                        line: line,
                        index: index
                    }).render();
                } else { //finish selection
                    console.log('finish selection');
                    this.selection = {
                        start: this.clickStart,
                        end: {
                            line: line,
                            index: index,
                            par: this.paragraphs.indexOf(par)
                        }
                    };
                    console.log(this.selection);
                    this.$copyHack[0].select();
                }
                this.clickStart = {};
            } 
        }.bind(this));

    },
    curParagraph: function() { 
        return this.paragraphs[this.currentParagraph];
    },
    parBelow: function() { 
        if(this.currentParagraph != this.paragraphs.length-1) {
            return this.paragraphs[this.currentParagraph+1];
        } else {
            return null;
        }
    },
    parAbove: function() { 
        if(this.currentParagraph != 0) {
            return this.paragraphs[this.currentParagraph-1];
        } else {
            return null;
        }
    },
    setCurParagraph: function(i) { 
        this.currentParagraph = i;
    },
    isFirstParagraph: function() { 
        return this.currentParagraph == 0;
    },
    isLastParagraph: function() { 
        return this.paragraphs.length-1 == this.currentParagraph;
    },
    rerender: function() { 
        this.cursor.saveAbsolutePosition();
        _.each(this.paragraphs, function(p) { 
            p.rerenderParagraph();
        });
        this.cursor.reloadFromAbsolutePosition().render();
    },
    charInput: function(e, chr) { 
        var curPar = this.paragraphs[this.currentParagraph];
        var newPos = curPar.addChr(this.cursor.line, this.cursor.index,chr);
        this.cursor.setPosition(newPos).render();
    },
    backspace: function(e) { 
        var curPar = this.paragraphs[this.currentParagraph];
        //Check if deleting at front of paragraph
        if(this.cursor.line == 0 && this.cursor.index == 0 ) {
            if(this.currentParagraph == 0) {
                return;
            }
            var parAbove = this.parAbove();
            var newPos = { 
                line: parAbove.lines.length-1,
                index: parAbove.lines[parAbove.lines.length-1].text.length
            };
            this.currentParagraph--;
            this.cursor.setPosition(newPos);
            this.cursor.saveAbsolutePosition();
            this.currentParagraph++;
            var parCur = this.curParagraph();
            _.each(parCur.lines, function(line) { 
                parAbove.appendLine(line)
            });
            parAbove.rerenderParagraph();
            this.removeParagraph(this.currentParagraph);
            this.currentParagraph--;
            this.cursor.reloadFromAbsolutePosition();
            this.cursor.render();
        } else {
            var newPos = curPar.removeChr(this.cursor.line, this.cursor.index);
            this.cursor.setPosition(newPos).render();
        }

    },
    removeParagraph: function(index) { 
        this.paragraphs[index].destroy();
        this.paragraphs.splice(index,1);
    },
    arrow: function(e, direction) { 
        this.cursor.move(direction).render();
    },
    enter: function(e) { 
        this.createParagraph();
        var parBelow = this.parBelow();
        if(!this.cursor.endOfLine()) { 
            var restOfLine = this.cursor.cutTextAfter();
            parBelow.writeToLine(0,restOfLine);
        }
        var curLines = this.curParagraph().lines;
        _.each(curLines.splice(this.cursor.line+1,curLines.length-this.cursor.line), function(line) { 
            parBelow.appendLine(line)
        });
        this.currentParagraph++;
        this.cursor.setPosition({
            line: 0,
            index: 0
        }).render();
    },
    registerKeyboardListeners: function() { 
        $(document).on('charInput', this.charInput.bind(this));
        $(document).on('backspace', this.backspace.bind(this));
        $(document).on('arrow', this.arrow.bind(this));
        $(document).on('enter', this.enter.bind(this));
    }
}
