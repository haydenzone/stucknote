function Line() { 
    this.text = "";
    this.$line = $('<div>');
    this.$text = $('<span>').appendTo(this.$line);
    this.paddingRight = 5;
}
Line.charWidthLookUp = {};
Line.strWidth = function(str) {
    var width = 0;
    _.each(str, function(chr) {
        if(!Line.charWidthLookUp.hasOwnProperty(chr)) {
            var $span = $('<span>');
            if(chr == " ") chr = "&nbsp;";
            $span.html(chr);
            $span.appendTo($('body'));
            var width_ = $span.width();
            $span.remove();
            Line.charWidthLookUp[chr] = width_;
        }
        width += Line.charWidthLookUp[chr];
    });
    return width;
}
Line.prototype = {
    appendTo: function($el) { 
        this.$line.appendTo($el);
    },
    renderText: function() { 
        var textHtml = this.text;
        textHtml = _.escape(textHtml);
        textHtml = textHtml.replace(/ /g, "&nbsp;");
        this.$text.html(textHtml);
    },
    spliceOverflow: function() { 
        var lineWidth = this.$line.width()-this.paddingRight;
        var textWidth = Line.strWidth(this.text);
        var overflow = "";
        var i = this.text.length - 1;
        while(textWidth > lineWidth && i >= 0) {
            overflow = this.text[i] + overflow;
            textWidth -= Line.strWidth(this.text[i]);
            i--;
        }
        this.text = this.text.slice(0, this.text.length-overflow.length);
        return overflow;
    },

    addChr: function(chr,index) { 
        var text = this.text;
        this.text = text.slice(0,index);
        this.text += chr;
        this.text +=  text.slice(index,text.length)
        this.renderText();
        return this.spliceOverflow();
    },
    removeChr: function(index) {
        var text = this.text;
        this.text = text.slice(0,index-1);
        this.text +=  text.slice(index,text.length)
        this.renderText();
    },
    _setText: function(text) { 
        this.text = text; 
        this.$text.text(text);
    }
}
