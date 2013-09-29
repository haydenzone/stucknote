function KeyPress() { 
    this.shift = false;
    $(document).keypress(function(e) { 
        var keyCode = e.which;
        if( keyCode >= 32 && keyCode < 126 ) {
            var chr = String.fromCharCode(keyCode);
            $(document).trigger('charInput',[chr]);
            if(debugging) keylog.push(['charInput',chr]);
        }
    });

    $(document).keyup(function(e) { 
        var keyCode = e.which;

        if(keyCode == 16) { 
            this.shift = false;
        }
    }.bind(this));

    $(document).keydown(function(e) { 
        var keyCode = e.which;
        var direction = '';
        switch(keyCode) {
            case 8:
                $(document).trigger('backspace');
                if(debugging) keylog.push(['backspace']);
                break;
            case 16:
                this.shift = true;
                break;
            case 40:
                direction = 'down';
                break;
            case 39:
                direction = 'right';
                break;
            case 38:
                direction = 'up';
                break;
            case 37:
                direction = 'left';
                break;
            case 13:
                $(document).trigger('enter');
                if(debugging) keylog.push(['enter']);
                break;
        }
        if(direction != "") {
            $(document).trigger('arrow',[direction]);
            if(debugging) keylog.push(['arrow',direction]);
        }

    }.bind(this));
}
