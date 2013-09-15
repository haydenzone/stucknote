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
        this.paragraphs.push(par);
        par.appendTo(this.$note);
    },
    curParagraph: function() { 
        return this.paragraphs[this.currentParagraph];
    },
    charInput: function(e, chr) { 
        var curPar = this.paragraphs[this.currentParagraph];
        var newPos = curPar.addChr(this.cursor.line, this.cursor.index,chr);
        this.cursor.setPosition(newPos).render();
    },
    registerKeyboardListeners: function() { 
        $(document).on('charInput', this.charInput.bind(this));
    }
}
