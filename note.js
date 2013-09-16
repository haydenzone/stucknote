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
        var newPos = curPar.removeChr(this.cursor.line, this.cursor.index);
        this.cursor.setPosition(newPos).render();

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
