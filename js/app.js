function App(root) { 
	this.$root = root;
    this.keyPress = new KeyPress();
	this.notes = {};
	this.currentNote = -1;
	Paragraph.UID = 0;
	Note.UID = 0;
	var storedData = this.readLocalStorage();
	this.z = 0;
	this.storedPUIDs = {};
	if(storedData) { 
		var topNote = -1;
		_.each(storedData, function(note, uid) { 
			uid = parseInt(uid);
			if(uid >= Note.UID) { 
				Note.UID = uid+1;
			}
			var puids = _.chain(note.paragraphs).pluck(0).value();
			this.storedPUIDs[uid] = {};
			_.each(puids, function(puid){
				this.storedPUIDs[uid][puid] = 1;
			}.bind(this));
			var highestPUID = _.chain(puids).max().value(); 
			if( highestPUID >= Paragraph.UID) { 
				Paragraph.UID = highestPUID + 1;
			}
			var z = parseInt(note.specs['z-index']);
			if(z >= this.z) {
				this.z = z+1;
				topNote = uid;
			}
			this.newNote({
				uid: uid,
				paragraphs: note.paragraphs,
				style: note.specs
			});
			this.notes[this.currentNote].clearModifiedFlag();
		}.bind(this));
		this.selectNote(this.notes[topNote]); //select the note on top
	} else { 
		this.newNote();
	}
	//TODO: minify zindexes and apply
	setInterval(this.saveModifiedParagraphs.bind(this), 5000);
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
		var note = new Note($.extend({
			$root: this.$root,
			keyPress:this.keyPress
		}, extraArgs));
		this.notes[note.uid()] = note;
		this.currentNote = note.uid();
		this.notes[this.currentNote].click(this.selectNote.bind(this, this.notes[this.currentNote]));
		this.notes[this.currentNote].onClose(this.queueRemoval.bind(this, note.uid()));
		if(!_.has(extraArgs, 'style') || !_.has(extraArgs.style, 'z-index')){
			this.notes[this.currentNote].zindex(this.z++);
		}
		if(!_.has(this.storedPUIDs, note.uid())) {
			var uid = note.uid();
			this.storedPUIDs[uid] = {};
			_.each(note.paragraphUIDs(), function(puid){
				this.storedPUIDs[uid][puid] = 1;
			}.bind(this));
		}
	},
	selectNote: function(note) {
		if(note == this.notes[this.currentNote]) return;
		this.unselectCurNote();
		this.currentNote = note.uid();
		this.selectCurNote();
	},
	removeParagraphs: function(uid) { 
		localStorage.removeItem('paragraph/'+uid);
	},
	queueRemoval: function(uid) { 
		delete this.notes[uid];
	},
	removeNote: function(uid) { 
		console.log('removing', uid);
		var paragraphs = JSON.parse(localStorage['note/'+uid+'.paragraphs']);
		_.each(paragraphs, this.removeParagraphs.bind(this));
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
				notes[uid].paragraphs.push([parseInt(puid),this.read('paragraph', puid,null,true)]);
			}.bind(this));
		}.bind(this));
		return notes;
	},
	saveModifiedParagraphs: function() { 
		var currentNotes = _.map(this.notes, function(note) {
			return note.uid();
		});
		if(_.has(localStorage, 'notes')) {
			var notesInStorage = JSON.parse(localStorage.notes);
			var notesToDelete = _.difference(notesInStorage, currentNotes);
			_.each(notesToDelete, this.removeNote.bind(this));
		}
		localStorage.notes = JSON.stringify(currentNotes);
		var currentParagraphs = [];
		_.each(this.notes, function(note) {
			if(note.modified()) { 
				localStorage["note/"+note.uid()+".specs"] = JSON.stringify(note.specs());
			}
			if(note.textModified()) { 
				var puids = note.paragraphUIDs();
				var storedPUIDs = _.map(this.storedPUIDs[note.uid()], function(v, k) { return parseInt(k);});
				_.each(_.difference(storedPUIDs, puids), this.removeParagraphs.bind(this));
				localStorage["note/"+note.uid()+".paragraphs"] = JSON.stringify(puids);
				_.each(note.paragraphs, function(paragraph) { 
					if(paragraph.modified()) { 
						localStorage["paragraph/"+paragraph.uid()] = paragraph.getText();
						this.storedPUIDs[note.uid()][paragraph.uid()] = 1;
					}
				}.bind(this))
			}
			note.clearModifiedFlag();
		}.bind(this));
	}
}