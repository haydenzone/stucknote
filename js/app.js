function App(root) { 
	this.$root = root;
    this.keyPress = new KeyPress();
	this.notes = [];
	this.currentNote = -1;
	this.newNote();
	this.z = 0;
}

App.prototype = {
	unselectCurNote: function() { 
		this.notes[this.currentNote].unregisterKeyboardListeners();
		this.notes[this.currentNote].toggleCursor(false);
	},
	selectCurNote: function() { 
		this.notes[this.currentNote].registerKeyboardListeners();
		this.notes[this.currentNote].toggleCursor(true);
		this.notes[this.currentNote].zindex(this.z++);
	},
	newNote: function() { 
		if(this.currentNote != -1) {
			this.unselectCurNote();
		}
		this.notes.push(new Note(this.$root,this.keyPress));
		this.currentNote = this.notes.length-1;
		this.notes[this.currentNote].click(this.selectNote.bind(this, this.notes[this.currentNote]));
		this.notes[this.currentNote].zindex(this.z++);
	},
	selectNote: function(note) {
		if(note == this.notes[this.currentNote]) return;
		this.unselectCurNote();
		this.currentNote = this.notes.indexOf(note);
		this.selectCurNote();
	}
}