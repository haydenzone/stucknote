function Note($root) { 
    this.$note = $('<div>').appendTo($root);
    this.$note.attr({
        'class': 'note'
    });
    this.cursor = new Cursor(this);
    this.cursor.appendTo(this.$note);
    this.$note.css('position', 'relative');
    this.paragraphs = [];
    this.createParagraph();
    this.currentParagraph = 0;
    this.registerKeyboardListeners();
}

Note.prototype = {
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
            var parCur = this.curParagraph();
            _.each(parCur.lines, function(line) { 
                parAbove.appendLine(line)
            });
            parAbove.rerenderParagraph();
            this.removeParagraph(this.currentParagraph);
            this.currentParagraph--;
            this.cursor.setPosition(newPos).render();
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
