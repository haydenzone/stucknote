function App(root) { 
	this.$root = root;
    this.keyPress = new KeyPress();
	this.notes = [];
	this.currentNote = -1;
	Paragraph.UID = 0;
	Note.UID = 0;
	var storedData = this.readLocalStorage();
	this.z = 0;
	if(storedData) { 
		_.each(storedData, function(note, uid) { 
			uid = parseInt(uid);
			if(uid >= Note.UID) { 
				Note.UID = uid+1;
			}
			var highestPUID = _.chain(note.paragraphs).pluck(0).max().value(); 
			if( highestPUID >= Paragraph.UID) { 
				Paragraph.UID = highestPUID + 1;
			}
			if(note.specs['z-index'] > this.z) {
				this.z = note.specs['z-index']+1;
			}
			this.newNote({
				uid: uid,
				paragraphs: note.paragraphs,
				style: note.specs
			});
			this.notes[this.currentNote].clearModifiedFlag();
		}.bind(this));
	} else { 
		this.newNote();
	}
	//TODO: minify zindexes and apply
	setInterval(this.printModifiedParagraphs.bind(this), 5000);
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
	newNote: function(extraArgs) { 
		if(_.isUndefined(extraArgs)) extraArgs = {};
		if(this.currentNote != -1) {
			this.unselectCurNote();
		}
		this.notes.push(new Note($.extend({
			$root: this.$root,
			keyPress:this.keyPress
		}, extraArgs)));
		this.currentNote = this.notes.length-1;
		this.notes[this.currentNote].click(this.selectNote.bind(this, this.notes[this.currentNote]));
		this.notes[this.currentNote].zindex(this.z++);
	},
	selectNote: function(note) {
		if(note == this.notes[this.currentNote]) return;
		this.unselectCurNote();
		this.currentNote = this.notes.indexOf(note);
		this.selectCurNote();
	},
	removePargraphs: function(uid) { 
		localStorage.removeItem('paragraph/'+uid);
	},
	removeNote: function(uid) { 
		var paragraphs = JSON.parse(localStorage['note/'+uid+'.paragraphs']);
		_.each(paragraphs, this.removeParagraphs);
		localStorage.removeItem('note/'+uid+'.paragraphs');
		localStorage.removeItem('note/'+uid+'.specs');
	},
	read: function(entity, uid, attribute,noParse) {
		var query = entity;
		if(!_.isUndefined(uid)) {
			query +="/"+uid;
			if(typeof attribute !== 'undefined' && attribute) {
				query += "."+attribute;
			}
		}
		var stored = localStorage[query];
		if(_.isUndefined(stored)) { 
			return false;
		}
		if(typeof noParse !== 'undefined' && noParse) {
			return stored;
		} else {
			return JSON.parse(stored);
		}
	},
	readLocalStorage: function() { 
		var notesUIDs = this.read('notes');
		if(!notesUIDs) { 
			return false;
		}
		var notes = {};
		_.each(notesUIDs, function(uid) { 
			notes[uid] = {};
			notes[uid].specs = this.read('note',uid,'specs');
			notes[uid].paragraphs = [];
			_.each(this.read('note', uid,'paragraphs'), function(puid) { 
				notes[uid].paragraphs.push([puid,this.read('paragraph', puid,null,true)]);
			}.bind(this));
		}.bind(this));
		return notes;
	},
	printModifiedParagraphs: function() { 
		//Check for modified paragraphs
		localStorage.notes = JSON.stringify(_.map(this.notes, function(note) {
			return note.uid();
		}));
		_.each(this.notes, function(note) {
			if(note.modified()) { 
				localStorage["note/"+note.uid()+".specs"] = JSON.stringify(note.specs());
			}
			if(note.textModified()) { 
				localStorage["note/"+note.uid()+".paragraphs"] = JSON.stringify(note.paragraphUIDs());
				_.each(note.paragraphs, function(paragraph) { 
					if(paragraph.modified()) { 
						localStorage["paragraph/"+paragraph.uid()] = paragraph.getText();
					}
				})
			}
			note.clearModifiedFlag();
		})
	}
}