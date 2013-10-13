function Note(args) { 
    this.$note = $('<div>').appendTo(args.$root);
    this.$closeButton = $('<img>').attr('src', 'img/x.png').addClass('close').click(this.close.bind(this));
    this.$note.append(this.$closeButton);
    this.keyPress = args.keyPress;
    var paragraphs = args.paragraphs || null;
    var uid;
    if(args.hasOwnProperty('uid')) { 
        uid = args.uid;
    } else {
        uid = Note.getUID();
    }
    var style = args.style || {};
    this.css(style);
    this.$note.append($("<div>").css({
    }).attr('class','handle'));
    this.$note.attr({
        'class': 'note'
    });
    this.clickCb = null;
    this._modified = true
    this._textModified = true;
    this.$note.draggable({
        handle: 'div.handle',
        start: function() { 
            if(this.clickCb) this.clickCb();
        }.bind(this),
        stop: function() {
            this._modified = true;
        }.bind(this)
    }).resizable({
        resize: this.rerender.bind(this),
        minWidth: 30,
        stop: function() {
            this._modified = true;
        }.bind(this)
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
    this.paragraphs = [];
    if(paragraphs) {
        //load the paragraphs
        var skip = true;
        _.each(paragraphs, function(p) { 
            this.createParagraph({
                uid: p[0],
                text: p[1],
                width: style.width
            });
            if(skip) {
                skip = false;
                this.currentParagraph = 0;
            } else { 
                this.currentParagraph++;
            }
        }.bind(this));
    } else {
        this.createParagraph({});
    }
    this.currentParagraph = 0;
    this.registerKeyboardListeners();
    this.registerListeners();
    this.selection = null;
    this.clickStart = {}
    this.uid = function() {
        return uid;
    }
}

Note.getUID = function() { 
    return Note.UID++;
}

Note.prototype = {
    onClose: function(f) { 
        this.closeCb = f;
    },
    close: function() { 
        this.destroy();
        if(_.has(this,'closeCb')) this.closeCb();
    },
    destroy: function() { 
        _.each(this.paragraphs, function(p) {
            p.destroy();
        });
        this.$note.remove();
    },
    css: function(style) { 
        this.$note.css(style);
    },
    modified: function() {
        return this._modified;
    },
    _setTextModified: function() { 
        this._textModified = true;
    },
    textModified: function() { 
        return this._textModified;
    },
    paragraphUIDs: function() { 
        return _.map(this.paragraphs, function(p) {
            return p.uid();
        })
    },
    clearModifiedFlag: function() {
        this._modified = false;
        this._textModified = false;
        _.each(this.paragraphs, function(p) {
            p.clearModifiedFlag();
        });
    },
    zindex: function(z) { 
        this.$note.css('z-index', z);
        this._modified = true;
    },
    click: function(cb) { 
        if(this.clickCb) throw('Currently only 1 click callback supported');
        this.clickCb = cb;
        this.$note.click(cb);
    },
    specs: function() { 
        return { 
            top: this.$note.css('top'),
            left: this.$note.css('left'),
            width: this.$note.css('width'),
            height: this.$note.css('height'),
            "z-index": this.$note.css('z-index')
        }
    },
    toggleCursor: function(show) { 
        this.cursor.toggle(show);
    },
    registerListeners: function() { 
        this.$copyHack.bind('cut', function(e) {
            console.log('cut');
            e = e.originalEvent;
            if(this.selecting()) { 
                var text = this.selection.getSelection();
                this.deleteSelection();
                e.clipboardData.setData('Text', text);
            }
            
            return false
        }.bind(this));
        this.$copyHack.bind('copy', function(e) {
            console.log('copy');
            e = e.originalEvent;
            if(this.selecting()) {
                selection = this.selection.getSelection();
                e.clipboardData.setData('Text', selection);
            }
            
            return false
        }.bind(this));
    },
    mousedown: function() { 
        if(this.selecting()) {
            this.clearSelection();
        }
    },
    paste: function(e) {
        console.log('paste');
        e = e.originalEvent;
        var pastedText = undefined;
        if (window.clipboardData && window.clipboardData.getData) { // IE
            pastedText = window.clipboardData.getData('Text');
        } else if (e.clipboardData && e.clipboardData.getData) {
            pastedText = e.clipboardData.getData('text/plain');
        }
        console.log(pastedText); // Process and handle text...
        return false;
    },
    selecting: function() { 
        return !!this.selection;
    },
    deleteSelection: function() { 
        var start = this.selection.orderBoundaries()[0];
        this.setCurParagraph(start.parIndex);
        this.cursor.setPosition(start);
        this.cursor.render();
        this.selection.clearSelection();
        this.selection.deleteSelection();
        this.selection = null;
        return;
    },
    clearSelection:function() {
        this.selection.clearSelection();
        this.selection = null;
    },
    sliceParagraphs: function(start, end) { 
        return this.paragraphs.slice(start,end);
    },
    createParagraph: function(extraArgs) { 
        var par = new Paragraph($.extend({
            note: this
        },extraArgs));
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
                    par: par,
                    parIndex: this.paragraphs.indexOf(par)
                };
            } else if(from == "move") { 
                if( !$.isEmptyObject(this.clickStart) &&(this.clickStart.line != line || this.clickStart.index != index || this.clickStart.par != par)) {
                    if(!this.selecting()) {
                        this.selection = new Selection({
                            start: this.clickStart,
                            end: {
                                line: line,
                                index: index,
                                par: par,
                                parIndex: this.paragraphs.indexOf(par)
                            },
                            note: this
                        });
                    } else { 
                        this.selection.setEnd({
                            line: line,
                            index: index,
                            par: par,
                            parIndex: this.paragraphs.indexOf(par)
                        });

                    }

                }
                if( !$.isEmptyObject(this.clickStart) ) { //Check if dragging
                    this.setCurParagraph(this.paragraphs.indexOf(par));
                    this.cursor.setPosition({
                        line: line,
                        index: index
                    }).render();
                }
            } else if(from == "up") { 
                if(this.clickStart.line != line || this.clickStart.index != index) {
                    this.$copyHack[0].select(); //Finish selection
                }
                this.setCurParagraph(this.paragraphs.indexOf(par));
                this.cursor.setPosition({
                    line: line,
                    index: index
                }).render();
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
        if(this.selecting()) { 
            this.deleteSelection();
        }
        var curPar = this.paragraphs[this.currentParagraph];
        var newPos = curPar.addChr(this.cursor.line, this.cursor.index,chr);
        this.cursor.setPosition(newPos).render();
    },
    backspace: function(e) { 
        var curPar = this.paragraphs[this.currentParagraph];
        if(this.selecting()) { 
            this.deleteSelection();
            return;
        }
        //Check if deleting at front of paragraph
        if(this.cursor.line == 0 && this.cursor.index == 0 ) {
            if(this.currentParagraph == 0) {
                return;
            }
            var parAbove = this.parAbove();
            var newPos = { 
                line: parAbove.lines.length-1,
                index: parAbove.lines[parAbove.lines.length-1].textLength()
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
        var prevPos = null
        if(this.keyPress.shift && !this.selecting()) { 
            prevPos = this.cursor.getPosition();
        }
        this.cursor.move(direction).render();
        if(!this.selecting() && this.keyPress.shift) {
            this.selection = new Selection({
                start: prevPos,
                end: this.cursor.getPosition(),
                note: this
            });
            this.selection.rerender();
            return;
        } 
       if(this.selecting()) { 
            if(this.keyPress.shift) { 
                this.selection.setEnd(this.cursor.getPosition());
            } else { 
                this.clearSelection();
            }
        }
    },
    enter: function(e) { 
        if(this.selecting()) { 
            this.deleteSelection();
        }
        this.createParagraph({});
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
        var events = ['charInput', 'backspace', 'arrow', 'enter','paste','mousedown'];
        if(!this.hasOwnProperty('events')) { 
            this.events = {};
            _.each(events, function(e) { 
                this.events[e] = this[e].bind(this)
            }.bind(this));
            
        }
        _.each(this.events, function(callback, eName) { 
            $(document).on(eName, callback);
        });
    },

    unregisterKeyboardListeners: function() { 
        _.each(this.events, function(callback, eName) { 
            $(document).off(eName, callback);
        });
    }
}
