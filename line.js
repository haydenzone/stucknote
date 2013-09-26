function Line(paragraph) { 
    this.paragraph = paragraph;
    this.text = "";
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
        var temp = this.text.slice(0, index);
        return Line.strWidth(temp);
    },
    closestIndex: function(width) { 
        var widthToHere = 0;
        for(var i = 0; i < this.text.length; i++) { 
            var chr = this.text[i];
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
        var textHtml = this.text;
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
            while(textWidth + Line.strWidth(this.text[i]) < lineWidth && i < this.text.length) {
                textWidth += Line.strWidth(this.text[i]);
                i++;
            }
            overflow = this.text.slice(i,this.text.length);
        } else { //backward scan
            var textWidth = Line.strWidth(this.text);
            var i = this.text.length - 1;
            while(textWidth > lineWidth && i >= 0) {
                overflow = this.text[i] + overflow;
                textWidth -= Line.strWidth(this.text[i]);
                i--;
            }
        }
        return overflow;
    },
    spliceOverflow: function(forwardScan) { 
        if(!forwardScan) forwardScan = false;
        var overflow = this.getOverflow(forwardScan);
        this.text = this.text.slice(0, this.text.length-overflow.length);
        this.renderText();
        return overflow;
    },

    addChr: function(chr,index) { 
        var text = this.text;
        this.text = text.slice(0,index);
        this.text += chr;
        this.text +=  text.slice(index,text.length)
            this.renderText();
        return;
    },
    removeChr: function(index) {
        var text = this.text;
        this.text = text.slice(0,index-1);
        this.text +=  text.slice(index,text.length)
            this.renderText();
        return this.calculateDeficit();
    },
    calculateDeficit: function() { 
        var lineWidth = this.$line.width()-this.paddingRight;
        var textWidth = Line.strWidth(this.text);
        return lineWidth-textWidth;
    },
    _setText: function(text) { 
        this.text = text; 
        this.$text.text(text);
    },
    appendTextAndRerender: function(text) {
        this.text += text;
        this.renderText();
    },
    sliceFromFront: function(width) { 
        var slice = "";
        var sliceWidth = 0;
        var i = 0;
        while(i < this.text.length && Line.strWidth(this.text[i])+sliceWidth < width) {
            slice += this.text[i];
            sliceWidth += Line.strWidth(this.text[i]);
            i++;
        }
        this.text = this.text.slice(slice.length, this.text.length);
        return slice;
    }
}
