function Line(paragraph) { 
    this.paragraph = paragraph;
    this._text = "";
    this.$line = $('<div>').attr('class','line');
    this.$text = $('<span>').appendTo(this.$line);
    this.paddingRight = 5;
    this.registerClickHandler();
    this.$highlight = null;
    this.highlight = {
        start: null,
        end: null
    }
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
    destory: function() { 
        this.$line.remove();
    },
    registerClickHandler: function() {
        var self = this;
        function getHandler(from) {
            return function(e) { 
                var hasOffset = e.originalEvent.hasOwnProperty('offsetX');
                e.offsetX = hasOffset ? e.offsetX : e.originalEvent.layerX;
                e.offsetY = hasOffset ? e.offsetY : e.originalEvent.layerY;
                var index = this.closestIndex(e.offsetX);
                this.paragraph.lineClicked(this,index,from); //I feel like there is a more correct way to do this
            }.bind(self);
        }
        this.$line.mouseup(getHandler('up'));
        this.$line.mousemove(getHandler('move'));
        this.$line.mousedown(getHandler('down'));

    },
    specs: function() { 
        var specs = this.$text.position();
        $.extend(specs, {
            width: this.$text.height(),
            height: this.$text.width()
        });
        return specs;
    },
    removeRange: function(start,end) {
        var text = this._text;
        var newText = ""
        newText = text.slice(0,start);
        newText += text.slice(end,text.length);
        this._setText(newText);
    },
    clearHighlight: function() {
        this.$highlight.remove();
        this.highlight.start = null;
        this.highlight.end = null;
        this.$highlight = null;
    },
    highlightRange: function(start, end) { 
        if(!this.$highlight) {
            this.$highlight = $('<div>').css({
                'display':'inline-block',
                'position':'absolute',
                'height': this.$text.height(),
                'pointer-events':'none'
            }).attr('class','highlight').appendTo(this.$line);
        }
        if(this.highlight.start == start && this.highlight.end == end) return;
        var left = this.widthToIndex(start);
        this.$highlight.css({
            'width':this.widthToIndex(end)-left
        });

        if(this.highlight.start == start) return;
        this.$highlight.css({
            'top':0,
            'left': left
        });
        this.highlight.start = start;
        this.highlight.end = end;
    },
    appendTo: function($el) { 
        this.$line.appendTo($el);
    },
    fromTop: function() { 
        return this.$line.position().top;
    },
    widthToIndex: function(index) { 
        var temp = this._text.slice(0, index);
        return Line.strWidth(temp);
    },
    closestIndex: function(width) { 
        var widthToHere = 0;
        for(var i = 0; i < this._text.length; i++) { 
            var chr = this._text[i];
            var charWidth = Line.strWidth(chr);
            if( widthToHere + charWidth > width ) { 
                if( Math.abs( widthToHere - width) > Math.abs( widthToHere +charWidth -width) ) {
                    return i+1;
                } else {
                    return i;
                }
            }
            widthToHere += charWidth;
        }
        return i;
    },
    renderText: function() { 
        var textHtml = this._text;
        textHtml = _.escape(textHtml);
        textHtml = textHtml.replace(/ /g, "&nbsp;");
        this.$text.html(textHtml);
    },
    getOverflow: function(forwardScan) { 
        if(!forwardScan) forwardScan = false;
        var lineWidth = this.$line.width()-this.paddingRight;
        var overflow = "";
        if(forwardScan) { 
            var textWidth = 0;
            var i = 0;
            while(textWidth + Line.strWidth(this._text[i]) < lineWidth && i < this._text.length) {
                textWidth += Line.strWidth(this._text[i]);
                i++;
            }
            overflow = this._text.slice(i,this._text.length);
        } else { //backward scan
            var textWidth = Line.strWidth(this._text);
            var i = this._text.length - 1;
            while(textWidth > lineWidth && i >= 0) {
                overflow = this._text[i] + overflow;
                textWidth -= Line.strWidth(this._text[i]);
                i--;
            }
        }
        return overflow;
    },
    spliceOverflow: function(forwardScan) { 
        if(!forwardScan) forwardScan = false;
        var overflow = this.getOverflow(forwardScan);
        this._setText(this._text.slice(0, this._text.length-overflow.length));
        this.renderText();
        return overflow;
    },

    textKeepSlice: function(start,end) { 
        this._setText(this._text.slice(start,end));
    },

    textSlice: function(start,end) { 
        return this._text.slice(start,end);
    },

    addChr: function(chr,index) { 
        var text = this._text;
        var newText = ""
        newText = text.slice(0,index);
        newText += chr;
        newText +=  text.slice(index,text.length)
        this._setText(newText);
        this.renderText();
        return;
    },
    textLength: function() { 
        return this._text.length;
    },
    removeChr: function(index) {
        var text = this._text;
        var newText = "";
        newText = text.slice(0,index-1);
        newText +=  text.slice(index,text.length)
        this._setText(newText);
        this.renderText();
        return this.calculateDeficit();
    },
    calculateDeficit: function() { 
        var lineWidth = this.$line.width()-this.paddingRight;
        var textWidth = Line.strWidth(this._text);
        return lineWidth-textWidth;
    },
    _setText: function(text) { 
        this._text = text; 
        this.$text.text(text);
    },
    appendText: function(text) { 
        this._text +=text;
    },
    getText: function() { 
        return text;
    },
    appendTextAndRerender: function(text) {
        this.appendText(text);
        this.renderText();
    },
    sliceFromFront: function(width) { 
        var slice = "";
        var sliceWidth = 0;
        var i = 0;
        while(i < this._text.length && Line.strWidth(this._text[i])+sliceWidth < width) {
            slice += this._text[i];
            sliceWidth += Line.strWidth(this._text[i]);
            i++;
        }
        this._setText(this._text.slice(slice.length, this._text.length));
        return slice;
    }
}
