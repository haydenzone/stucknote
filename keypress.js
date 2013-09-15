function KeyPress() { 
    $(document).keypress(function(e) { 
        var keyCode = e.keyCode;
        if( keyCode >= 32 && keyCode < 126 ) {
            var chr = String.fromCharCode(keyCode);
            $(document).trigger('charInput',[chr]);
        }
    });
    $(document).keydown(function(e) { 
        var keyCode = e.keyCode;
        var direction = '';
        switch(keyCode) {
            case 8:
                $(document).trigger('backspace');
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
                break;
        }
        if(direction != "") {
            $(document).trigger('arrow',[direction]);
        }

    });
}
